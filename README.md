# Biblioteca Villa — Frontend

Frontend multipágina construido con HTML, CSS y JavaScript nativos. No usa
frameworks, compilador ni dependencias de npm.

## Ejecutar

1. Inicia el backend Biblioteca Villa en `http://localhost:3000`.
2. Sirve esta carpeta desde un servidor HTTP local (por ejemplo, Live Server en
   VS Code). No abras las páginas con `file://`, porque los módulos ES y las
   solicitudes `fetch` requieren un origen HTTP.
3. Abre `index.html`.

La URL base de la API está en `js/config/api.js`. El cliente envía cookies con
`credentials: 'include'`; el backend debe establecer la sesión en una cookie
`HttpOnly` y habilitar CORS para el origen del frontend cuando se ejecuten en
puertos diferentes.

## Páginas

- `vistas/auth/`: inicio de sesión y registro.
- `vistas/cliente/`: catálogo, perfil y préstamos del lector.
- `vistas/admin/`: resumen, punto de venta y gestión de préstamos.
- `errors/`: páginas de acceso denegado y página no encontrada.

## Endpoints que espera la interfaz

Los nombres y contratos deben coincidir con los controladores y DTOs del
backend. La interfaz centraliza las rutas en `js/config/api.js`:

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/auth/login` | Iniciar sesión; respuesta con usuario y rol, sesión en cookie HttpOnly |
| POST | `/auth/registro` | Crear cuenta de cliente |
| POST | `/auth/logout` | Cerrar la sesión del servidor y expirar la cookie |
| GET | `/auth/perfil` | Consultar el perfil autenticado |
| GET | `/libros?q=` | Listar y filtrar libros |
| GET | `/prestamos` | Listar préstamos para personal |
| GET | `/prestamos/mis-prestamos` | Consultar préstamos del usuario autenticado |
| POST | `/prestamos` | Registrar préstamo |
| PATCH | `/prestamos/:id/devolucion` | Registrar devolución y condición del libro |
| GET | `/ventas` | Consultar ventas para el panel |
| POST | `/ventas` | Crear venta con artículos `{ id_libro, cantidad }` |

El panel deriva los indicadores de las listas de libros, préstamos y ventas. La
interfaz de devolución calcula el atraso; para estimar la multa, la API debe
incluir `multa_diaria` o `tarifa_mora_diaria`. El backend siempre debe validar
existencias, precios, permisos y multas dentro de sus transacciones.

## Sesión y seguridad

El token no se guarda en `localStorage` ni en `sessionStorage`. La interfaz
espera una cookie HttpOnly del backend; `sessionStorage` conserva únicamente el
nombre y rol para navegación y presentación. El guard del navegador es solo
una ayuda de UX y no es una frontera de seguridad: todos los permisos deben
validarse en el backend.

Al momento de preparar esta interfaz, el repositorio backend expone los
prefijos de rutas pero sus routers, controladores y DTOs están vacíos. Por eso
las pantallas manejan los errores de API sin datos de muestra; las operaciones
reales requieren implementar y probar esos endpoints, alinear los contratos y
configurar CORS/cookies en el backend.
