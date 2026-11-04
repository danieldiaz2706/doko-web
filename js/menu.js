/* ==========================================================================
   DOKO — Datos del negocio y de la carta
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para cambiar precios, productos,
   horarios, número de WhatsApp o métodos de pago. No hace falta saber
   programar: cambia los textos/números entre comillas y guarda.

   ⚠️ Los precios y descripciones actuales son ESTIMADOS a partir de lo que se
   ve en el Instagram @dokofood_. Reemplázalos por los de la carta oficial.
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

/* Adiciones que se pueden sumar a los productos (precio en pesos) */
export const EXTRAS = {
  tocineta:   { name: 'Tocineta extra',            price: 4000 },
  cheddar:    { name: 'Queso cheddar',             price: 3000 },
  mozzarella: { name: 'Queso mozzarella gratinado', price: 4000 },
  carne:      { name: 'Carne extra (150 g)',       price: 8000 },
  codorniz:   { name: 'Huevos de codorniz (x3)',   price: 3000 },
  pollo:      { name: 'Pollo desmechado cremoso',  price: 6000 },
  salchicha:  { name: 'Salchicha extra',           price: 4000 },
  maduro:     { name: 'Maduro',                    price: 3000 },
  jalapenos:  { name: 'Jalapeños',                 price: 2000 },
  papas:      { name: 'Porción de papas',          price: 6000 },
};

/* Categorías en el orden en que aparecen en la carta.
   icon: burger | fries | hotdog | combo | side | drink */
export const CATEGORIES = [
  { id: 'hamburguesas', name: 'Hamburguesas', icon: 'burger' },
  { id: 'salchipapas',  name: 'Salchipapas',  icon: 'fries' },
  { id: 'perros',       name: 'Perros',       icon: 'hotdog' },
  { id: 'combos',       name: 'Combos',       icon: 'combo' },
  { id: 'acompanantes', name: 'Acompañantes', icon: 'side' },
  { id: 'bebidas',      name: 'Bebidas',      icon: 'drink' },
];

const SABORES_GASEOSA = ['Coca-Cola', 'Colombiana', 'Manzana', 'Uva', 'Naranja'];

/* Productos
   - image: ruta de la foto (o null para usar el ícono de la categoría)
   - badge: etiqueta opcional ('Top', 'Picante', 'Para compartir'…)
   - featured: true para mostrarlo en "Los que la rompen"
   - options: elección obligatoria (ej. sabor de la gaseosa)
   - extras: ids de EXTRAS que se le pueden agregar
   - available: false para ocultarlo temporalmente (agotado) */
export const PRODUCTS = [
  // ---------------- HAMBURGUESAS ----------------
  {
    id: 'doble-brutal',
    category: 'hamburguesas',
    name: 'Doble Brutal',
    desc: 'Doble carne smash, doble cheddar fundido, cebolla caramelizada y salsa BBQ de la casa en pan brioche.',
    price: 27000,
    image: 'assets/img/burger.jpg',
    badge: 'Top',
    featured: true,
    extras: ['tocineta', 'cheddar', 'carne', 'jalapenos', 'papas'],
  },
  {
    id: 'doko-clasica',
    category: 'hamburguesas',
    name: 'DOKO Clásica',
    desc: 'Carne de res 150 g, queso cheddar, lechuga, tomate, cebolla y salsa DOKO.',
    price: 18000,
    image: null,
    extras: ['tocineta', 'cheddar', 'carne', 'jalapenos', 'papas'],
  },
  {
    id: 'la-jaguar',
    category: 'hamburguesas',
    name: 'La Jaguar',
    desc: 'Carne de res, cheddar y mozzarella, tocineta crocante, ensalada cremosa de la casa y salsa rosada.',
    price: 26000,
    image: null,
    badge: 'De la casa',
    extras: ['tocineta', 'cheddar', 'carne', 'jalapenos', 'papas'],
  },
  {
    id: 'bacon-bbq',
    category: 'hamburguesas',
    name: 'Bacon BBQ',
    desc: 'Carne de res, cheddar, tocineta crocante, aros de cebolla y salsa BBQ ahumada.',
    price: 24000,
    image: null,
    extras: ['tocineta', 'cheddar', 'carne', 'jalapenos', 'papas'],
  },

  // ---------------- SALCHIPAPAS ----------------
  {
    id: 'salchi-doko',
    category: 'salchipapas',
    name: 'Salchipapa DOKO',
    desc: 'Papa a la francesa, salchicha, maduro, pollo desmechado cremoso, huevos de codorniz y salsa de ajo.',
    price: 25000,
    image: 'assets/img/salchipapa.jpg',
    badge: 'Top',
    featured: true,
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha', 'maduro'],
  },
  {
    id: 'salchi-mixta',
    category: 'salchipapas',
    name: 'Salchipapa Mixta',
    desc: 'Papa, salchicha, carne de res en trozos, pollo, maduro, huevos de codorniz, queso y salsa blanca.',
    price: 30000,
    image: 'assets/img/mixta.jpg',
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha', 'maduro'],
  },
  {
    id: 'salchi-clasica',
    category: 'salchipapas',
    name: 'Salchipapa Clásica',
    desc: 'Papa a la francesa, salchicha, queso rallado y salsas de la casa.',
    price: 14000,
    image: null,
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha', 'maduro'],
  },
  {
    id: 'salchi-familiar',
    category: 'salchipapas',
    name: 'Salchipapa Familiar',
    desc: 'La Salchipapa DOKO en tamaño para compartir entre 3 y 4 personas.',
    price: 55000,
    image: null,
    badge: 'Para compartir',
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha', 'maduro'],
  },

  // ---------------- PERROS ----------------
  {
    id: 'perro-doko',
    category: 'perros',
    name: 'Perro DOKO',
    desc: 'Pan brioche, salchicha americana, pollo desmechado cremoso, tocineta crocante, huevo de codorniz y papita ripio.',
    price: 18000,
    image: 'assets/img/perro.jpg',
    badge: 'Top',
    featured: true,
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha'],
  },
  {
    id: 'perro-gigante',
    category: 'perros',
    name: 'Perro Gigante',
    desc: 'Pan de 30 cm, doble salchicha, queso gratinado, tocineta y salsas DOKO.',
    price: 24000,
    image: null,
    extras: ['tocineta', 'mozzarella', 'codorniz', 'pollo', 'salchicha'],
  },
  {
    id: 'perro-sencillo',
    category: 'perros',
    name: 'Perro Sencillo',
    desc: 'Salchicha, queso, papita ripio, cebolla y salsas de la casa.',
    price: 11000,
    image: null,
    extras: ['tocineta', 'mozzarella', 'codorniz', 'salchicha'],
  },

  // ---------------- COMBOS ----------------
  {
    id: 'combo-brutal',
    category: 'combos',
    name: 'Combo Brutal',
    desc: 'Doble Brutal + papas a la francesa + gaseosa personal.',
    price: 34000,
    image: null,
    badge: 'Ahorra',
    options: { label: 'Sabor de la gaseosa', choices: SABORES_GASEOSA },
    extras: ['tocineta', 'cheddar', 'carne'],
  },
  {
    id: 'combo-clasico',
    category: 'combos',
    name: 'Combo Clásico',
    desc: 'DOKO Clásica + papas a la francesa + gaseosa personal.',
    price: 26000,
    image: null,
    options: { label: 'Sabor de la gaseosa', choices: SABORES_GASEOSA },
    extras: ['tocineta', 'cheddar', 'carne'],
  },
  {
    id: 'combo-parche',
    category: 'combos',
    name: 'Combo Parche',
    desc: '2 DOKO Clásicas + 1 Salchipapa Clásica + gaseosa 1.5 L. Para el parche completo.',
    price: 55000,
    image: null,
    badge: 'Para compartir',
    options: { label: 'Sabor de la gaseosa', choices: SABORES_GASEOSA },
    extras: ['tocineta', 'cheddar', 'codorniz'],
  },

  // ---------------- ACOMPAÑANTES ----------------
  {
    id: 'papas-francesa',
    category: 'acompanantes',
    name: 'Papas a la francesa',
    desc: 'Porción de papas crocantes con salsas de la casa.',
    price: 7000,
    image: null,
  },
  {
    id: 'papas-tocineta',
    category: 'acompanantes',
    name: 'Papas queso y tocineta',
    desc: 'Papas a la francesa con queso fundido y tocineta crocante.',
    price: 12000,
    image: null,
  },
  {
    id: 'aros-cebolla',
    category: 'acompanantes',
    name: 'Aros de cebolla',
    desc: 'Aros de cebolla apanados, dorados y crocantes.',
    price: 9000,
    image: null,
  },

  // ---------------- BEBIDAS ----------------
  {
    id: 'gaseosa-personal',
    category: 'bebidas',
    name: 'Gaseosa personal',
    desc: 'Botella de 400 ml bien fría.',
    price: 4000,
    image: null,
    options: { label: 'Sabor', choices: SABORES_GASEOSA },
  },
  {
    id: 'gaseosa-litro',
    category: 'bebidas',
    name: 'Gaseosa 1.5 L',
    desc: 'Para compartir con el parche.',
    price: 8000,
    image: null,
    options: { label: 'Sabor', choices: SABORES_GASEOSA },
  },
  {
    id: 'jugo-hit',
    category: 'bebidas',
    name: 'Jugo Hit personal',
    desc: 'Mango, mora o tropical.',
    price: 4000,
    image: null,
    options: { label: 'Sabor', choices: ['Mango', 'Mora', 'Tropical'] },
  },
  {
    id: 'agua',
    category: 'bebidas',
    name: 'Agua',
    desc: 'Botella de 600 ml.',
    price: 3000,
    image: null,
  },
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
