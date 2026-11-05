/* ==========================================================================
   DOKO — Analítica (Google Analytics de Firebase, proyecto doko-cocina)
   Mide el recorrido de los clientes: qué productos abren, qué agregan al
   carrito y cuántos pedidos envían por WhatsApp. No se envían nombres,
   direcciones, notas ni ningún otro dato del cliente.

   Solo mide en la página publicada. En el computador (localhost) los eventos
   se muestran en la consola; para probar el envío real agrega ?analitica.
   Si Analytics no carga (sin internet, bloqueador de anuncios…), la página
   funciona exactamente igual.
   ========================================================================== */

// Configuración pública por diseño: va dentro de la página.
const FIREBASE = {
  apiKey: 'AIzaSyBPggpMtOr_1UVgWf2Pw4KMVEBfaXeFIvE',
  authDomain: 'doko-cocina.firebaseapp.com',
  projectId: 'doko-cocina',
  storageBucket: 'doko-cocina.firebasestorage.app',
  messagingSenderId: '407485817800',
  appId: '1:407485817800:web:8c5c3aefc555e2c32296fd',
  measurementId: 'G-VT6QTRKD4L',
};

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const DOMINIO = 'dokofoodwebsite.netlify.app';
const ACTIVA = location.hostname === DOMINIO || new URLSearchParams(location.search).has('analitica');

let enviar = null; // se asigna cuando Analytics termina de cargar
let pendientes = []; // eventos ocurridos antes de que cargara (null si no cargó)

async function iniciar() {
  try {
    const [{ initializeApp }, an] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-analytics.js`),
    ]);
    if (!(await an.isSupported())) throw new Error('Analytics no disponible en este navegador');
    const analytics = an.getAnalytics(initializeApp(FIREBASE));
    enviar = (nombre, datos) => an.logEvent(analytics, nombre, datos);
    pendientes.forEach(([nombre, datos]) => enviar(nombre, datos));
  } catch {
    /* sin analítica: la página sigue funcionando igual */
  }
  pendientes = null;
}

if (ACTIVA) iniciar();

/** Registra un evento de Analytics (nombres recomendados de GA4: view_item, add_to_cart…). */
export function medir(nombre, datos = {}) {
  if (!ACTIVA) return console.debug('[analítica]', nombre, datos);
  if (enviar) enviar(nombre, datos);
  else pendientes?.push([nombre, datos]);
}
