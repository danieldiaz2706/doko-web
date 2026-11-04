/* ==========================================================================
   DOKO — Datos del negocio y de la carta
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para cambiar precios, productos,
   horarios, número de WhatsApp o métodos de pago. No hace falta saber
   programar: cambia los textos/números entre comillas y guarda.

   Carta oficial de DOKO (productos, descripciones, precios y fotos).
   La imagen completa de la carta está en assets/img/carta/carta-completa.jpg
   ========================================================================== */

export const CONFIG = {
  name: 'DOKO',
  slogan: '¡Donde está lo bueno!',
  city: 'Cúcuta',

  // Número de WhatsApp en formato internacional, solo dígitos (57 = Colombia)
  whatsapp: '573502934512',
  whatsappDisplay: '+57 350 293 4512',
  whatsappGreeting: 'Hola DOKO, quiero ordenar 🔥🍟🍔',

  instagram: 'https://www.instagram.com/dokofood_/',
  instagramHandle: '@dokofood_',
  followers: '16,4 mil',

  // Hora de Colombia (UTC-5, sin horario de verano)
  utcOffset: -5,

  // Horario por día. 0 = domingo, 1 = lunes … 6 = sábado. Formato 24 h.
  // Pon null en un día para marcarlo como cerrado.
  schedule: {
    0: ['18:00', '22:00'],
    1: ['18:00', '21:30'],
    2: ['18:00', '21:30'],
    3: ['18:00', '21:30'],
    4: ['18:00', '21:30'],
    5: ['18:00', '21:30'],
    6: ['18:00', '22:00'],
  },

  paymentMethods: ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia'],

  deliveryNote: 'El valor del domicilio depende de tu barrio y te lo confirmamos por WhatsApp.',
  locationNote: 'Somos cocina oculta: te compartimos la ubicación exacta cuando confirmes tu pedido.',
};

/* ADICIONALES de la carta (precio en pesos).
   Se ofrecen al personalizar cada producto y también se pueden pedir solos. */
export const EXTRAS = {
  papas:      { name: 'Papas fritas',               price: 7900 },
  pollo:      { name: 'Pollo desmechado en tártara', price: 8900 },
  carne:      { name: 'Blend de carne',             price: 7900 },
  pulledpork: { name: 'Pulled pork',                price: 11900 },
  maicito:    { name: 'Maicito',                    price: 11900 },
  madurito:   { name: 'Madurito',                   price: 6900 },
  huevitos:   { name: 'Huevitos',                   price: 7900 },
  tocineta:   { name: 'Tocineta',                   price: 7900 },
  chorizo:    { name: 'Chorizo',                    price: 7900 },
  americana:  { name: 'Salchicha americana',        price: 9900 },
  ranchera:   { name: 'Salchicha ranchera',         price: 11900 },
  pepinillos: { name: 'Pepinillos',                 price: 3900 },
  ripio:      { name: 'Ripio',                      price: 2900 },
  salsapina:  { name: 'Salsa piña',                 price: 5500 },
  salsaamer:  { name: 'Salsa americana',            price: 5500 },
  salsatart:  { name: 'Salsa tártara',              price: 5500 },
};
const TODOS_LOS_ADICIONALES = Object.keys(EXTRAS);

/* Categorías en el orden en que aparecen en la carta.
   icon: burger | fries | addon.  compact: lista sencilla sin fotos */
export const CATEGORIES = [
  { id: 'hamburguesas', name: 'Hamburguesas', icon: 'burger' },
  { id: 'salchipapas',  name: 'Salchipapas',  icon: 'fries' },
  { id: 'adicionales',  name: 'Adicionales',  icon: 'addon', compact: true },
];

/* Productos
   - image: ruta de la foto (o null para usar el ícono de la categoría)
   - badge: etiqueta opcional ('Top', 'En caja de pizza'…)
   - featured: true para mostrarlo en "Los que la rompen"
   - options: elecciones obligatorias (ej. carne o pollo)
   - extras: ids de EXTRAS que se le pueden agregar
   - available: false para ocultarlo temporalmente (agotado) */
export const PRODUCTS = [
  // ---------------- HAMBURGUESAS ----------------
  {
    id: 'la-clasica',
    category: 'hamburguesas',
    name: 'La Clásica DOKO',
    desc: 'Carne o pollo desmechado en salsa tártara, queso cheddar o queso mozzarella, tocineta, vegetales y salsas.',
    price: 19900,
    image: 'assets/img/carta/la-clasica.jpg',
    options: [
      { label: 'Proteína', choices: ['Carne', 'Pollo desmechado en salsa tártara'] },
      { label: 'Queso', choices: ['Queso cheddar', 'Queso mozzarella'] },
    ],
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'dulce-brava',
    category: 'hamburguesas',
    name: 'La Dulce Brava',
    desc: 'Carne, madurito, tocineta, queso mozzarella y salsas.',
    price: 22900,
    image: 'assets/img/carta/dulce-brava.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-mixta',
    category: 'hamburguesas',
    name: 'La Mixta DOKO',
    desc: 'Carne, pollo desmechado en salsa tártara, tocineta, queso mozzarella, vegetales y salsas.',
    price: 25900,
    image: 'assets/img/carta/la-mixta.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-gringa',
    category: 'hamburguesas',
    name: 'La Gringa',
    desc: 'Doble carne, doble queso cheddar, tocineta, pepinillos, cebolla caramelizada y salsa americana.',
    price: 27900,
    image: 'assets/img/carta/la-gringa.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-monster',
    category: 'hamburguesas',
    name: 'La Monster',
    desc: 'Doble carne, pollo desmechado, queso cheddar, queso mozzarella, tocineta, vegetales y salsas.',
    price: 31900,
    image: 'assets/img/carta/la-monster.jpg',
    badge: 'Top',
    featured: true,
    extras: TODOS_LOS_ADICIONALES,
  },

  // ---------------- SALCHIPAPAS ----------------
  {
    id: 'la-atrevida',
    category: 'salchipapas',
    name: 'La Atrevida',
    desc: 'Papas a la francesa, salchicha americana, pollo desmechado en salsa tártara, queso mozzarella, huevitos, vegetales y salsas.',
    price: 33900,
    image: 'assets/img/carta/la-atrevida.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-exquisita',
    category: 'salchipapas',
    name: 'La Exquisita',
    desc: 'Papas a la francesa, salchicha americana, pollo desmechado en salsa tártara, maicito (queso fundido con trozos de tocineta y maíz), papitas ripio, huevitos, vegetales y salsas.',
    price: 39900,
    image: 'assets/img/carta/la-exquisita.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-bestia',
    category: 'salchipapas',
    name: 'La Bestia',
    desc: 'Papas a la francesa, salchicha americana, pollo desmechado en salsa tártara, carne de hamburguesa en trozos, madurito, queso mozzarella, huevitos y vegetales.',
    price: 43900,
    image: 'assets/img/carta/la-bestia.jpg',
    badge: 'Top',
    featured: true,
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-traviesa',
    category: 'salchipapas',
    name: 'La Traviesa',
    desc: 'Papas a la francesa, salchicha americana, pollo desmechado en salsa tártara, pulled pork, salchicha ranchera, madurito, queso mozzarella, huevitos y salsa tártara.',
    price: 53900,
    image: 'assets/img/carta/la-traviesa.jpg',
    extras: TODOS_LOS_ADICIONALES,
  },
  {
    id: 'la-brutal',
    category: 'salchipapas',
    name: 'La Brutal DOKO',
    desc: 'En caja de pizza. Papas a la francesa, salchicha americana, chorizo, pollo desmechado en salsa tártara, carne de hamburguesa en trozos, madurito, queso mozzarella, huevitos, vegetales y salsas.',
    price: 81900,
    image: 'assets/img/carta/la-brutal.jpg',
    badge: 'Caja de pizza',
    featured: true,
    extras: TODOS_LOS_ADICIONALES,
  },

  // ---------------- ADICIONALES (se generan solos desde EXTRAS) ----------------
  ...Object.entries(EXTRAS).map(([id, extra]) => ({
    id: `adicional-${id}`,
    category: 'adicionales',
    name: extra.name,
    desc: 'Adicional',
    price: extra.price,
    image: null,
  })),
];

/* Galería de Instagram (fotos en assets/img/galeria) */
export const GALLERY = [
  { img: 'assets/img/galeria/reel-5.jpg', url: 'https://www.instagram.com/dokofood_/reel/DenM_5aKCpJ/', alt: 'Hamburguesa doble con queso cheddar' },
  { img: 'assets/img/galeria/reel-3.jpg', url: 'https://www.instagram.com/dokofood_/reel/DfIi4dxKFce/', alt: 'Perro con tocineta y huevo de codorniz' },
  { img: 'assets/img/galeria/reel-7.jpg', url: 'https://www.instagram.com/dokofood_/reel/DdpbWTCqpTJ/', alt: 'Salchipapa con salsa de ajo y huevos de codorniz' },
  { img: 'assets/img/galeria/reel-2.jpg', url: 'https://www.instagram.com/dokofood_/reel/DfNuRU6KrAa/', alt: 'Perro gigante DOKO' },
  { img: 'assets/img/galeria/reel-1.jpg', url: 'https://www.instagram.com/dokofood_/reel/DQkoCyWDWUT/', alt: 'Salchipapa mixta DOKO' },
  { img: 'assets/img/galeria/reel-6.jpg', url: 'https://www.instagram.com/dokofood_/reel/Dd7aTaYqsAc/', alt: 'Salchipapa con chorizo y maduro' },
  { img: 'assets/img/galeria/reel-4.jpg', url: 'https://www.instagram.com/dokofood_/reel/De2ro1FqcKI/', alt: 'Un día de compras y producción para DOKO' },
];
