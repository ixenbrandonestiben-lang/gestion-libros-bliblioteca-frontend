# Biblioteca Villa · Un lugar entre líneas

Aplicación multipágina en HTML, CSS y JavaScript vanilla. No usa frameworks,
bundlers ni dependencias de terceros. La experiencia mezcla una paleta editorial
de bosque, coral, lila y lima con portadas generadas con CSS, estantería de
favoritos, búsqueda instantánea y fichas dinámicas.

## Ejecutar y conectar la aplicación

La aplicación usa por defecto la API desplegada en
`https://gestion-libros-bliblioteca-backend.onrender.com/api/v1`. La URL del
repositorio GitHub contiene el código, pero no es un servidor de API.

Sirve esta carpeta con Live Server en VS Code o con cualquier servidor estático;
no abras los HTML con `file://`. Abre `index.html` para explorar el catálogo
público o inicia sesión para usar las funciones de la biblioteca.

Para trabajar con una instancia local, inicia MySQL y el backend con `npm start`.
En el backend, configura `SERVER_PORT=3001` y permite el origen del frontend en
`CORS_ORIGINS`. Después, antes de los módulos de la página, define la URL local:

```js
window.BIBLIOTECA_API_URL = 'http://localhost:3001/api/v1';
```

La URL activa se centraliza en `js/config/api.js`; cualquier valor de
`window.BIBLIOTECA_API_URL` la reemplaza. Para probar el frontend local contra
Render, agrega `http://localhost:5500` y `http://127.0.0.1:5500` a
`CORS_ORIGINS` en la configuración del backend. Al desplegar el frontend,
agrega también su origen público exacto (por ejemplo, `https://usuario.github.io`).
Si ya existe `CORS_ORIGINS` en Render, conserva los demás orígenes que necesites
en esa lista separada por comas. No incluyas una barra final en los orígenes.

## Mapa de la aplicación

- `index.html`: entrada editorial y recomendación conectada al catálogo.
- `vistas/cliente/catalogo.html`: catálogo público con búsqueda, filtros,
  orden, favoritos temporales y detalle de libro.
- `vistas/cliente/mis-prestamos.html`: historial propio paginado y detalle de
  cada préstamo.
- `vistas/cliente/perfil.html`: perfil obtenido desde la sesión autenticada.
- `vistas/admin/dashboard.html`: métricas, ventas recientes y recibos.
- `vistas/admin/recursos.html`: libros, autores, editoriales, géneros y, para
  administradores, lectores y equipo.
- `vistas/admin/gestion-prestamos.html`: creación, seguimiento y devolución.
- `vistas/admin/pos.html`: punto de venta con validación de stock y recibo real.
- `js/config/recursos.js`: definición de campos y reglas de formularios
  reutilizables para el espacio de gestión.
- `js/modules/`: comportamiento por página; `js/utils/` contiene piezas
  compartidas de sesión, presentación y DOM.

## Integración con los endpoints

Todas las solicitudes se centralizan en `apiFetch`; las respuestas y errores
se muestran sin datos simulados. La API debe usar el prefijo `/api/v1`.

| Área | Endpoints usados |
| --- | --- |
| Sesión | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout` |
| Colección pública | `GET /libros`, `GET /libros/:id`, `GET /autores`, `GET /editoriales`, `GET /generos-literarios` |
| Catálogo de personal | `POST`, `PATCH`, `DELETE` en `/libros`, `/autores`, `/editoriales` y `/generos-literarios`; los formularios consultan `GET /:id` antes de editar |
| Cuentas — solo ADMIN | `GET`, `GET /:id`, `POST`, `PATCH` y `DELETE` en `/clientes`; `GET`, `GET /:id`, `POST`, `PATCH` y `DELETE` en `/empleados` |
| Préstamos | `GET /prestamos?page=&limit=`, `GET /prestamos/:id`, `POST /prestamos`, `POST /prestamos/:id/devolucion` |
| Ventas | `GET /ventas?page=&limit=`, `GET /ventas/:id`, `POST /ventas` |

El taller de recursos respeta las diferencias de permisos: bibliotecarios
gestionan el catálogo; solo `ADMIN` puede administrar lectores y personal. El
middleware y los servicios del backend siguen siendo la autoridad de permisos.
La venta no envía precios ni empleado; el préstamo obtiene el empleado desde el
JWT. La devolución envía todos los detalles pendientes con el estado de cada
libro.

## Sesión y seguridad

El backend devuelve un JWT Bearer que el frontend conserva en `sessionStorage`
para navegar entre páginas y enviar el encabezado `Authorization`. Se elimina
al cerrar sesión y no se guarda en `localStorage`. El almacenamiento del
navegador es accesible a JavaScript: los guards solo mejoran la navegación, no
son una frontera de seguridad. Toda autorización real se valida en el backend.

## Verificación

El frontend no requiere instalar paquetes. Para comprobar los módulos
JavaScript en Node:

```powershell
Get-Content js\modules\catalogo.js -Raw | node --input-type=module --check
```

La suite de backend se ejecuta en el otro repositorio con `npm test`.
