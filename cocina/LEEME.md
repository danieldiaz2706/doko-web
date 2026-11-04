# DOKO Cocina — panel de pedidos

Panel para que caja y cocina compartan los pedidos en tiempo real. Se abre en
`https://dokofoodwebsite.netlify.app/cocina/` desde cualquier celular, tablet o
computador, y se puede instalar como app ("Agregar a la pantalla de inicio").

- Crear y editar pedidos con todos los productos, opciones y adicionales de la carta (`js/menu.js`).
- Estados: **Nuevos → Preparando → Listos → Entregados** (y Cancelados).
- Número de pedido consecutivo por día (#1, #2…), tiempo de espera y aviso de "EDITADO".
- Sonido y vibración cuando llega un pedido nuevo.
- Detecta si dos personas editan el mismo pedido a la vez.

Mientras `config.js` tenga `FIREBASE = null`, el panel funciona en **modo de
prueba**: solo guarda en el navegador donde se usa.

## Conectar Firebase (una sola vez, ~10 minutos, gratis)

1. Entra a https://console.firebase.google.com con la cuenta de Google de DOKO y
   pulsa **Crear un proyecto** (nombre: `doko-cocina`; Google Analytics: desactivado).
2. Menú **Compilación → Firestore Database → Crear base de datos**.
   Ubicación: `southamerica-east1` (São Paulo). Modo: **producción**.
3. **Elige una clave de acceso** de al menos 16 letras y números (por ejemplo,
   inventa una frase sin espacios). No la escribas en ningún archivo del proyecto.
4. En Firestore, pestaña **Reglas**: borra todo, pega el contenido de
   `cocina/firestore.rules`, cambia `ESCRIBE_AQUI_TU_CLAVE` por tu clave y pulsa **Publicar**.
5. **Configuración del proyecto** (engranaje) → **Tus apps** → icono **</>**
   (Web) → apodo `doko-cocina` → **Registrar app** (sin Hosting).
6. Copia el bloque `firebaseConfig` que aparece y pégalo en `cocina/config.js`
   en lugar de `null`. Esa configuración es pública por diseño; lo que protege
   los pedidos es la clave.
7. Sube el cambio a GitHub: Netlify publica solo.

## Enlace para el equipo

```
https://dokofoodwebsite.netlify.app/cocina/#k=TU_CLAVE
```

Cambia `TU_CLAVE` por la clave del paso 3 y envía el enlace solo al equipo.
La primera vez cada persona escribe su nombre (Caja, Cocina, Domicilios…) y el
panel recuerda la clave en ese dispositivo. Para cambiar la clave: cámbiala en las
reglas de Firebase y comparte el enlace nuevo.

## Probar en el computador

```bash
python -m http.server 5174
```

y abre `http://localhost:5174/cocina/`.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html`, `cocina.css` | Estructura y estilos del panel |
| `cocina.js` | Tablero, editor de pedidos, sonido y acceso |
| `datos.js` | Guarda y lee pedidos (Firebase o modo de prueba) |
| `config.js` | Configuración de Firebase |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase (con tu clave) |
| `sw.js`, `manifest.webmanifest` | Permiten instalar el panel como app |
