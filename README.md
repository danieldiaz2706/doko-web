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

## 📁 Estructura

```
doko-web/
├── index.html              # Estructura de la página
├── css/styles.css          # Estilos (paleta del logo: negro, rojo, naranja fuego, dorado)
├── js/menu.js              # ⭐ Carta, precios, horario, WhatsApp (lo único que se edita)
├── js/app.js               # Lógica: carrito, horario en vivo, pedido por WhatsApp
├── manifest.webmanifest    # Para "instalar" la página en el celular
└── assets/img/             # Logo, galería de Instagram y carta/ (fotos de la carta oficial)
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
