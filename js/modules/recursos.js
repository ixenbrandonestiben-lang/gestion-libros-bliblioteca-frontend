import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { RESOURCE_GROUPS, RESOURCES } from '../config/recursos.js';
import { getSession, normalizeRole } from '../utils/auth.js';
import {
  createElement,
  formatMoney,
  notify,
  unwrapList,
  unwrapRecord
} from '../utils/dom.js';

const tabs = document.querySelector('[data-resource-tabs]');
const heading = document.querySelector('[data-resource-heading]');
const count = document.querySelector('[data-resource-count]');
const search = document.querySelector('[data-resource-search]');
const status = document.querySelector('[data-resource-status]');
const list = document.querySelector('[data-resource-list]');
const createButton = document.querySelector('[data-create-resource]');
const dialog = document.querySelector('[data-resource-dialog]');
const dialogTitle = document.querySelector('#resource-dialog-title');
const dialogHelp = document.querySelector('[data-resource-dialog-help]');
const form = document.querySelector('[data-resource-form]');
const session = getSession();
const isAdmin = normalizeRole(session?.role) === 'ADMIN';

const collections = new Map();
let activeResource = 'books';
let editingId = null;
let referenceData = {};

const accessibleResources = RESOURCE_GROUPS
  .filter((group) => !group.adminOnly || isAdmin)
  .flatMap((group) => group.resources);

for (const tab of tabs.querySelectorAll('[data-resource-tab]')) {
  tab.hidden = RESOURCES[tab.dataset.resourceTab].adminOnly && !isAdmin;
}

function getResource(key = activeResource) {
  const resource = RESOURCES[key];
  if (!resource || !accessibleResources.includes(key)) {
    throw new Error('No tienes acceso a esta sección.');
  }
  return resource;
}

function text(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function getRecordTitle(resource, record) {
  if (resource.idField === 'id_cliente') {
    return [record.nombre, record.apellido].filter(Boolean).join(' ') || resource.singular;
  }
  return text(record[resource.primaryField], resource.singular);
}

function getRecordSummary(key, record) {
  if (key === 'books') {
    const author = referenceData.authors?.find((item) => item.id_autor === record.id_autor)?.nombre_autor;
    const publisher = referenceData.publishers?.find((item) => item.id_editorial === record.id_editorial)?.nombre_editorial;
    const genre = referenceData.genres?.find((item) => item.id_genero === record.id_genero)?.nombre_genero;
    return [
      text(author, `Autor #${record.id_autor}`),
      text(genre, `Género #${record.id_genero}`),
      formatMoney(record.precio),
      `${Number(record.stock ?? 0)} ejemplares`
    ].join(' · ');
  }

  if (key === 'clients' || key === 'staff') {
    return [
      text(record.correo),
      text(record.rol),
      text(record.estado_cuenta)
    ].join(' · ');
  }

  return `Registro #${text(record[resourceIdField(key)])}`;
}

function resourceIdField(key) {
  return RESOURCES[key].idField;
}

function makeStatusPill(value) {
  const pill = createElement('span', 'pill pill--muted', value);
  if (value === 'ACTIVO' || value === 'DISPONIBLE') {
    pill.className = 'pill';
  } else if (value === 'BLOQUEADO_POR_MORA' || value === 'SUSPENDIDO') {
    pill.className = 'pill pill--coral';
  }
  return pill;
}

function renderEmpty(message, title = 'Una página en blanco') {
  const empty = createElement('div', 'empty-state');
  const copy = document.createElement('div');
  copy.append(createElement('strong', '', title), createElement('span', '', message));
  empty.append(copy);
  list.replaceChildren(empty);
}

function renderRecord(key, record) {
  const resource = RESOURCES[key];
  const card = createElement('article', 'record-card');
  const top = createElement('div', 'record-card__top');
  const title = getRecordTitle(resource, record);
  const id = text(record[resource.idField]);
  top.append(createElement('h3', '', title), createElement('span', 'pill pill--lilac', `#${id}`));

  const summary = createElement('p', '', getRecordSummary(key, record));
  card.append(top, summary);

  if (record.estado_cuenta) {
    card.append(makeStatusPill(record.estado_cuenta));
  } else if (key === 'books') {
    card.append(makeStatusPill(Number(record.stock) > 0 ? 'DISPONIBLE' : 'AGOTADO'));
  }

  const actions = createElement('div', 'record-card__actions');
  const edit = createElement('button', 'boton boton--secundario boton--pequeno', 'Abrir ficha');
  edit.type = 'button';
  edit.dataset.recordEdit = id;
  const remove = createElement(
    'button',
    'boton boton--peligro boton--pequeno',
    resource.deleteLabel ?? 'Eliminar'
  );
  remove.type = 'button';
  remove.dataset.recordDelete = id;
  actions.append(edit, remove);
  card.append(actions);
  return card;
}

function renderRecords() {
  const resource = getResource();
  const records = collections.get(activeResource) ?? [];
  const query = search.value.trim().toLocaleLowerCase('es');
  const filtered = records.filter((record) => (
    JSON.stringify(record).toLocaleLowerCase('es').includes(query)
  ));

  heading.textContent = resource.label;
  count.textContent = `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`;
  if (filtered.length === 0) {
    renderEmpty(
      query ? 'Prueba con otras palabras; esta estantería todavía no encuentra esa ficha.' : 'Añade la primera ficha para empezar a construir esta colección.',
      query ? 'No encontramos coincidencias' : 'Todavía no hay registros'
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of filtered) {
    fragment.append(renderRecord(activeResource, record));
  }
  list.replaceChildren(fragment);
}

async function loadResource(key, { showLoading = false } = {}) {
  if (!accessibleResources.includes(key)) {
    return;
  }

  if (showLoading) {
    list.setAttribute('aria-busy', 'true');
    status.textContent = `Abriendo ${RESOURCES[key].label.toLocaleLowerCase('es')}…`;
  }

  try {
    const response = await apiFetch(RESOURCES[key].endpoint);
    const records = unwrapList(response, [key]);
    collections.set(key, records);
    if (key === activeResource) {
      renderRecords();
      status.textContent = `${records.length} ${records.length === 1 ? 'ficha lista' : 'fichas listas'} para explorar.`;
      list.setAttribute('aria-busy', 'false');
    }
  } catch (error) {
    if (key === activeResource) {
      status.textContent = error.message || `No se pudieron cargar ${RESOURCES[key].label.toLocaleLowerCase('es')}.`;
      renderEmpty('Comprueba tu conexión y vuelve a intentarlo.', 'La colección no pudo abrirse');
      list.setAttribute('aria-busy', 'false');
    }
  }
}

async function loadWorkspace() {
  list.setAttribute('aria-busy', 'true');
  status.textContent = 'Ordenando las estanterías…';
  const catalogueKeys = ['authors', 'publishers', 'genres'];
  const keysToLoad = [...accessibleResources];
  const results = await Promise.allSettled(keysToLoad.map((key) => (
    apiFetch(RESOURCES[key].endpoint).then((response) => [key, unwrapList(response, [key])])
  )));

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [key, data] = result.value;
      collections.set(key, data);
    } else {
      console.error('No se pudo cargar un recurso de biblioteca:', result.reason);
    }
  }

  referenceData = Object.fromEntries(
    catalogueKeys.map((key) => [key, collections.get(key) ?? []])
  );
  renderRecords();
  const errorCount = results.filter((result) => result.status === 'rejected').length;
  const failedResources = results.flatMap((result, index) => (
    result.status === 'rejected'
      ? [RESOURCES[keysToLoad[index]].label.toLocaleLowerCase('es')]
      : []
  ));
  status.textContent = errorCount
    ? `No se pudieron cargar ${failedResources.join(', ')}. Revisa permisos o conexión.`
    : 'Tu colección está al día. Elige una ficha para abrirla.';
  list.setAttribute('aria-busy', 'false');
}

function makeField(field, record = {}) {
  const label = createElement('label', 'campo');
  label.append(createElement('span', '', field.label));
  let control;

  if (field.type === 'select') {
    control = document.createElement('select');
    const placeholder = createElement('option', '', 'Elige una opción');
    placeholder.value = '';
    control.append(placeholder);

    const options = field.relation
      ? (referenceData[field.relation] ?? []).map((item) => [
        item[field.valueField],
        item[field.textField]
      ])
      : field.options;

    for (const [value, optionLabel] of options ?? []) {
      const option = createElement('option', '', optionLabel);
      option.value = String(value);
      control.append(option);
    }
  } else {
    control = document.createElement('input');
    control.type = field.type ?? 'text';
    if (field.maxLength) control.maxLength = field.maxLength;
    if (field.minLength) control.minLength = field.minLength;
    if (field.pattern) control.pattern = field.pattern;
    if (field.min !== undefined) control.min = String(field.min);
    if (field.max !== undefined) control.max = String(field.max);
    if (field.step !== undefined) control.step = String(field.step);
  }

  control.name = field.name;
  control.dataset.resourceField = '';
  control.required = Boolean(field.required || (!editingId && field.createRequired));

  const value = record[field.name];
  if (value !== undefined && value !== null) {
    control.value = String(value);
  } else if (!editingId && field.defaultValue !== undefined) {
    control.value = String(field.defaultValue);
  }

  label.append(control);
  return label;
}

function openForm(record = null) {
  const resource = getResource();
  editingId = record?.[resource.idField] ?? null;
  dialogTitle.textContent = editingId
    ? `Editar ${resource.singular}`
    : `Añadir ${resource.singular}`;
  dialogHelp.textContent = editingId
    ? 'Revisa la ficha y guarda cuando esté lista. Los cambios se validan en el servidor.'
    : 'Cada dato cuenta para que el próximo lector encuentre su historia.';

  const fields = createElement('div', 'record-form__grid');
  for (const field of resource.fields) {
    fields.append(makeField(field, record ?? {}));
  }

  const actions = createElement('div', 'toolbar');
  const cancel = createElement('button', 'boton boton--secundario', 'Volver');
  cancel.type = 'button';
  cancel.dataset.closeResource = '';
  const save = createElement('button', 'boton boton--coral', editingId ? 'Guardar cambios' : 'Crear ficha');
  save.type = 'submit';
  actions.append(cancel, save);
  form.replaceChildren(fields, actions);
  dialog.showModal();
  form.querySelector('input, select')?.focus();
}

async function editRecord(id) {
  const resource = getResource();
  try {
    const response = await apiFetch(`${resource.endpoint}/${encodeURIComponent(id)}`);
    openForm(unwrapRecord(response));
  } catch (error) {
    notify(error.message || `No se pudo abrir la ficha de ${resource.singular}.`, 'error');
  }
}

async function deleteRecord(id) {
  const resource = getResource();
  const record = (collections.get(activeResource) ?? []).find(
    (item) => String(item[resource.idField]) === String(id)
  );
  const name = record ? getRecordTitle(resource, record) : resource.singular;
  const consequence = activeResource === 'staff'
    ? `La cuenta de ${name} quedará suspendida.`
    : `Se intentará eliminar la ficha de ${name}.`;

  if (!window.confirm(`${consequence} ¿Quieres continuar?`)) {
    return;
  }

  try {
    await apiFetch(`${resource.endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    notify(
      activeResource === 'staff' ? 'Cuenta suspendida.' : 'Ficha retirada de la colección.',
      'success'
    );
    await loadWorkspace();
  } catch (error) {
    notify(error.message || `No se pudo actualizar ${resource.singular}.`, 'error');
  }
}

function buildPayload() {
  const resource = getResource();
  const payload = {};
  const fields = new Map(resource.fields.map((field) => [field.name, field]));

  for (const [name, rawValue] of new FormData(form)) {
    const field = fields.get(name);
    const value = String(rawValue).trim();
    if (!field || value === '' || (field.type === 'password' && editingId)) {
      continue;
    }
    payload[name] = field.type === 'number' || field.relation
      ? Number(value)
      : value;
  }
  return payload;
}

tabs.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-resource-tab]');
  if (!button || button.hidden || button.dataset.resourceTab === activeResource) {
    return;
  }

  activeResource = button.dataset.resourceTab;
  for (const tab of tabs.querySelectorAll('[data-resource-tab]')) {
    tab.setAttribute('aria-selected', String(tab === button));
  }
  search.value = '';
  list.setAttribute('aria-busy', 'true');
  if (collections.has(activeResource)) {
    renderRecords();
    status.textContent = `Estás explorando ${getResource().label.toLocaleLowerCase('es')}.`;
    list.setAttribute('aria-busy', 'false');
  } else {
    await loadResource(activeResource, { showLoading: true });
  }
});

search.addEventListener('input', renderRecords);
createButton.addEventListener('click', () => openForm());

list.addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-record-edit]');
  const remove = event.target.closest('[data-record-delete]');
  if (edit) await editRecord(edit.dataset.recordEdit);
  if (remove) await deleteRecord(remove.dataset.recordDelete);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  const resource = getResource();
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const payload = buildPayload();
  const path = editingId
    ? `${resource.endpoint}/${encodeURIComponent(editingId)}`
    : resource.endpoint;

  try {
    await apiFetch(path, {
      method: editingId ? 'PATCH' : 'POST',
      body: JSON.stringify(payload)
    });
    dialog.close();
    notify(`${resource.singular[0].toLocaleUpperCase('es')}${resource.singular.slice(1)} ${editingId ? 'actualizado' : 'añadido'} correctamente.`, 'success');
    await loadWorkspace();
  } catch (error) {
    notify(error.message || 'No se pudo guardar la ficha.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-resource]')) {
    dialog.close();
  }
});

dialog.addEventListener('close', () => {
  editingId = null;
  form.reset();
});

loadWorkspace();
