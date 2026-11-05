/* ==========================================================================
   DOKO Cocina — Datos de los pedidos
   Dos fuentes con la misma interfaz:
   - Firebase Firestore: pedidos compartidos en tiempo real entre todos los
     dispositivos que tengan el enlace con la clave.
   - Modo de prueba: guarda en este navegador (y sincroniza entre sus pestañas).
   ========================================================================== */

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export class Conflicto extends Error {
  constructor(actual) {
    super('El pedido cambió mientras lo editabas');
    this.actual = actual;
  }
}

/* --------------------------- Firebase Firestore --------------------------- */
async function fuenteFirebase(config, clave) {
  const [{ initializeApp }, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(config);
  let db;
  try {
    // Caché local: si se cae el internet, el panel sigue mostrando los pedidos
    // y los cambios de estado se envían cuando vuelve la conexión.
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch {
    db = fs.getFirestore(app);
  }
  const pedidos = fs.collection(db, 'cocinas', clave, 'pedidos');
  const estadoJornada = fs.doc(db, 'cocinas', clave, 'estado', 'jornada');

  return {
    modo: 'firebase',

    escuchar(fecha, alCambiar, alEstado) {
      const q = fs.query(pedidos, fs.where('fecha', '==', fecha));
      return fs.onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          alEstado(snap.metadata.fromCache ? 'sin-conexion' : 'en-linea');
          alCambiar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => alEstado(err.code === 'permission-denied' ? 'clave-invalida' : 'error', err)
      );
    },

    // El número consecutivo del día se asigna dentro de una transacción para
    // que dos personas creando pedidos a la vez nunca reciban el mismo número.
    crear(fecha, datos) {
      return fs.runTransaction(db, async (tx) => {
        const contador = fs.doc(db, 'cocinas', clave, 'contadores', fecha);
        const snap = await tx.get(contador);
        const numero = (snap.exists() ? snap.data().n : 0) + 1;
        const id = `${fecha}_${numero}`;
        tx.set(contador, { n: numero });
        tx.set(fs.doc(pedidos, id), { ...datos, numero, fecha, rev: 1 });
        return { id, numero };
      });
    },

    // Con revEsperada se comprueba que nadie haya editado el pedido entretanto.
    actualizar(id, cambios, revEsperada = null) {
      const ref = fs.doc(pedidos, id);
      if (revEsperada === null) return fs.updateDoc(ref, cambios);
      return fs.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Conflicto(null);
        const actual = { id, ...snap.data() };
        if (actual.rev !== revEsperada) throw new Conflicto(actual);
        tx.update(ref, { ...cambios, rev: revEsperada + 1 });
      });
    },

    eliminar(id) {
      return fs.deleteDoc(fs.doc(pedidos, id));
    },

    /* ---- Jornada: el día de trabajo abierto lo comparten todos los dispositivos ---- */
    escucharJornada(alCambiar, alError) {
      return fs.onSnapshot(estadoJornada, (snap) => alCambiar(snap.exists() ? snap.data() : null), alError);
    },

    abrirJornadaSiFalta(fecha, abiertaEn) {
      return fs.runTransaction(db, async (tx) => {
        const snap = await tx.get(estadoJornada);
        if (!snap.exists()) tx.set(estadoJornada, { fecha, abiertaEn });
      });
    },

    // Guarda el resumen del día y abre la jornada siguiente en una sola operación.
    // Si otro dispositivo ya la cerró, no se cierra dos veces.
    cerrarJornada(fecha, registro, siguiente) {
      return fs.runTransaction(db, async (tx) => {
        const snap = await tx.get(estadoJornada);
        if (!snap.exists() || snap.data().fecha !== fecha) throw new Conflicto(snap.exists() ? snap.data() : null);
        tx.set(fs.doc(db, 'cocinas', clave, 'jornadas', fecha), registro);
        tx.set(estadoJornada, siguiente);
      });
    },

    async pedidosDe(fecha) {
      const snap = await fs.getDocs(fs.query(pedidos, fs.where('fecha', '==', fecha)));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async jornadaDe(fecha) {
      const snap = await fs.getDoc(fs.doc(db, 'cocinas', clave, 'jornadas', fecha));
      return snap.exists() ? snap.data() : null;
    },
  };
}

/* ------------------------------ Modo de prueba ----------------------------- */
function fuenteDemo() {
  const KEY = 'doko.cocina.demo';
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel('doko-cocina') : null;
  const leer = () => {
    const vacio = { contadores: {}, pedidos: {}, jornada: null, jornadas: {} };
    try {
      return { ...vacio, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch {
      return vacio;
    }
  };
  const oyentes = new Set();
  const avisar = () => oyentes.forEach((f) => f());
  const guardar = (db) => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ }
    canal?.postMessage('cambio');
    avisar();
  };
  canal?.addEventListener('message', avisar);
  window.addEventListener('storage', (e) => e.key === KEY && avisar());

  return {
    modo: 'demo',

    escuchar(fecha, alCambiar, alEstado) {
      const emitir = () => alCambiar(Object.values(leer().pedidos).filter((p) => p.fecha === fecha));
      oyentes.add(emitir);
      alEstado('en-linea');
      emitir();
      return () => oyentes.delete(emitir);
    },

    async crear(fecha, datos) {
      const db = leer();
      const numero = (db.contadores[fecha] || 0) + 1;
      const id = `${fecha}_${numero}`;
      db.contadores[fecha] = numero;
      db.pedidos[id] = { id, ...datos, numero, fecha, rev: 1 };
      guardar(db);
      return { id, numero };
    },

    async actualizar(id, cambios, revEsperada = null) {
      const db = leer();
      const actual = db.pedidos[id];
      if (!actual) throw new Conflicto(null);
      if (revEsperada !== null && actual.rev !== revEsperada) throw new Conflicto(actual);
      db.pedidos[id] = { ...actual, ...cambios, rev: revEsperada === null ? actual.rev : revEsperada + 1 };
      guardar(db);
    },

    async eliminar(id) {
      const db = leer();
      delete db.pedidos[id];
      guardar(db);
    },

    escucharJornada(alCambiar) {
      const emitir = () => alCambiar(leer().jornada);
      oyentes.add(emitir);
      emitir();
      return () => oyentes.delete(emitir);
    },

    async abrirJornadaSiFalta(fecha, abiertaEn) {
      const db = leer();
      if (!db.jornada) {
        db.jornada = { fecha, abiertaEn };
        guardar(db);
      }
    },

    async cerrarJornada(fecha, registro, siguiente) {
      const db = leer();
      if (!db.jornada || db.jornada.fecha !== fecha) throw new Conflicto(db.jornada);
      db.jornadas[fecha] = registro;
      db.jornada = siguiente;
      guardar(db);
    },

    async pedidosDe(fecha) {
      return Object.values(leer().pedidos).filter((p) => p.fecha === fecha);
    },

    async jornadaDe(fecha) {
      return leer().jornadas[fecha] || null;
    },
  };
}

// Con ?demo en la dirección se usa siempre el modo de prueba (para practicar sin tocar los pedidos reales).
export async function conectar(config, clave, demo = false) {
  return config && !demo ? fuenteFirebase(config, clave) : fuenteDemo();
}
