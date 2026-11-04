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
  };
}

/* ------------------------------ Modo de prueba ----------------------------- */
function fuenteDemo() {
  const KEY = 'doko.cocina.demo';
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel('doko-cocina') : null;
  const leer = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { contadores: {}, pedidos: {} };
    } catch {
      return { contadores: {}, pedidos: {} };
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
  };
}

export async function conectar(config, clave) {
  return config ? fuenteFirebase(config, clave) : fuenteDemo();
}
