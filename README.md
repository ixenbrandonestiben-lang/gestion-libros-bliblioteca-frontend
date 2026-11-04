# Biblioteca Villa — Frontend

Frontend multipágina construido con HTML, CSS y JavaScript nativos. No usa
frameworks, compilador ni dependencias de npm.

## Ejecutar

1. Configura e inicia el backend Biblioteca Villa API en `http://localhost:3001`
   (consulta el README del repositorio backend).
2. Sirve esta carpeta desde un servidor HTTP local, por ejemplo Live Server en
   VS Code. No abras las páginas con `file://`, porque los módulos ES y las
   solicitudes `fetch` requieren un origen HTTP.
3. Abre `index.html`.

La URL base de la API está en `js/config/api.js`. Si frontend y backend usan
orígenes distintos, configura `CORS_ORIGINS` en el backend con el origen real
del frontend.

## Páginas

- `vistas/auth/`: inicio de sesión y registro.
- `vistas/cliente/`: catálogo, perfil y préstamos del lector.
- `vistas/admin/`: resumen, punto de venta y gestión de préstamos.
- `errors/`: páginas de acceso denegado y página no encontrada.

## Integración con la API

Las rutas usan el prefijo `/api/v1` y los contratos implementados por el
backend:

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/auth/login` | Iniciar sesión con `{ correo, contrasena }` |
| POST | `/auth/register` | Crear cliente con DPI, datos personales y contraseña |
| GET | `/auth/me` | Consultar el perfil autenticado |
| POST | `/auth/logout` | Confirmar el cierre de sesión |
| GET | `/libros` | Consultar el catálogo; la búsqueda se aplica en el navegador |
| GET | `/prestamos?page=1&limit=50` | Listar préstamos propios o globales según el rol |
| POST | `/prestamos` | Crear préstamo con `id_cliente`, `fecha_devolucion_esperada` y `libros` |
| POST | `/prestamos/:id/devolucion` | Devolver todos los detalles pendientes con sus estados |
| GET | `/ventas?page=1&limit=50` | Consultar ventas para el panel |
| POST | `/ventas` | Crear venta con `id_cliente` e items `{ id_libro, cantidad }` |

El servidor calcula precios, existencias, permisos, fechas y multas; la interfaz
no envía precios ni el identificador del empleado.

## Sesión y seguridad

La API devuelve un JWT Bearer válido por ocho horas. Para mantener la sesión
entre páginas, la interfaz guarda el token junto con los datos básicos del
usuario en `sessionStorage` y lo envía en el encabezado `Authorization`. Se
elimina al cerrar sesión. No se guarda en `localStorage`; el almacenamiento del
navegador sigue siendo accesible a JavaScript, por lo que el guard del frontend
es solo una ayuda de navegación. La autorización efectiva siempre corresponde
al backend.
