const accountFields = [
  { name: 'dpi', label: 'DPI', maxLength: 20, required: true },
  { name: 'nombre', label: 'Nombre', maxLength: 100, required: true },
  { name: 'apellido', label: 'Apellido', maxLength: 100, required: true },
  { name: 'telefono', label: 'Teléfono', type: 'tel', maxLength: 20, pattern: '[+0-9\\s().-]{7,20}' },
  { name: 'correo', label: 'Correo electrónico', type: 'email', maxLength: 250, required: true },
  { name: 'contrasena', label: 'Contraseña', type: 'password', minLength: 8, maxLength: 72, createRequired: true }
];

export const RESOURCE_GROUPS = Object.freeze([
  {
    key: 'library',
    label: 'La colección',
    resources: ['books', 'authors', 'publishers', 'genres']
  },
  {
    key: 'community',
    label: 'La comunidad',
    adminOnly: true,
    resources: ['clients', 'staff']
  }
]);

export const RESOURCES = Object.freeze({
  books: {
    endpoint: 'libros',
    label: 'Libros',
    singular: 'libro',
    idField: 'id_libro',
    primaryField: 'titulo',
    fields: [
      { name: 'titulo', label: 'Título', maxLength: 200, required: true },
      { name: 'isbn', label: 'ISBN', maxLength: 50, required: true },
      { name: 'precio', label: 'Precio de venta (Q)', type: 'number', min: 0, max: 99999999.99, step: 0.01, required: true },
      { name: 'stock', label: 'Ejemplares en estantería', type: 'number', min: 0, step: 1, defaultValue: 0 },
      { name: 'anio_publicacion', label: 'Año de publicación', type: 'number', min: 1, max: 9999, step: 1 },
      { name: 'paginas', label: 'Páginas', type: 'number', min: 1, step: 1 },
      { name: 'idioma_escritura', label: 'Idioma', maxLength: 50 },
      { name: 'id_autor', label: 'Autor', type: 'select', relation: 'authors', valueField: 'id_autor', textField: 'nombre_autor', required: true },
      { name: 'id_editorial', label: 'Editorial', type: 'select', relation: 'publishers', valueField: 'id_editorial', textField: 'nombre_editorial', required: true },
      { name: 'id_genero', label: 'Género', type: 'select', relation: 'genres', valueField: 'id_genero', textField: 'nombre_genero', required: true }
    ]
  },
  authors: {
    endpoint: 'autores',
    label: 'Autores',
    singular: 'autor',
    idField: 'id_autor',
    primaryField: 'nombre_autor',
    fields: [{ name: 'nombre_autor', label: 'Nombre del autor', maxLength: 150, required: true }]
  },
  publishers: {
    endpoint: 'editoriales',
    label: 'Editoriales',
    singular: 'editorial',
    idField: 'id_editorial',
    primaryField: 'nombre_editorial',
    fields: [{ name: 'nombre_editorial', label: 'Nombre de la editorial', maxLength: 150, required: true }]
  },
  genres: {
    endpoint: 'generos-literarios',
    label: 'Géneros',
    singular: 'género',
    idField: 'id_genero',
    primaryField: 'nombre_genero',
    fields: [{ name: 'nombre_genero', label: 'Nombre del género', minLength: 3, maxLength: 100, required: true }]
  },
  clients: {
    endpoint: 'clientes',
    label: 'Lectores',
    singular: 'lector',
    idField: 'id_cliente',
    primaryField: 'nombre',
    adminOnly: true,
    fields: [
      ...accountFields,
      {
        name: 'rol',
        label: 'Membresía',
        type: 'select',
        required: true,
        defaultValue: 'CLIENTE_REGULAR',
        options: [
          ['CLIENTE_REGULAR', 'Lector'],
          ['CLIENTE_PREMIUM', 'Lector premium']
        ]
      },
      {
        name: 'estado_cuenta',
        label: 'Estado de la cuenta',
        type: 'select',
        defaultValue: 'ACTIVO',
        options: [
          ['ACTIVO', 'Activa'],
          ['SUSPENDIDO', 'Suspendida'],
          ['BLOQUEADO_POR_MORA', 'Bloqueada por mora']
        ]
      }
    ]
  },
  staff: {
    endpoint: 'empleados',
    label: 'Equipo',
    singular: 'miembro del equipo',
    idField: 'id_cliente',
    primaryField: 'nombre',
    adminOnly: true,
    deleteLabel: 'Suspender',
    fields: [
      ...accountFields,
      {
        name: 'rol',
        label: 'Rol',
        type: 'select',
        required: true,
        defaultValue: 'BIBLIOTECARIO',
        options: [
          ['BIBLIOTECARIO', 'Bibliotecario'],
          ['ADMIN', 'Administrador']
        ]
      },
      {
        name: 'estado_cuenta',
        label: 'Estado de la cuenta',
        type: 'select',
        defaultValue: 'ACTIVO',
        options: [
          ['ACTIVO', 'Activa'],
          ['SUSPENDIDO', 'Suspendida']
        ]
      }
    ]
  }
});
