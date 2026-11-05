/* ==========================================================================
   DOKO Cocina — panel de pedidos compartido entre caja y cocina.
   Usa la misma carta de la página web (../js/menu.js).
   ========================================================================== */
import { CONFIG, CATEGORIES, PRODUCTS, EXTRAS } from '../js/menu.js';
import { FIREBASE } from './config.js';
import { conectar, Conflicto } from './datos.js';
import { resumirVentas, descargarExcel, fechaLarga } from './reporte.js';
import { crearSalida, campanita } from './sonido.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LS = { clave: 'doko.cocina.clave', nombre: 'doko.cocina.nombre', sonido: 'doko.cocina.sonido' };
const ESTADOS = ['nuevo', 'preparando', 'listo', 'entregado', 'cancelado'];
const SIGUIENTE = { nuevo: 'preparando', preparando: 'listo', listo: 'entregado' };
const ANTERIOR = { preparando: 'nuevo', listo: 'preparando', entregado: 'listo', cancelado: 'nuevo' };
const MARCA_TIEMPO = { preparando: 'iniciadoEn', listo: 'listoEn', entregado: 'entregadoEn', cancelado: 'canceladoEn' };
const BOTON = { nuevo: ['Empezar', 'btn--gold'], preparando: ['Listo', 'btn--ok'], listo: ['Entregado', 'btn--primary'] };

const productos = PRODUCTS.filter((p) => p.available !== false);
const productoPorId = Object.fromEntries(productos.map((p) => [p.id, p]));

/* ---------- Utilidades ---------- */
const money = (n) => '$' + Math.round(n).toLocaleString('es-CO');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
// Identifica esta pestaña: así no suena el aviso de un cambio que hizo uno mismo
const DISPOSITIVO = (() => {
  try {
    let id = sessionStorage.getItem('doko.cocina.dispositivo');
    if (!id) sessionStorage.setItem('doko.cocina.dispositivo', (id = Math.random().toString(36).slice(2, 10)));
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
})();
/* ---------- Hora exacta de Colombia ----------
   Se corrige con la hora del servidor por si el reloj del dispositivo está mal. */
let desfase = 0;
const ahora = () => Date.now() + desfase;
async function sincronizarHora() {
  try {
    const t0 = Date.now();
    const r = await fetch(`manifest.webmanifest?hora=${t0}`, { method: 'HEAD', cache: 'no-store' });
    const t1 = Date.now();
    const servidor = Date.parse(r.headers.get('date'));
    // El encabezado Date tiene precisión de 1 s: solo se corrige si el desfase es notable
    const d = servidor + 500 - (t0 + t1) / 2;
    if (Number.isFinite(d)) desfase = Math.abs(d) > 1500 ? d : 0;
  } catch { /* sin conexión: se usa el reloj del dispositivo */ }
}
const hoyColombia = () => new Date(ahora() - 5 * 3600e3).toISOString().slice(0, 10);
const sumarDia = (fecha) => new Date(Date.parse(`${fecha}T12:00:00Z`) + 86400e3).toISOString().slice(0, 10);
const restarDia = (fecha) => new Date(Date.parse(`${fecha}T12:00:00Z`) - 86400e3).toISOString().slice(0, 10);
const hora = (ms) => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ICON = {
  menos: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  atras: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
};
const precioUnidad = (it) => it.precio + it.extras.reduce((s, e) => s + e.precio, 0);
const totalItems = (items) => items.reduce((s, it) => s + precioUnidad(it) * it.cantidad, 0);

function toast(texto, tipo = '') {
  const el = document.createElement('div');
  el.className = `toast ${tipo ? 'toast--' + tipo : ''}`;
  el.textContent = texto;
  $('[data-toasts]').append(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Estado ---------- */
const estado = {
  fuente: null,
  fecha: null, // fecha de la jornada abierta (la comparten todos los dispositivos)
  jornada: null,
  pedidos: [],
  previos: null, // estado y versión de cada pedido ya mostrado (para avisar solo de los cambios)
  nombre: leer(LS.nombre) || '',
  sonido: leer(LS.sonido) !== '0', // encendido salvo que alguien lo apague
  cancelar: null,
};

/* ==========================================================================
   Acceso: clave (en el enlace #k=...) y nombre de quien usa el dispositivo
   ========================================================================== */
function claveDelEnlace() {
  const m = location.hash.match(/k=([\w-]+)/);
  if (m) {
    escribir(LS.clave, m[1]);
    history.replaceState(null, '', location.pathname + location.search); // que la clave no quede a la vista
  }
  return leer(LS.clave);
}

function pantalla({ titulo, texto, placeholder, valor = '', rapidas = [], tipo = 'text' }) {
  return new Promise((resolve) => {
    const gate = $('[data-gate]');
    const form = $('[data-gate-form]');
    const input = $('[data-gate-input]');
    $('[data-gate-title]').textContent = titulo;
    $('[data-gate-text]').textContent = texto;
    input.type = tipo;
    input.placeholder = placeholder;
    input.value = valor;
    $('[data-gate-quick]').innerHTML = rapidas.map((r) => `<button class="btn btn--sm" type="button" data-rapida="${esc(r)}">${esc(r)}</button>`).join('');
    gate.hidden = false;
    setTimeout(() => input.focus(), 50);
    const listo = (v) => {
      gate.hidden = true;
      form.onsubmit = null;
      resolve(v.trim());
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (input.value.trim()) listo(input.value);
    };
    $('[data-gate-quick]').onclick = (e) => {
      const b = e.target.closest('[data-rapida]');
      if (b) listo(b.dataset.rapida);
    };
  });
}

async function pedirClave(texto = 'Pega aquí la clave de acceso o abre el enlace que te enviaron.') {
  let v = await pantalla({ titulo: 'Acceso a la cocina', texto, placeholder: 'Clave de acceso', tipo: 'password' });
  const m = v.match(/k=([\w-]+)/);
  if (m) v = m[1];
  escribir(LS.clave, v);
  return v;
}

async function pedirNombre() {
  const v = await pantalla({
    titulo: '¿Quién usa este dispositivo?',
    texto: 'Tu nombre aparece en los pedidos que creas o cambias.',
    placeholder: 'Ej: Daniel',
    valor: estado.nombre,
    rapidas: ['Caja', 'Cocina', 'Domicilios'],
  });
  estado.nombre = v.slice(0, 30);
  escribir(LS.nombre, estado.nombre);
  $('[data-mi-nombre]').textContent = estado.nombre;
}

/* ==========================================================================
   Conexión y sincronización en tiempo real
   ========================================================================== */
function mostrarConexion(e) {
  const el = $('[data-conexion]');
  const txt = { 'en-linea': 'En línea', 'sin-conexion': 'Sin conexión: se guardará al volver', error: 'Error de conexión', 'clave-invalida': 'Clave incorrecta' }[e] || 'Conectando…';
  el.classList.toggle('is-ok', e === 'en-linea');
  el.classList.toggle('is-warn', e === 'sin-conexion');
  el.classList.toggle('is-bad', e === 'error' || e === 'clave-invalida');
  $('span', el).textContent = estado.fuente?.modo === 'demo' && e === 'en-linea' ? 'Modo de prueba' : txt;
}

async function claveInvalida() {
  if (estado.pidiendoClave) return;
  estado.pidiendoClave = true;
  estado.cancelar?.();
  estado.cancelarJornada?.();
  mostrarConexion('clave-invalida');
  await pedirClave('La clave no es correcta. Revisa el enlace que te enviaron.');
  location.reload();
}

function escuchar() {
  estado.cancelar?.();
  estado.cancelar = estado.fuente.escuchar(estado.fecha, recibir, (e) => {
    mostrarConexion(e);
    if (e === 'clave-invalida') claveInvalida();
  });
}

/* La jornada abierta la comparten todos: cuando alguien la cierra, todos los
   dispositivos se reinician solos para empezar el día siguiente. */
async function alCambiarJornada(j) {
  if (!j) {
    if (!estado.fecha) {
      estado.fecha = hoyColombia();
      escuchar();
    }
    estado.fuente.abrirJornadaSiFalta(estado.fecha, ahora()).catch(() => {});
    return;
  }
  if (estado.jornada && j.fecha !== estado.jornada.fecha) {
    if (!estado.cerrandoYo) toast(`La jornada fue cerrada. Reiniciando para el ${fechaLarga(j.fecha)}…`, 'ok');
    setTimeout(() => location.reload(), 2500);
    return;
  }
  estado.jornada = j;
  if (estado.fecha !== j.fecha) {
    estado.fecha = j.fecha;
    estado.previos = null;
    escuchar();
  }
  pintarJornada();
}

// ¿El cambio lo hizo otro dispositivo? (los pedidos viejos solo traen el nombre)
const deOtro = (dispositivo, nombre) => (dispositivo ? dispositivo !== DISPOSITIVO : nombre !== estado.nombre);

// Avisos: nuevo pedido = 3 campanitas, listo = 2, entregado / cancelado / editado = 1
function recibir(lista) {
  const antes = estado.previos;
  estado.previos = new Map(lista.map((p) => [p.id, { estado: p.estado, rev: p.rev }]));
  if (antes) {
    for (const p of lista) {
      const previo = antes.get(p.id);
      const cliente = p.cliente ? ' · ' + p.cliente : '';
      if (!previo) {
        if (deOtro(p.creadoDispositivo, p.creadoPor)) avisar(`Nuevo pedido #${p.numero}${cliente}`, p.id, 3);
      } else if (previo.estado !== p.estado) {
        if (!deOtro(p.actualizadoDispositivo, p.actualizadoPor)) continue;
        if (p.estado === 'listo') avisar(`Pedido #${p.numero} LISTO para entregar${cliente}`, p.id, 2);
        else if (p.estado === 'entregado') avisar(`Pedido #${p.numero} entregado`, p.id, 1);
        else if (p.estado === 'cancelado') avisar(`Pedido #${p.numero} CANCELADO`, p.id, 1);
      } else if (p.rev > previo.rev && deOtro(p.editadoDispositivo, p.editadoPor)) {
        avisar(`Pedido #${p.numero} editado por ${p.editadoPor || 'alguien'}`, p.id, 1);
      }
    }
  }
  estado.pedidos = lista;
  pintarTablero();
  pintarJornada();
  if (editor.id) avisarSiCambioMientrasEdita();
}

/* ---------- Sonido, vibración y pantalla encendida ---------- */
let audio = null;
let salida = null;

// Los navegadores solo dejan sonar después de que alguien toca la pantalla
function prepararAudio() {
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      salida = crearSalida(audio);
    }
    if (audio.state !== 'running') audio.resume().then(pintarSonido, () => {});
  } catch { /* sin audio */ }
}

function pitar(veces = 1) {
  if (!estado.sonido) return;
  prepararAudio();
  try { campanita(audio, salida, veces); } catch { /* sin audio */ }
  navigator.vibrate?.(Array.from({ length: veces }, () => [220, 120]).flat());
}

function avisar(texto, id, veces = 1) {
  toast(texto, 'ok');
  pitar(veces);
  requestAnimationFrame(() => $(`[data-pedido="${id}"]`)?.classList.add('is-flash'));
}

// Con el sonido encendido, la pantalla no se apaga sola (si el navegador lo permite)
let bloqueoPantalla = null;
async function mantenerPantalla() {
  if (!estado.sonido || document.visibilityState !== 'visible' || bloqueoPantalla || !navigator.wakeLock) return;
  try {
    bloqueoPantalla = await navigator.wakeLock.request('screen');
    bloqueoPantalla.addEventListener('release', () => { bloqueoPantalla = null; });
  } catch { /* no permitido */ }
}

function pintarSonido() {
  $('[data-sonido]').setAttribute('aria-pressed', estado.sonido);
  $('[data-activar-sonido]').hidden = !estado.sonido || audio?.state === 'running';
}

function setupSonido() {
  $('[data-sonido]').addEventListener('click', () => {
    estado.sonido = !estado.sonido;
    escribir(LS.sonido, estado.sonido ? '1' : '0');
    if (estado.sonido) pitar(1); // prueba del volumen
    else bloqueoPantalla?.release();
    pintarSonido();
    mantenerPantalla();
  });
  $('[data-activar-sonido]').addEventListener('click', () => pitar(1));
  // Cualquier toque desbloquea el audio y mantiene la pantalla encendida
  const desbloquear = () => {
    if (estado.sonido) prepararAudio();
    mantenerPantalla();
  };
  document.addEventListener('pointerdown', desbloquear);
  document.addEventListener('keydown', desbloquear);
  document.addEventListener('visibilitychange', mantenerPantalla);
  pintarSonido();
}

/* ==========================================================================
   Tablero
   ========================================================================== */
function minutosDesde(ms) {
  return Math.max(0, Math.floor((ahora() - ms) / 60000));
}

function tarjeta(p) {
  const activo = p.estado in SIGUIENTE;
  const min = minutosDesde(p.creadoEn);
  const claseTiempo = !activo ? '' : min >= 25 ? 'is-late' : min >= 15 ? 'is-warn' : '';
  const tiempo = activo ? `${min} min` : hora(p[MARCA_TIEMPO[p.estado]] || p.actualizadoEn || p.creadoEn);
  const editado = p.editadoEn && p.estado !== 'nuevo' && p.editadoEn > (p.iniciadoEn || 0)
    ? `<span class="order__badge">EDITADO ${esc(hora(p.editadoEn))}</span>` : '';
  const cancelado = p.estado === 'cancelado' ? '<span class="order__badge order__badge--cancel">CANCELADO</span>' : '';
  const lugar = p.tipo === 'domicilio' ? [p.barrio, p.direccion].filter(Boolean).join(' · ') : 'Recoge en DOKO';
  const items = p.items.map((it) => {
    const det = [...(it.opciones || []), ...it.extras.map((e) => '+ ' + e.nombre)].map(esc).join(' · ');
    return `<li><span class="order__qty">${it.cantidad}×</span><span class="order__name">${esc(it.nombre)}</span>
      ${det || it.nota ? `<span class="order__det">${det}${it.nota ? `${det ? ' · ' : ''}<em>“${esc(it.nota)}”</em>` : ''}</span>` : ''}</li>`;
  }).join('');
  const [txtBoton, claseBoton] = BOTON[p.estado] || [];
  const acciones = [
    ANTERIOR[p.estado] ? `<button class="btn btn--sm btn--ghost" data-accion="atras" title="Devolver a ${ANTERIOR[p.estado]}">${ICON.atras}</button>` : '',
    p.estado !== 'cancelado' && p.estado !== 'entregado' ? '<button class="btn btn--sm btn--ghost" data-accion="editar">Editar</button>' : '',
    txtBoton ? `<button class="btn btn--sm btn--main ${claseBoton}" data-accion="avanzar">${txtBoton}</button>` : '',
  ].join('');
  return `
    <article class="order" data-pedido="${esc(p.id)}" data-estado="${p.estado}">
      <div class="order__head">
        <span class="order__num">#${p.numero}</span>
        <span class="order__tipo">${p.tipo === 'domicilio' ? '🛵 Domicilio' : '🛍️ Recoger'}</span>
        <span class="order__time ${claseTiempo}">${tiempo}</span>
      </div>
      <div class="order__cliente"><strong>${esc(p.cliente || 'Sin nombre')}</strong>${lugar ? ' · ' + esc(lugar) : ''}${p.telefono ? ' · ' + esc(p.telefono) : ''}${editado}${cancelado}</div>
      <ul class="order__items">${items}</ul>
      ${p.notas ? `<div class="order__nota">📝 ${esc(p.notas)}</div>` : ''}
      <div class="order__foot">
        <span class="order__total">${money(p.total)}${p.pago ? ' · ' + esc(p.pago) : ''}</span>
        <div class="order__actions">${acciones}</div>
      </div>
      <div class="order__meta">Creado por ${esc(p.creadoPor || '—')} a las ${esc(hora(p.creadoEn))}${p.actualizadoPor && p.actualizadoEn !== p.creadoEn ? ` · último cambio: ${esc(p.actualizadoPor)}` : ''}${p.estado === 'cancelado' ? ' · <button class="btn btn--sm btn--ghost" data-accion="eliminar">Eliminar</button>' : ''}</div>
    </article>`;
}

function pintarTablero() {
  const grupos = { nuevo: [], preparando: [], listo: [], historial: [] };
  for (const p of estado.pedidos) (grupos[p.estado] || grupos.historial).push(p);
  for (const k of ['nuevo', 'preparando', 'listo']) grupos[k].sort((a, b) => a.creadoEn - b.creadoEn);
  grupos.historial.sort((a, b) => (b.actualizadoEn || 0) - (a.actualizadoEn || 0));
  const vacio = { nuevo: 'No hay pedidos nuevos', preparando: 'Nada en preparación', listo: 'Nada listo para entregar', historial: 'Todavía no hay pedidos entregados hoy' };
  for (const [k, lista] of Object.entries(grupos)) {
    $(`[data-list="${k}"]`).innerHTML = lista.length ? lista.map(tarjeta).join('') : `<div class="empty">${vacio[k]}</div>`;
    $(`[data-count="${k}"]`).textContent = lista.length;
  }
  $('[data-count="nuevo"]').classList.toggle('has', grupos.nuevo.length > 0);
  document.title = grupos.nuevo.length ? `(${grupos.nuevo.length}) DOKO Cocina` : 'DOKO Cocina';
}

async function cambiarEstado(p, nuevoEstado) {
  const t = ahora();
  const cambios = { estado: nuevoEstado, actualizadoEn: t, actualizadoPor: estado.nombre, actualizadoDispositivo: DISPOSITIVO };
  if (MARCA_TIEMPO[nuevoEstado]) cambios[MARCA_TIEMPO[nuevoEstado]] = t;
  try {
    await estado.fuente.actualizar(p.id, cambios);
  } catch (e) {
    console.error(e);
    toast('No se pudo cambiar el pedido. Revisa la conexión.', 'bad');
  }
}

function setupTablero() {
  $('.board').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const p = estado.pedidos.find((x) => x.id === b.closest('[data-pedido]').dataset.pedido);
    if (!p) return;
    const accion = b.dataset.accion;
    if (accion === 'avanzar') cambiarEstado(p, SIGUIENTE[p.estado]);
    else if (accion === 'atras') cambiarEstado(p, ANTERIOR[p.estado]);
    else if (accion === 'editar') abrirEditor(p);
    else if (accion === 'eliminar' && confirm(`¿Eliminar definitivamente el pedido #${p.numero}?`)) {
      estado.fuente.eliminar(p.id).catch(() => toast('No se pudo eliminar', 'bad'));
    }
  });

  $('.tabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    document.body.dataset.vista = t.dataset.tab;
    $$('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', x === t));
  });

  // Los minutos de espera y el aviso de la jornada se actualizan solos
  setInterval(() => {
    pintarTablero();
    pintarJornada();
  }, 30000);
}

/* ==========================================================================
   Editor: crear y editar pedidos con los productos de la carta
   ========================================================================== */
const editor = { id: null, rev: null, numero: null, items: [], tipo: 'domicilio', pago: CONFIG.paymentMethods[0], cat: CATEGORIES[0].id, config: null };
const dialogo = $('[data-editor]');
const form = $('[data-datos]');

function abrirEditor(p = null) {
  Object.assign(editor, {
    id: p?.id || null,
    rev: p?.rev ?? null,
    numero: p?.numero || null,
    items: p ? structuredClone(p.items) : [],
    tipo: p?.tipo || 'domicilio',
    pago: p?.pago || CONFIG.paymentMethods[0],
    cat: CATEGORIES[0].id,
    config: null,
    avisado: false,
  });
  form.reset();
  for (const k of ['cliente', 'telefono', 'direccion', 'barrio', 'notas']) form.elements[k].value = p?.[k] || '';
  $('[data-editor-title]').textContent = p ? `Editar pedido #${p.numero}` : 'Nuevo pedido';
  $('[data-guardar]').textContent = p ? 'Guardar cambios' : 'Enviar a cocina';
  $('[data-eliminar]').hidden = !p;
  $('[data-eliminar]').textContent = p ? 'Cancelar pedido' : 'Eliminar';
  $('[data-buscar]').value = '';
  mostrarPanel(p ? 'pedido' : 'catalogo');
  cerrarConfig();
  pintarCatalogo();
  pintarPedido();
  dialogo.showModal();
}

function mostrarPanel(nombre) {
  $('[data-editor-body]').dataset.pane = nombre;
  $$('[data-pane]').forEach((b) => b.setAttribute('aria-selected', b.dataset.pane === nombre));
}

/* ---------- Catálogo ---------- */
function pintarCatalogo() {
  const q = normal($('[data-buscar]').value.trim());
  $('[data-cats]').innerHTML = CATEGORIES.map((c) => `<button type="button" data-cat="${c.id}" aria-selected="${!q && editor.cat === c.id}">${esc(c.name)}</button>`).join('');
  const lista = productos.filter((p) => (q ? normal(`${p.name} ${p.desc}`).includes(q) : p.category === editor.cat));
  const enPedido = {};
  editor.items.forEach((it) => (enPedido[it.pid] = (enPedido[it.pid] || 0) + it.cantidad));
  $('[data-prods]').innerHTML = lista.length
    ? lista.map((p) => `
      <div class="prod" data-prod="${p.id}" role="button" tabindex="0">
        <span class="prod__name">${esc(p.name)}${p.category !== 'adicionales' ? `<small>${esc(p.desc)}</small>` : ''}</span>
        ${enPedido[p.id] ? `<span class="prod__count">×${enPedido[p.id]}</span>` : ''}
        <span class="prod__price">${money(p.price)}</span>
        <button class="prod__add" type="button" data-rapido="${p.id}" aria-label="Agregar ${esc(p.name)}">${ICON.mas}</button>
      </div>`).join('')
    : '<div class="items__empty">No hay productos con esa búsqueda</div>';
}

function itemBase(p) {
  return { pid: p.id, nombre: p.category === 'adicionales' ? `Adicional: ${p.name}` : p.name, precio: p.price, cantidad: 1, opciones: (p.options || []).map((g) => g.choices[0]), extras: [], nota: '' };
}

function agregarItem(item) {
  const clave = (it) => [it.pid, it.opciones.join('/'), it.extras.map((e) => e.id).sort().join('+'), it.nota].join('|');
  const igual = editor.items.find((it) => clave(it) === clave(item));
  if (igual) igual.cantidad += item.cantidad;
  else editor.items.push(item);
  pintarPedido();
  pintarCatalogo();
  toast(`${item.cantidad > 1 ? item.cantidad + '× ' : ''}${item.nombre} agregado`);
}

/* ---------- Configurar un producto (opciones, adicionales, nota, cantidad) ---------- */
function abrirConfig(pid, indice = null) {
  const p = productoPorId[pid];
  if (!p) return;
  const item = indice !== null ? structuredClone(editor.items[indice]) : itemBase(p);
  editor.config = { pid, indice, item };
  const extras = (p.extras || []).filter((id) => EXTRAS[id]);
  $('[data-config]').innerHTML = `
    <button class="btn btn--sm btn--ghost config__back" type="button" data-config-cerrar>${ICON.atras} Volver a la carta</button>
    <div><div class="config__title">${esc(p.name)} · ${money(p.price)}</div><p class="config__desc">${esc(p.desc)}</p></div>
    ${(p.options || []).map((g, gi) => `
      <div><h4>${esc(g.label)}</h4><div class="opts">${g.choices.map((c) => `<button type="button" class="opt" data-opcion="${gi}" data-valor="${esc(c)}" aria-pressed="${item.opciones[gi] === c}">${esc(c)}</button>`).join('')}</div></div>`).join('')}
    ${extras.length ? `<div><h4>Adicionales</h4><div class="opts">${extras.map((id) => `<button type="button" class="opt" data-extra="${id}" aria-pressed="${item.extras.some((e) => e.id === id)}">${esc(EXTRAS[id].name)}<small>+${money(EXTRAS[id].price)}</small></button>`).join('')}</div></div>` : ''}
    <div><h4>Nota para este producto</h4><input data-config-nota maxlength="140" placeholder="Ej: sin cebolla" value="${esc(item.nota)}"></div>
    <div class="config__foot">
      <div class="stepper"><button type="button" data-config-cant="-1" aria-label="Menos">${ICON.menos}</button><output data-config-cantidad>${item.cantidad}</output><button type="button" data-config-cant="1" aria-label="Más">${ICON.mas}</button></div>
      <button class="btn btn--primary" type="button" data-config-ok></button>
    </div>`;
  $('[data-catalogo]').hidden = true;
  $('[data-config]').hidden = false;
  mostrarPanel('catalogo');
  pintarBotonConfig();
}

function pintarBotonConfig() {
  const { item, indice } = editor.config;
  $('[data-config-ok]').textContent = `${indice !== null ? 'Guardar' : 'Agregar'} · ${money(precioUnidad(item) * item.cantidad)}`;
}

function cerrarConfig() {
  editor.config = null;
  $('[data-config]').hidden = true;
  $('[data-catalogo]').hidden = false;
}

function setupConfig() {
  $('[data-config]').addEventListener('click', (e) => {
    const c = editor.config;
    if (!c) return;
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-config-cerrar]')) return cerrarConfig();
    if (t.matches('[data-opcion]')) {
      c.item.opciones[+t.dataset.opcion] = t.dataset.valor;
      $$(`[data-opcion="${t.dataset.opcion}"]`).forEach((b) => b.setAttribute('aria-pressed', b === t));
    } else if (t.matches('[data-extra]')) {
      const id = t.dataset.extra;
      const i = c.item.extras.findIndex((x) => x.id === id);
      if (i >= 0) c.item.extras.splice(i, 1);
      else c.item.extras.push({ id, nombre: EXTRAS[id].name, precio: EXTRAS[id].price });
      t.setAttribute('aria-pressed', i < 0);
    } else if (t.matches('[data-config-cant]')) {
      c.item.cantidad = Math.min(50, Math.max(1, c.item.cantidad + +t.dataset.configCant));
      $('[data-config-cantidad]').textContent = c.item.cantidad;
    } else if (t.matches('[data-config-ok]')) {
      c.item.nota = $('[data-config-nota]').value.trim();
      if (c.indice !== null) {
        editor.items[c.indice] = c.item;
        pintarPedido();
        pintarCatalogo();
      } else agregarItem(c.item);
      cerrarConfig();
      if (c.indice !== null) mostrarPanel('pedido');
      return;
    }
    pintarBotonConfig();
  });
}

/* ---------- Resumen del pedido ---------- */
function pintarPedido() {
  const n = editor.items.reduce((s, it) => s + it.cantidad, 0);
  $('[data-items-count]').textContent = n;
  $('[data-items]').innerHTML = editor.items.length
    ? editor.items.map((it, i) => {
      const det = [...it.opciones, ...it.extras.map((e) => '+ ' + e.nombre)].map(esc).join(' · ');
      return `
        <div class="it" data-item="${i}">
          <div class="stepper"><button type="button" data-item-cant="-1" aria-label="Menos">${ICON.menos}</button><output>${it.cantidad}</output><button type="button" data-item-cant="1" aria-label="Más">${ICON.mas}</button></div>
          <div><div class="it__name">${esc(it.nombre)}</div>${det || it.nota ? `<div class="it__det">${det}${it.nota ? `${det ? ' · ' : ''}<em>“${esc(it.nota)}”</em>` : ''}</div>` : ''}</div>
          <div class="it__price">${money(precioUnidad(it) * it.cantidad)}</div>
          <div class="it__tools">
            ${productoPorId[it.pid] && productoPorId[it.pid].category !== 'adicionales' ? '<button class="btn btn--sm btn--ghost" type="button" data-item-editar>Personalizar</button>' : ''}
            <button class="btn btn--sm btn--ghost btn--danger" type="button" data-item-quitar>Quitar</button>
          </div>
        </div>`;
    }).join('')
    : '<div class="items__empty">Agrega productos desde la carta</div>';
  $$('[data-tipo] button').forEach((b) => b.setAttribute('aria-selected', b.dataset.valor === editor.tipo));
  $('[data-domicilio]').hidden = editor.tipo !== 'domicilio';
  $('[data-pagos]').innerHTML = CONFIG.paymentMethods.map((m) => `<button type="button" class="opt" data-pago="${esc(m)}" aria-pressed="${editor.pago === m}">${esc(m)}</button>`).join('');
  $('[data-total]').textContent = money(totalItems(editor.items));
}

function setupPedido() {
  $('[data-items]').addEventListener('click', (e) => {
    const fila = e.target.closest('[data-item]');
    if (!fila) return;
    const i = +fila.dataset.item;
    const it = editor.items[i];
    if (e.target.closest('[data-item-cant]')) {
      it.cantidad += +e.target.closest('[data-item-cant]').dataset.itemCant;
      if (it.cantidad <= 0) editor.items.splice(i, 1);
    } else if (e.target.closest('[data-item-quitar]')) editor.items.splice(i, 1);
    else if (e.target.closest('[data-item-editar]')) return abrirConfig(it.pid, i);
    else return;
    pintarPedido();
    pintarCatalogo();
  });
  $('[data-tipo]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-valor]');
    if (b) { editor.tipo = b.dataset.valor; pintarPedido(); }
  });
  $('[data-pagos]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pago]');
    if (b) { editor.pago = editor.pago === b.dataset.pago ? '' : b.dataset.pago; pintarPedido(); }
  });
}

/* ---------- Guardar / cancelar ---------- */
function datosDelFormulario() {
  const f = form.elements;
  const v = (k) => f[k].value.trim();
  return {
    cliente: v('cliente'),
    telefono: v('telefono'),
    tipo: editor.tipo,
    direccion: editor.tipo === 'domicilio' ? v('direccion') : '',
    barrio: editor.tipo === 'domicilio' ? v('barrio') : '',
    pago: editor.pago || '',
    notas: v('notas'),
    items: editor.items,
    total: totalItems(editor.items),
  };
}

async function guardar() {
  if (!editor.items.length) {
    mostrarPanel('catalogo');
    return toast('Agrega al menos un producto', 'bad');
  }
  const boton = $('[data-guardar]');
  boton.disabled = true;
  const t = ahora();
  const datos = datosDelFormulario();
  try {
    if (editor.id) {
      await estado.fuente.actualizar(editor.id, {
        ...datos, actualizadoEn: t, actualizadoPor: estado.nombre, actualizadoDispositivo: DISPOSITIVO,
        editadoEn: t, editadoPor: estado.nombre, editadoDispositivo: DISPOSITIVO,
      }, editor.rev);
      toast(`Pedido #${editor.numero} actualizado`, 'ok');
    } else {
      const { numero } = await estado.fuente.crear(estado.fecha, {
        ...datos, estado: 'nuevo', creadoEn: t, creadoPor: estado.nombre, creadoDispositivo: DISPOSITIVO,
        actualizadoEn: t, actualizadoPor: estado.nombre, actualizadoDispositivo: DISPOSITIVO,
      });
      toast(`Pedido #${numero} enviado a cocina`, 'ok');
    }
    editor.id = null;
    dialogo.close();
  } catch (e) {
    console.error(e);
    if (e instanceof Conflicto) {
      toast(e.actual ? 'Alguien cambió este pedido mientras lo editabas. Ábrelo de nuevo para ver la versión actual.' : 'Este pedido ya no existe.', 'bad');
      editor.id = null;
      dialogo.close();
    } else toast('No se pudo guardar. Revisa la conexión e intenta de nuevo.', 'bad');
  } finally {
    boton.disabled = false;
  }
}

function avisarSiCambioMientrasEdita() {
  const actual = estado.pedidos.find((p) => p.id === editor.id);
  if (!editor.avisado && actual && actual.rev !== editor.rev && actual.editadoPor !== estado.nombre) {
    editor.avisado = true;
    toast(`Ojo: ${actual.editadoPor || 'alguien'} acaba de cambiar este pedido`, 'bad');
  }
}

function setupEditor() {
  $('[data-nuevo]').addEventListener('click', () => abrirEditor());
  $('[data-cerrar-editor]').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => { editor.id = null; });
  $('[data-panes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pane]');
    if (b) mostrarPanel(b.dataset.pane);
  });
  $('[data-buscar]').addEventListener('input', pintarCatalogo);
  $('[data-cats]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    editor.cat = b.dataset.cat;
    $('[data-buscar]').value = '';
    pintarCatalogo();
  });
  $('[data-prods]').addEventListener('click', (e) => {
    const rapido = e.target.closest('[data-rapido]');
    const fila = e.target.closest('[data-prod]');
    if (!fila) return;
    const p = productoPorId[fila.dataset.prod];
    // "+" agrega directo; tocar el producto abre sus opciones (o si tiene elecciones obligatorias)
    if (rapido && !p.options?.length) agregarItem(itemBase(p));
    else if (p.category === 'adicionales') agregarItem(itemBase(p));
    else abrirConfig(p.id);
  });
  $('[data-prods]').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-prod]')) {
      e.preventDefault();
      abrirConfig(e.target.dataset.prod);
    }
  });
  $('[data-guardar]').addEventListener('click', guardar);
  $('[data-eliminar]').addEventListener('click', async () => {
    const p = estado.pedidos.find((x) => x.id === editor.id);
    if (!p || !confirm(`¿Cancelar el pedido #${p.numero}? Quedará en "Entregados y cancelados".`)) return;
    dialogo.close();
    cambiarEstado(p, 'cancelado');
  });
  setupConfig();
  setupPedido();
}

/* ==========================================================================
   Jornada: reloj de Colombia, cierre del día y reportes en Excel
   ========================================================================== */
function pintarReloj() {
  const t = new Date(ahora());
  $('[data-fecha-larga]').textContent = conMayuscula(t.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }));
  $('[data-hora]').textContent = t.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'America/Bogota' });
}

function pintarJornada() {
  const el = $('[data-jornada-info]');
  const j = estado.jornada;
  if (!j) {
    el.textContent = 'Abriendo jornada…';
    return;
  }
  const hoy = hoyColombia();
  const n = estado.pedidos.filter((p) => p.estado !== 'cancelado').length;
  el.classList.toggle('is-warn', j.fecha < hoy);
  el.textContent =
    j.fecha < hoy ? `⚠️ Sigue abierta la jornada del ${fechaLarga(j.fecha)}. Ciérrala para empezar el día.`
    : j.fecha > hoy ? `Próxima jornada: ${fechaLarga(j.fecha)} · ${n} ${n === 1 ? 'pedido' : 'pedidos'}`
    : `Jornada de hoy · ${n} ${n === 1 ? 'pedido' : 'pedidos'}`;
}

const cierre = $('[data-cierre]');

function abrirCierre() {
  const r = resumirVentas(estado.pedidos);
  const activos = estado.pedidos.filter((p) => p.estado in SIGUIENTE).length;
  $('[data-cierre-body]').innerHTML = `
    <p class="cierre__fecha">Jornada del <strong>${esc(fechaLarga(estado.fecha))}</strong></p>
    <div class="cierre__kpis">
      <div><span>Pedidos</span><strong>${r.pedidos}</strong></div>
      <div><span>Cancelados</span><strong>${r.cancelados}</strong></div>
      <div><span>Total vendido</span><strong>${money(r.total)}</strong></div>
    </div>
    <ul class="cierre__cats">
      ${r.categorias.map((c) => `<li><span>${esc(c.nombre)}</span><span>${c.unidades} und.</span><strong>${money(c.total)}</strong></li>`).join('')}
    </ul>
    ${activos ? `<p class="cierre__aviso">Hay ${activos} ${activos === 1 ? 'pedido' : 'pedidos'} sin marcar como entregado. Al cerrar se marcarán como entregados y se cuentan en las ventas.</p>` : ''}
    <p class="cierre__nota">Al cerrar se descarga el Excel del día y <strong>todos los dispositivos se reinician</strong> con el tablero vacío para la jornada siguiente. Los pedidos quedan guardados y puedes volver a descargar el reporte cuando quieras.</p>`;
  $('[data-cierre-fecha]').max = hoyColombia();
  $('[data-cierre-fecha]').value = restarDia(hoyColombia());
  cierre.showModal();
}

async function conBoton(boton, tarea) {
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Generando…';
  try {
    await tarea();
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
}

async function cerrarJornada() {
  const fecha = estado.fecha;
  const t = ahora();
  const activos = estado.pedidos.filter((p) => p.estado in SIGUIENTE);
  const pedidos = estado.pedidos.map((p) => (p.estado in SIGUIENTE ? { ...p, estado: 'entregado', entregadoEn: t } : p));
  try {
    // 1) Primero el Excel: si no se puede generar, la jornada sigue abierta
    const r = await descargarExcel({ fecha, pedidos, cerradaEn: t, cerradaPor: estado.nombre, generado: t });
    // 2) Los pedidos que quedaron sin marcar pasan a entregados
    await Promise.all(activos.map((p) => estado.fuente.actualizar(p.id, { estado: 'entregado', entregadoEn: t, actualizadoEn: t, actualizadoPor: estado.nombre, actualizadoDispositivo: DISPOSITIVO })));
    // 3) Se guarda el cierre y se abre la jornada siguiente para todos
    const siguiente = { fecha: [hoyColombia(), sumarDia(fecha)].sort().pop(), abiertaEn: t };
    estado.cerrandoYo = true;
    await estado.fuente.cerrarJornada(fecha, {
      fecha, cerradaEn: t, cerradaPor: estado.nombre, pedidos: r.pedidos, cancelados: r.cancelados, total: r.total,
      porCategoria: Object.fromEntries(r.categorias.map((c) => [c.id, { unidades: c.unidades, total: c.total }])),
    }, siguiente);
    cierre.close();
    toast(`Jornada cerrada · ${money(r.total)} vendidos. Reiniciando para el ${fechaLarga(siguiente.fecha)}…`, 'ok');
    setTimeout(() => location.reload(), 2500);
  } catch (e) {
    console.error(e);
    estado.cerrandoYo = false;
    if (e instanceof Conflicto) {
      toast('Otro dispositivo ya cerró esta jornada. Reiniciando…', 'bad');
      setTimeout(() => location.reload(), 2500);
    } else if (/Excel/.test(e.message)) toast('No se pudo generar el Excel (revisa el internet). La jornada sigue abierta.', 'bad');
    else toast('No se pudo cerrar la jornada. Revisa la conexión e intenta de nuevo.', 'bad');
  }
}

async function descargarActual() {
  try {
    await descargarExcel({ fecha: estado.fecha, pedidos: estado.pedidos, generado: ahora() });
    toast('Excel descargado (la jornada sigue abierta)', 'ok');
  } catch (e) {
    console.error(e);
    toast('No se pudo generar el Excel. Revisa el internet.', 'bad');
  }
}

async function descargarAnterior() {
  const fecha = $('[data-cierre-fecha]').value;
  if (!fecha) return toast('Elige una fecha', 'bad');
  try {
    const [pedidos, jornada] = await Promise.all([estado.fuente.pedidosDe(fecha), estado.fuente.jornadaDe(fecha)]);
    if (!pedidos.length) return toast(`No hay pedidos del ${fechaLarga(fecha)}`, 'bad');
    await descargarExcel({ fecha, pedidos, cerradaEn: jornada?.cerradaEn, cerradaPor: jornada?.cerradaPor, generado: ahora() });
    toast('Excel descargado', 'ok');
  } catch (e) {
    console.error(e);
    toast('No se pudo descargar el reporte. Revisa la conexión.', 'bad');
  }
}

function setupJornada() {
  pintarReloj();
  setInterval(pintarReloj, 1000);
  setInterval(sincronizarHora, 30 * 60 * 1000);
  $('[data-abrir-cierre]').addEventListener('click', abrirCierre);
  $('[data-cerrar-cierre]').addEventListener('click', () => cierre.close());
  $('[data-confirmar-cierre]').addEventListener('click', (e) => {
    if (confirm(`¿Cerrar la jornada del ${fechaLarga(estado.fecha)}? Todos los dispositivos empezarán el día siguiente.`)) conBoton(e.currentTarget, cerrarJornada);
  });
  $('[data-solo-excel]').addEventListener('click', (e) => conBoton(e.currentTarget, descargarActual));
  $('[data-descargar-anterior]').addEventListener('click', (e) => conBoton(e.currentTarget, descargarAnterior));
}

/* ==========================================================================
   Inicio
   ========================================================================== */
const DEMO = new URLSearchParams(location.search).has('demo');

async function iniciar() {
  setupTablero();
  setupEditor();
  setupJornada();
  setupSonido();
  sincronizarHora().then(pintarReloj);
  $('[data-cambiar-nombre]').addEventListener('click', pedirNombre);

  let clave = null;
  if (FIREBASE && !DEMO) {
    clave = claveDelEnlace() || (await pedirClave());
  } else {
    $('[data-demo]').hidden = false;
  }
  if (!estado.nombre) await pedirNombre();
  $('[data-mi-nombre]').textContent = estado.nombre;

  try {
    estado.fuente = await conectar(FIREBASE, clave, DEMO);
  } catch (e) {
    console.error(e);
    mostrarConexion('error');
    toast('No se pudo conectar con la base de datos', 'bad');
    return;
  }
  // Primero la jornada abierta; con ella se escuchan los pedidos de ese día
  estado.cancelarJornada = estado.fuente.escucharJornada(alCambiarJornada, (err) => {
    if (err?.code === 'permission-denied') claveInvalida();
    else mostrarConexion('error');
  });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

iniciar();
