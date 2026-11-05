# Biblioteca Villa · Un lugar entre líneas

Aplicación multipágina en HTML, CSS y JavaScript vanilla. No usa frameworks,
bundlers ni dependencias de terceros. La experiencia mezcla una paleta editorial
de bosque, coral, lila y lima con portadas generadas con CSS, estantería de
favoritos, búsqueda instantánea y fichas dinámicas.

## Ejecutar en local

1. Configura MySQL y el `.env` del repositorio backend.
2. Desde el backend, ejecuta `npm start`. La configuración local de este
   proyecto usa `http://localhost:3001`.
3. Sirve esta carpeta con Live Server en VS Code o con cualquier servidor
   estático. No abras los HTML con `file://`.
4. Abre `index.html`. El inicio presenta una recomendación que cambia cada día
   y permite entrar al catálogo público sin iniciar sesión.

El backend debe permitir el origen donde sirve el frontend en `CORS_ORIGINS`.
El middleware incluye `http://localhost:5500` y `http://127.0.0.1:5500` en su
configuración de desarrollo. Consulta el README del backend para iniciar sesión
con una cuenta de personal y configurar el primer administrador.

Si la API está en otro origen, define `window.BIBLIOTECA_API_URL` antes de los
módulos frontend, por ejemplo:

```html
<script>window.BIBLIOTECA_API_URL = 'https://api.ejemplo.com/api/v1';</script>
```

La URL predeterminada está centralizada en `js/config/api.js`.

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
