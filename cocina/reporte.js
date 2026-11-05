/* ==========================================================================
   DOKO Cocina — Resumen de ventas y Excel del cierre de jornada
   La librería de Excel (ExcelJS) solo se descarga al momento de generar el
   archivo, para que el panel siga cargando rápido el resto del tiempo.
   ========================================================================== */
import { CATEGORIES, PRODUCTS } from '../js/menu.js';

const EXCELJS = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
const TZ = 'America/Bogota';
const productoPorId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
// Una sección por cada categoría de la carta, en el mismo orden (las nuevas aparecen solas)
const ORDEN = CATEGORIES.map((c) => c.id);
const NOMBRE_CAT = { ...Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])), otros: 'Otros' };

export const fechaLarga = (fecha) =>
  new Date(`${fecha}T12:00:00-05:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
export const horaCol = (ms) => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
const fechaHoraCol = (ms) => new Date(ms).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium', timeZone: TZ });

/* ---------- Cálculo de ventas ---------- */
// Cada producto vendido se cuenta con el precio con el que se vendió; los
// adicionales suman tanto los pedidos solos como los agregados a productos.
export function resumirVentas(pedidos) {
  const vendidos = pedidos.filter((p) => p.estado !== 'cancelado');
  const cats = Object.fromEntries([...ORDEN, 'otros'].map((c) => [c, new Map()]));
  const pagos = new Map();
  let total = 0;

  const sumar = (cat, clave, base, cantidad, precio, detalle) => {
    const fila = cats[cat].get(clave) || { ...base, precio, cantidad: 0, total: 0, detalles: new Map() };
    fila.cantidad += cantidad;
    fila.total += precio * cantidad;
    if (detalle) fila.detalles.set(detalle, (fila.detalles.get(detalle) || 0) + cantidad);
    cats[cat].set(clave, fila);
  };

  for (const p of vendidos) {
    let totalPedido = 0;
    for (const it of p.items) {
      const prod = productoPorId[it.pid];
      const cat = prod?.category && cats[prod.category] ? prod.category : it.pid?.startsWith('adicional-') ? 'adicionales' : 'otros';
      if (cat === 'adicionales') {
        const id = it.pid.replace(/^adicional-/, '');
        sumar('adicionales', `${id}|${it.precio}`, { nombre: prod?.name || it.nombre.replace(/^Adicional:\s*/, '') }, it.cantidad, it.precio, 'Pedido solo');
      } else {
        sumar(cat, `${it.pid}|${it.precio}`, { nombre: prod?.name || it.nombre }, it.cantidad, it.precio, (it.opciones || []).join(' + '));
      }
      for (const e of it.extras || []) {
        sumar('adicionales', `${e.id}|${e.precio}`, { nombre: e.nombre }, it.cantidad, e.precio, 'En productos');
      }
      totalPedido += (it.precio + (it.extras || []).reduce((s, e) => s + e.precio, 0)) * it.cantidad;
    }
    total += totalPedido;
    const pago = p.pago || 'Sin especificar';
    const fp = pagos.get(pago) || { pedidos: 0, total: 0 };
    fp.pedidos += 1;
    fp.total += totalPedido;
    pagos.set(pago, fp);
  }

  const categorias = [...ORDEN, 'otros']
    .map((id) => {
      const filas = [...cats[id].values()]
        .map((f) => ({ ...f, detalle: [...f.detalles].map(([d, n]) => (d ? `${d} ×${n}` : '')).filter(Boolean).join(' · ') }))
        .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
      return { id, nombre: NOMBRE_CAT[id] || id, filas, unidades: filas.reduce((s, f) => s + f.cantidad, 0), total: filas.reduce((s, f) => s + f.total, 0) };
    })
    .filter((c) => c.id !== 'otros' || c.filas.length);

  return {
    pedidos: vendidos.length,
    entregados: vendidos.filter((p) => p.estado === 'entregado').length,
    pendientes: vendidos.filter((p) => p.estado !== 'entregado').length,
    cancelados: pedidos.length - vendidos.length,
    domicilios: vendidos.filter((p) => p.tipo === 'domicilio').length,
    recoger: vendidos.filter((p) => p.tipo === 'recoger').length,
    total,
    categorias,
    pagos: [...pagos].map(([metodo, v]) => ({ metodo, ...v })).sort((a, b) => b.total - a.total),
  };
}

/* ---------- Excel ---------- */
let cargaExcel = null;
function cargarExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  cargaExcel ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = EXCELJS;
    s.onload = () => resolve(window.ExcelJS);
    s.onerror = () => { cargaExcel = null; reject(new Error('No se pudo descargar la librería de Excel')); };
    document.head.append(s);
  });
  return cargaExcel;
}

const COLOR = { negro: 'FF0F0C0A', naranja: 'FFFF6A13', dorado: 'FFFFC21A', gris: 'FFF2F2F2', linea: 'FFD9D9D9', blanco: 'FFFFFFFF' };
const PESOS = '"$"#,##0';

export async function descargarExcel({ fecha, pedidos, cerradaEn, cerradaPor, generado }) {
  const ExcelJS = await cargarExcelJS();
  const r = resumirVentas(pedidos);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'DOKO Cocina';
  wb.created = new Date(generado);

  /* ===== Hoja 1: Resumen de ventas ===== */
  const ws = wb.addWorksheet('Resumen de ventas', { views: [{ showGridLines: false }], pageSetup: { paperSize: 1, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  ws.columns = [{ width: 34 }, { width: 44 }, { width: 16 }, { width: 12 }, { width: 16 }];
  const borde = { bottom: { style: 'thin', color: { argb: COLOR.linea } } };

  const titulo = ws.addRow(['DOKO — Cierre de jornada']);
  ws.mergeCells(`A${titulo.number}:E${titulo.number}`);
  titulo.font = { bold: true, size: 18, color: { argb: COLOR.blanco } };
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.negro } };
  titulo.height = 30;
  titulo.alignment = { vertical: 'middle', indent: 1 };

  const dato = (k, v) => {
    const fila = ws.addRow([k, v]);
    fila.getCell(1).font = { bold: true };
    return fila;
  };
  ws.addRow([]);
  dato('Fecha de la jornada', fechaLarga(fecha).replace(/^./, (c) => c.toUpperCase()));
  const horas = pedidos.map((p) => p.creadoEn).filter(Boolean).sort((a, b) => a - b);
  dato('Primer pedido', horas.length ? `${fechaHoraCol(horas[0])} (hora de Colombia)` : '—');
  dato('Último pedido', horas.length ? `${fechaHoraCol(horas.at(-1))} (hora de Colombia)` : '—');
  dato('Cierre de la jornada', cerradaEn ? `${fechaHoraCol(cerradaEn)} (hora de Colombia)` : 'Jornada todavía abierta');
  if (cerradaPor) dato('Cerrada por', cerradaPor);
  dato('Archivo generado', `${fechaHoraCol(generado)} (hora de Colombia)`);

  const seccion = (texto, color = COLOR.naranja) => {
    ws.addRow([]);
    const fila = ws.addRow([texto]);
    ws.mergeCells(`A${fila.number}:E${fila.number}`);
    fila.font = { bold: true, size: 12, color: { argb: color === COLOR.dorado ? COLOR.negro : COLOR.blanco } };
    fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    fila.height = 22;
    fila.alignment = { vertical: 'middle', indent: 1 };
  };
  const encabezado = (valores) => {
    const fila = ws.addRow(valores);
    fila.font = { bold: true };
    fila.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.gris } }; c.border = borde; });
    return fila;
  };
  const filaDatos = (valores, colsPesos = []) => {
    const fila = ws.addRow(valores);
    fila.eachCell((c) => { c.border = borde; });
    colsPesos.forEach((n) => { fila.getCell(n).numFmt = PESOS; });
    return fila;
  };
  const filaTotal = (valores, colsPesos = []) => {
    const fila = ws.addRow(valores);
    fila.font = { bold: true };
    colsPesos.forEach((n) => { fila.getCell(n).numFmt = PESOS; });
    fila.eachCell((c) => { c.border = { top: { style: 'thin' } }; });
    return fila;
  };

  seccion('RESUMEN DEL DÍA', COLOR.dorado);
  filaDatos(['Pedidos vendidos', r.pedidos]);
  filaDatos(['Domicilios', r.domicilios]);
  filaDatos(['Para recoger', r.recoger]);
  if (r.pendientes) filaDatos(['Sin marcar como entregados (incluidos en las ventas)', r.pendientes]);
  filaDatos(['Pedidos cancelados (no suman)', r.cancelados]);
  const tv = filaTotal(['TOTAL VENDIDO', r.total], [2]);
  tv.font = { bold: true, size: 13 };
  tv.getCell(2).alignment = { horizontal: 'left' };

  seccion('VENTAS POR CATEGORÍA', COLOR.dorado);
  encabezado(['Categoría', '', 'Unidades', '', 'Total']);
  r.categorias.forEach((c) => filaDatos([c.nombre, '', c.unidades, '', c.total], [5]));
  filaTotal(['TOTAL', '', r.categorias.reduce((s, c) => s + c.unidades, 0), '', r.total], [5]);

  seccion('VENTAS POR MÉTODO DE PAGO', COLOR.dorado);
  encabezado(['Método de pago', '', 'Pedidos', '', 'Total']);
  r.pagos.forEach((p) => filaDatos([p.metodo, '', p.pedidos, '', p.total], [5]));
  filaTotal(['TOTAL', '', r.pedidos, '', r.total], [5]);

  for (const c of r.categorias) {
    seccion(c.nombre.toUpperCase());
    encabezado(['Producto', c.id === 'adicionales' ? 'Cómo se vendió' : 'Detalle', 'Precio unitario', 'Cantidad', 'Total']);
    if (!c.filas.length) ws.addRow(['Sin ventas']).font = { italic: true, color: { argb: 'FF888888' } };
    c.filas.forEach((f) => filaDatos([f.nombre, f.detalle, f.precio, f.cantidad, f.total], [3, 5]));
    filaTotal([`Subtotal ${c.nombre.toLowerCase()}`, '', '', c.unidades, c.total], [5]);
  }

  seccion('RECUENTO TOTAL', COLOR.negro);
  r.categorias.forEach((c) => filaDatos([c.nombre, '', '', c.unidades, c.total], [5]));
  const gran = filaTotal(['TOTAL VENDIDO DEL DÍA', fechaLarga(fecha), '', r.categorias.reduce((s, c) => s + c.unidades, 0), r.total], [5]);
  gran.font = { bold: true, size: 13 };
  ws.eachRow((row) => row.eachCell((cell) => { cell.alignment = { ...cell.alignment, vertical: 'middle', wrapText: true }; }));

  /* ===== Hoja 2: Pedidos ===== */
  const wp = wb.addWorksheet('Pedidos', { views: [{ state: 'frozen', ySplit: 1 }], pageSetup: { paperSize: 1, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  wp.columns = [
    { header: 'N°', key: 'numero', width: 6 },
    { header: 'Hora', key: 'hora', width: 11 },
    { header: 'Cliente', key: 'cliente', width: 20 },
    { header: 'Teléfono', key: 'telefono', width: 14 },
    { header: 'Tipo', key: 'tipo', width: 11 },
    { header: 'Dirección', key: 'direccion', width: 26 },
    { header: 'Barrio', key: 'barrio', width: 16 },
    { header: 'Productos', key: 'productos', width: 60 },
    { header: 'Notas', key: 'notas', width: 26 },
    { header: 'Pago', key: 'pago', width: 14 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Total', key: 'total', width: 13, style: { numFmt: PESOS } },
    { header: 'Creado por', key: 'creadoPor', width: 14 },
  ];
  wp.getRow(1).font = { bold: true, color: { argb: COLOR.blanco } };
  wp.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.negro } };
  [...pedidos].sort((a, b) => a.numero - b.numero).forEach((p) => {
    const productos = p.items.map((it) => {
      const det = [...(it.opciones || []), ...(it.extras || []).map((e) => '+ ' + e.nombre)].join(', ');
      return `${it.cantidad}× ${it.nombre}${det ? ` (${det})` : ''}${it.nota ? ` “${it.nota}”` : ''}`;
    }).join('\n');
    const fila = wp.addRow({
      numero: p.numero, hora: horaCol(p.creadoEn), cliente: p.cliente || '', telefono: p.telefono || '',
      tipo: p.tipo === 'domicilio' ? 'Domicilio' : 'Recoger', direccion: p.direccion || '', barrio: p.barrio || '',
      productos, notas: p.notas || '', pago: p.pago || '', estado: p.estado.charAt(0).toUpperCase() + p.estado.slice(1),
      total: p.estado === 'cancelado' ? 0 : p.total, creadoPor: p.creadoPor || '',
    });
    fila.alignment = { vertical: 'top', wrapText: true };
    if (p.estado === 'cancelado') fila.font = { color: { argb: 'FF999999' }, strike: true };
  });
  wp.autoFilter = { from: 'A1', to: 'M1' };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `DOKO_cierre_${fecha}.xlsx` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return r;
}
