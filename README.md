# DOKO — Página web 🍔🍟🔥

Página web oficial de **DOKO** (@dokofood_), cocina oculta de hamburguesas, salchipapas y perros en Cúcuta.
*¡Donde está lo bueno!*

Los clientes ven la carta, personalizan sus productos, arman el pedido y lo envían **directo al WhatsApp de DOKO**, ya organizado con productos, adiciones, total, dirección y método de pago.

## ✨ Qué hace

- **Carta interactiva** por categorías (Hamburguesas, Salchipapas, Perros, Combos, Acompañantes, Bebidas) con buscador y pestañas que siguen el scroll.
- **Personalización**: adiciones con precio, elección obligatoria (ej. sabor de gaseosa), notas ("sin cebolla") y cantidad.
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
| Cambiar precios de adiciones    | Objeto `EXTRAS`                                |
| Cambiar horario                 | `CONFIG.schedule` (0 = domingo … 6 = sábado)   |
| Cambiar WhatsApp                | `CONFIG.whatsapp` (solo números, con 57)       |
| Métodos de pago                 | `CONFIG.paymentMethods`                        |

> ⚠️ **Importante:** los productos, descripciones y precios actuales son **estimados** a partir de lo que se ve en el Instagram. Hay que reemplazarlos por los de la carta oficial antes de publicar.

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
└── assets/img/             # Logo, fotos de productos y galería
```

## 📝 Pendiente con DOKO

- [ ] Carta oficial con precios reales
- [ ] Logo en alta resolución (PNG o SVG)
- [ ] Fotos en buena calidad de cada producto
- [ ] Confirmar métodos de pago y si el "fin de semana" incluye el viernes
- [ ] Dominio y hosting

---

Hecho con 🔥 para DOKO · Cúcuta, Colombia
