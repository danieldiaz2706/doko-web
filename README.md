# DOKO — Página web 🍔🍟🔥

Página web oficial de **DOKO** (@dokofood_), cocina oculta de hamburguesas y salchipapas en Cúcuta.
*¡Donde está lo bueno!*

Los clientes ven la carta, personalizan sus productos, arman el pedido y lo envían **directo al WhatsApp de DOKO**, ya organizado con productos, adicionales, total, dirección y método de pago.

## ✨ Qué hace

- **Carta oficial interactiva**: 5 hamburguesas, 5 salchipapas y 16 adicionales, con las fotos de la carta, buscador y pestañas que siguen el scroll.
- **Personalización**: adicionales con precio, elecciones obligatorias (ej. La Clásica: carne o pollo, cheddar o mozzarella), notas ("sin cebolla") y cantidad.
- **Carrito** que se guarda en el celular del cliente aunque cierre la página.
- **Checkout en 2 pasos**: domicilio o recoger, dirección, barrio, referencia, método de pago y "¿con cuánto pagas?" para el cambio.
- **Pedido por WhatsApp** con número de orden (ej. `#DK-4821`) y mensaje listo para enviar.
- **Horario en vivo** (hora de Colombia): muestra "Abierto ahora" / "Cerrado · abrimos mañana a las 6 PM".
- Recuerda los datos del cliente para el próximo pedido (opcional).
- Galería con los reels de Instagram, preguntas frecuentes y botón flotante de WhatsApp.
- Diseño responsive (pensado primero para celular), animaciones suaves, SEO local y se puede "instalar" en el celular (manifest).

## 🛠️ Cómo cambiar la carta, precios u horario

Todo está en **un solo archivo**: [`js/menu.js`](js/menu.js). No hace falta tocar nada más.

| Quiero…                         | Cambia en `js/menu.js`                         |
|---------------------------------|------------------------------------------------|
| Cambiar un precio               | `price: 27000` del producto                    |
| Agregar un producto             | Copia un bloque `{ id: … }` y edítalo          |
| Marcar un producto como agotado | Agrega `available: false`                      |
| Ponerlo en "Los que la rompen"  | `featured: true`                               |
| Cambiar la foto                 | Sube la imagen a `assets/img/` y pon su ruta en `image` |
| Cambiar precios de adicionales  | Objeto `EXTRAS` (se actualizan en toda la página) |
| Cambiar horario                 | `CONFIG.schedule` (0 = domingo … 6 = sábado)   |
| Cambiar WhatsApp                | `CONFIG.whatsapp` (solo números, con 57)       |
| Métodos de pago                 | `CONFIG.paymentMethods`                        |

> ✅ Productos, descripciones, precios y fotos tomados de la **carta oficial de DOKO** (noviembre 2026). La carta completa en imagen está en `assets/img/carta/carta-completa.jpg` y se enlaza desde la página.

## 💻 Verla en el computador

Es una página estática (HTML + CSS + JavaScript, sin dependencias). Necesita un servidor local por los módulos de JavaScript:

```bash
python -m http.server 5174
```

Luego abre `http://localhost:5174`.

## 🚀 Publicarla gratis

Cualquiera de estas opciones sirve (todas aceptan repos privados):

1. **Netlify** → "Add new site" → "Import from Git" → elegir este repo. Sin build, carpeta raíz `/`.
2. **Vercel** → "New Project" → importar el repo → Framework: *Other*.
3. **Cloudflare Pages** → conectar el repo, sin comando de build.

Después se le puede conectar un dominio propio (ej. `dokofood.com`).

> 💡 En el plan gratis de Netlify cada publicación (deploy) gasta 15 de los 300 créditos del mes: conviene juntar varios cambios antes de subirlos.

## 👨‍🍳 Panel de cocina

En [`cocina/`](cocina/) está el panel interno para caja y cocina (`/cocina/`): crear y editar pedidos con toda la carta y verlos en tiempo real en cualquier dispositivo. Los pedidos se guardan en Firebase Firestore (gratis). Instrucciones para conectarlo en [`cocina/LEEME.md`](cocina/LEEME.md).

## 📊 Analítica (Google Analytics de Firebase)

La página de clientes mide el recorrido de los visitantes con Google Analytics, conectado al proyecto de Firebase `doko-cocina` (app web "DOKO página clientes", ID de medición `G-VT6QTRKD4L`). La configuración está en [`js/analitica.js`](js/analitica.js). **No se envían nombres, direcciones, notas ni ningún dato del cliente.** El panel de cocina no se mide.

| Paso del cliente                         | Evento en Analytics |
|------------------------------------------|---------------------|
| Entra a la página                        | `page_view` (automático) |
| Busca en la carta                        | `search` |
| Abre un producto                         | `view_item` |
| Agrega al carrito                        | `add_to_cart` |
| Quita del carrito                        | `remove_from_cart` |
| Abre el carrito                          | `view_cart` |
| Pasa a "Tus datos"                       | `begin_checkout` |
| Envía el pedido por WhatsApp             | `purchase` (con número de pedido, total, domicilio/recoger y método de pago) |

> ⚠️ `purchase` significa "pedido enviado a WhatsApp": no confirma que el cliente lo mandó ni que pagó.

**Dónde verlo:**
- **Hoy, en vivo:** Firebase → Analytics → Panel, o en analytics.google.com → Informes → Tiempo real.
- **Productos más vistos y más pedidos:** analytics.google.com → Informes → Monetización → Compras de comercio electrónico (tarda hasta 24 h).
- **El embudo completo** (en qué paso se van): analytics.google.com → Explorar → **Exploración de embudo**, con los pasos `page_view` → `view_item` → `add_to_cart` → `begin_checkout` → `purchase`.

Solo se mide en `dokofoodwebsite.netlify.app`. En el computador los eventos se ven en la consola del navegador; para probar el envío real agrega `?analitica` a la dirección.

## 🔒 Seguridad

[`_headers`](_headers) le pone a toda la página (clientes y cocina) encabezados de seguridad en Netlify: HTTPS obligatorio, no se puede meter en un marco de otra página y una política de contenido (CSP) que solo deja cargar código de la propia página, Firebase, Google Analytics, Google Fonts y la librería de Excel del panel. **Si se agrega un servicio externo nuevo, hay que sumarlo a la CSP** o el navegador lo bloqueará.

## 📁 Estructura

```
doko-web/
├── index.html              # Estructura de la página
├── css/styles.css          # Estilos (paleta del logo: negro, rojo, naranja fuego, dorado)
├── js/menu.js              # ⭐ Carta, precios, horario, WhatsApp (lo único que se edita)
├── js/app.js               # Lógica: carrito, horario en vivo, pedido por WhatsApp
├── js/analitica.js         # Google Analytics de Firebase (recorrido de los clientes)
├── manifest.webmanifest    # Para "instalar" la página en el celular
├── assets/img/             # Logo, galería de Instagram y carta/ (fotos de la carta oficial)
├── cocina/                 # Panel de pedidos para caja y cocina (ver cocina/LEEME.md)
└── _headers                # Reglas de Netlify: seguridad y el panel no aparece en Google
```

## 📝 Pendiente con DOKO

- [x] Carta oficial con precios reales
- [ ] Logo en alta resolución (PNG o SVG)
- [ ] Fotos de la carta en alta resolución (las actuales salen del PDF y se ven algo suaves en pantallas grandes)
- [ ] ¿Venden bebidas? (no aparecen en la carta)
- [ ] Confirmar métodos de pago y si el "fin de semana" incluye el viernes
- [ ] Dominio y hosting

---

Hecho con 🔥 para DOKO · Cúcuta, Colombia
