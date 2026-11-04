/* ==========================================================================
   DOKO Cocina — Configuración
   --------------------------------------------------------------------------
   Pega aquí la configuración de tu proyecto de Firebase (Consola de Firebase →
   Configuración del proyecto → Tus apps → App web → "firebaseConfig").
   Mientras sea null, el panel funciona en MODO DE PRUEBA: los pedidos solo se
   guardan en el navegador donde se crean (sirve para probar, no para la cocina).
   ========================================================================== */

// Esta configuración es pública por diseño (va dentro de la página); lo que protege
// los pedidos son las reglas de Firestore con la clave de acceso.
export const FIREBASE = {
  apiKey: 'AIzaSyBPggpMtOr_1UVgWf2Pw4KMVEBfaXeFIvE',
  authDomain: 'doko-cocina.firebaseapp.com',
  projectId: 'doko-cocina',
  storageBucket: 'doko-cocina.firebasestorage.app',
  messagingSenderId: '407485817800',
  appId: '1:407485817800:web:8659987129fad2832296fd',
};
