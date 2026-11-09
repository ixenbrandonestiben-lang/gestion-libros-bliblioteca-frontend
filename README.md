# Biblioteca Villa — aplicación web

¡Bienvenido! Este proyecto es la parte que puedes ver y usar en el navegador
de **Biblioteca Villa**. Desde aquí puedes explorar libros, iniciar sesión y
usar las herramientas de la biblioteca.

Piensa en la aplicación como una tienda: el frontend es el mostrador que ves y
el backend es quien busca la información y guarda los cambios. Para que todo
funcione, ambos deben poder hablar entre sí.

## ¿Qué necesitas?

Para abrir el frontend en tu computadora necesitas:

- Un navegador, como Chrome, Edge o Firefox.
- [Visual Studio Code](https://code.visualstudio.com/).
- La extensión **Live Server** de Visual Studio Code.
- Internet, porque la aplicación se conecta a la API publicada.

No necesitas instalar Node.js ni ejecutar `npm install` para usar solo este
frontend: está hecho con HTML, CSS y JavaScript, sin paquetes adicionales.

## La forma más fácil de abrirlo

1. Descarga el proyecto desde
   [GitHub](https://github.com/ixenbrandonestiben-lang/gestion-libros-bliblioteca-frontend)
   con el botón **Code → Download ZIP**.
2. Descomprime el archivo ZIP en una carpeta que puedas encontrar.
3. Abre Visual Studio Code y elige **File → Open Folder**. Selecciona la
   carpeta del proyecto.
4. Si todavía no tienes Live Server, abre **Extensions** en Visual Studio
   Code, busca `Live Server` e instálala.
5. En el explorador de archivos de Visual Studio Code, haz clic derecho en
   `index.html` y elige **Open with Live Server**.
6. Se abrirá una pestaña del navegador. ¡Ya puedes explorar la página!

También puedes descargar el proyecto con Git desde PowerShell:

```powershell
git clone https://github.com/ixenbrandonestiben-lang/gestion-libros-bliblioteca-frontend.git
cd gestion-libros-bliblioteca-frontend
code .
```

Después abre `index.html` con Live Server, como en los pasos anteriores.

**Importante:** no abras el archivo directamente con doble clic. Si la dirección
del navegador empieza con `file://`, algunas funciones no podrán comunicarse
con la API. Live Server abre la página con una dirección local, normalmente
`http://127.0.0.1:5500`.

## ¿Qué puedes hacer?

- Ver la página de bienvenida y una recomendación de libro.
- Explorar, buscar, filtrar y ordenar libros en el catálogo.
- Registrarte e iniciar sesión.
- Revisar tu perfil y tus préstamos.
- Si tienes permiso de bibliotecario, administrar libros, autores,
  editoriales, géneros, préstamos y ventas.
- Si tienes permiso de administrador, también administrar lectores y personal.

Las páginas de administración necesitan que inicies sesión con una cuenta que
tenga el permiso correspondiente. La página no puede darte permisos por sí
sola; el backend comprueba quién puede hacer cada cosa.

## ¿De dónde vienen los libros?

Por defecto, el frontend se conecta a la API publicada del backend:

`https://gestion-libros-bliblioteca-backend.onrender.com/api/v1`

La API es el programa que envía y recibe los datos. El repositorio de GitHub
contiene el código del backend, pero abrir ese enlace no inicia un servidor en
tu computadora. Puedes leer cómo instalarlo en el
[repositorio del backend](https://github.com/ixenbrandonestiben-lang/gestion-libros-bliblioteca-backend).

Si la API publicada no está disponible, algunas páginas pueden mostrar un error
o no tener datos. Para trabajar sin depender de esa API, sigue los pasos de la
siguiente sección.

## Ejecutar también el backend en tu computadora

Esta parte es opcional y un poco más avanzada. Necesitas instalar
[Node.js](https://nodejs.org/) y MySQL, además de tener el frontend abierto con
Live Server.

1. Sigue la guía del [repositorio del backend](https://github.com/ixenbrandonestiben-lang/gestion-libros-bliblioteca-backend)
   para descargarlo, preparar la base de datos y completar su archivo `.env`.
   Ese archivo guarda la configuración de MySQL y una clave privada para las
   sesiones. No compartas tu `.env` ni publiques esa clave.
2. Abre una terminal en la carpeta del backend e instala sus paquetes:

   ```powershell
   npm install
   ```

3. En el `.env` del backend, usa `PORT=3001`. En `CORS_ORIGINS`, agrega el
   origen que muestra Live Server, por ejemplo `http://127.0.0.1:5500` o
   `http://localhost:5500`. El origen es la dirección de la página, sin una
   barra al final.
4. Inicia el backend:

   ```powershell
   npm start
   ```

   Deja esa terminal abierta mientras uses la aplicación. El backend debe
   seguir funcionando para responder a las páginas.

5. En el frontend, abre `js/config/api.js` y cambia la dirección alternativa
   que aparece después de `??` por la dirección local:

   ```js
   'http://localhost:3001/api/v1'
   ```

   Guarda el archivo. Si después quieres volver a usar la API publicada,
   restaura la dirección que termina en `onrender.com/api/v1`.
6. Abre o recarga el frontend con Live Server.

Si Live Server usa un puerto distinto de `5500`, agrega el origen exacto que
aparece en tu navegador a `CORS_ORIGINS` en el `.env` del backend y reinicia el
backend. `localhost` y `127.0.0.1` son nombres distintos para esta lista:
agrega el que aparece en la dirección del navegador.

## Mapa de las carpetas

- `index.html`: página de bienvenida.
- `vistas/auth/`: páginas para iniciar sesión y registrarse.
- `vistas/cliente/`: catálogo, perfil y préstamos del lector.
- `vistas/admin/`: panel, administración, préstamos y punto de venta.
- `css/`: colores, estilos y componentes visuales.
- `js/config/api.js`: dirección de la API y rutas que usa el frontend.
- `js/config/recursos.js`: campos y reglas de los formularios de gestión.
- `js/modules/`: comportamiento específico de cada página.
- `js/utils/`: herramientas compartidas, como sesión, permisos de navegación
  y elementos de la página.
- `errors/`: páginas que se muestran para algunos errores de acceso o de
  dirección.

## Cómo se comunica con la API

Todas las llamadas se preparan en `js/config/api.js`. La dirección debe terminar
en `/api/v1`. Estas son las partes que usa la aplicación:

| Función | Rutas de la API |
| --- | --- |
| Iniciar y cerrar sesión, registrarse y consultar el perfil | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` |
| Consultar libros, autores, editoriales y géneros | `/libros`, `/autores`, `/editoriales`, `/generos-literarios` |
| Administrar libros, autores, editoriales y géneros | Crear, actualizar y eliminar recursos en esas mismas rutas |
| Administrar lectores y personal | `/clientes` y `/empleados` |
| Consultar y gestionar préstamos y devoluciones | `/prestamos` y `/prestamos/:id/devolucion` |
| Consultar y registrar ventas | `/ventas` |

`:id` significa que en ese lugar va el identificador de un libro o préstamo.
Por ejemplo, `/libros/12` consulta el libro cuyo identificador es `12`.

## Sesión y permisos

Al iniciar sesión, el navegador guarda la información temporal de la sesión en
`sessionStorage` y la envía a la API para las acciones que la necesitan. Al
cerrar la pestaña, esa información temporal desaparece. El frontend puede
ocultar páginas o botones, pero el backend es quien decide de verdad si la
cuenta tiene permiso. Nunca compartas tu contraseña ni las claves privadas del
backend.

## Si algo no funciona

- **La página no abre bien:** comprueba que la iniciaste con Live Server y que
  la dirección empieza con `http://`, no con `file://`.
- **No aparecen libros o sale un error de conexión:** comprueba tu conexión a
  Internet y que la API publicada esté disponible.
- **La página local no puede conectarse a tu backend:** comprueba que la
  terminal del backend sigue abierta, que `PORT` sea `3001` y que
  `CORS_ORIGINS` incluya exactamente el origen del frontend.
- **Una página de administración no te deja continuar:** inicia sesión con una
  cuenta que tenga el permiso necesario.
- **Cambiaste de dirección o puerto:** actualiza la URL en `js/config/api.js`
  y el origen permitido en el `.env` del backend.

## Comprobar el JavaScript

No hay un proceso de compilación para este frontend. Si tienes Node.js y quieres
comprobar la sintaxis de un módulo desde PowerShell, ejecuta desde la carpeta
del proyecto:

```powershell
Get-Content js\modules\catalogo.js -Raw | node --input-type=module --check
```

Las pruebas del backend se ejecutan desde la carpeta de ese otro proyecto con
`npm test`. Las instrucciones de su instalación están en el
[README del backend](https://github.com/ixenbrandonestiben-lang/gestion-libros-bliblioteca-backend).
