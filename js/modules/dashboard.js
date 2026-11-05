import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import {
  createElement,
  formatDate,
  formatMoney,
  notify,
  unwrapList,
  unwrapRecord
} from '../utils/dom.js';

const metrics = document.querySelector('[data-dashboard-metrics]');
const status = document.querySelector('[data-dashboard-status]');
const chart = document.querySelector('[data-sales-chart]');
const chartStatus = document.querySelector('[data-sales-chart-status]');
const salesList = document.querySelector('[data-recent-sales]');
const dialog = document.querySelector('[data-sale-dialog]');
const dialogContent = document.querySelector('[data-sale-detail]');
const dialogTitle = document.querySelector('[data-sale-title]');

function getAmount(sale) {
  const amount = Number(sale.total);
  return Number.isFinite(amount) ? amount : 0;
}

function renderMetric(label, value, detail) {
  const card = createElement('article', 'metrica-card');
  card.append(
    createElement('p', 'metrica-label', label),
    createElement('p', 'metrica-valor', value),
    createElement('p', 'metrica-detalle', detail)
  );
  return card;
}

function renderChart(sales) {
  chart.replaceChildren();
  if (sales.length === 0) {
    chartStatus.textContent = 'Cuando llegue la primera venta, aparecerá aquí.';
    return;
  }

  const maxAmount = Math.max(...sales.map(getAmount), 1);
  const fragment = document.createDocumentFragment();
  for (const [index, sale] of sales.entries()) {
    const column = createElement('div', 'grafico-columna');
    const amount = getAmount(sale);
    const bar = createElement('div', 'grafico-barra');
    bar.style.height = `${Math.max((amount / maxAmount) * 100, 4)}%`;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `Venta por ${formatMoney(amount)}`);
    column.append(
      createElement('span', 'grafico-valor', formatMoney(amount)),
      bar,
      createElement('span', 'grafico-etiqueta', `#${sale.id_venta ?? index + 1}`)
    );
    fragment.append(column);
  }

  chart.append(fragment);
  chartStatus.textContent = 'Las seis ventas más recientes. Selecciona una ficha para abrir su recibo.';
}

function renderSales(sales) {
  if (sales.length === 0) {
    salesList.replaceChildren();
    const empty = createElement('p', 'empty-state', 'Aún no se han registrado ventas.');
    salesList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const sale of sales) {
    const card = createElement('article', 'record-card');
    const top = createElement('div', 'record-card__top');
    top.append(
      createElement('h3', '', `Venta #${sale.id_venta}`),
      createElement('span', 'book-card__price', formatMoney(sale.total))
    );
    const details = createElement('p', '', `${formatDate(sale.fecha_venta)} · Cliente #${sale.id_cliente}`);
    const button = createElement('button', 'boton boton--secundario boton--pequeno', 'Abrir recibo ↗');
    button.type = 'button';
    button.dataset.saleDetail = String(sale.id_venta);
    card.append(top, details, button);
    fragment.append(card);
  }
  salesList.replaceChildren(fragment);
}

function renderSaleDetail(sale) {
  dialogTitle.textContent = `Recibo · venta #${sale.id_venta}`;
  const fragment = document.createDocumentFragment();
  const info = createElement('dl', 'datos-resumen');
  for (const [label, value] of [
    ['Fecha', formatDate(sale.fecha_venta)],
    ['Cliente', `#${sale.id_cliente}`],
    ['Cajero', `#${sale.id_empleado_cajero}`]
  ]) {
    info.append(createElement('dt', '', label), createElement('dd', '', value));
  }

  const details = createElement('div', 'resource-grid');
  for (const item of sale.detalles ?? []) {
    const line = createElement('article', 'record-card');
    line.append(
      createElement('h3', '', item.titulo ?? `Libro #${item.id_libro}`),
      createElement('p', '', `${item.cantidad} × ${formatMoney(item.precio_unitario_historico)}`),
      createElement('strong', '', formatMoney(item.subtotal))
    );
    details.append(line);
  }

  fragment.append(info, details, createElement('p', 'recibo-total', `Total · ${formatMoney(sale.total)}`));
  dialogContent.replaceChildren(fragment);
  dialog.showModal();
}

async function openSale(id) {
  try {
    const response = await apiFetch(API_ENDPOINTS.sale(id));
    renderSaleDetail(unwrapRecord(response));
  } catch (error) {
    notify(error.message || 'No se pudo abrir el recibo.', 'error');
  }
}

async function loadDashboard() {
  const [bookResult, loanResult, salesResult] = await Promise.allSettled([
    apiFetch(API_ENDPOINTS.books).then((response) => unwrapList(response, ['libros', 'books'])),
    apiFetch(`${API_ENDPOINTS.loans}?page=1&limit=100`),
    apiFetch(`${API_ENDPOINTS.sales}?page=1&limit=6`)
  ]);
  const fragment = document.createDocumentFragment();
  const issues = [];

  if (bookResult.status === 'fulfilled') {
    const inventory = bookResult.value.reduce((sum, book) => sum + Number(book.stock || 0), 0);
    fragment.append(renderMetric('Títulos en colección', bookResult.value.length, `${inventory} ejemplares bajo nuestro cuidado`));
  } else {
    issues.push('colección');
    fragment.append(renderMetric('Títulos en colección', '—', bookResult.reason.message));
  }

  if (loanResult.status === 'fulfilled') {
    const loans = unwrapList(loanResult.value, ['prestamos', 'loans']);
    const activeCount = loans.filter((loan) => ['ACTIVO', 'VENCIDO', 'SOLICITADO'].includes(loan.estado_prestamo)).length;
    const total = loanResult.value.pagination?.total ?? loans.length;
    fragment.append(renderMetric('Préstamos en movimiento', activeCount, `de ${total} registros · muestra de hasta 100`));
  } else {
    issues.push('préstamos');
    fragment.append(renderMetric('Préstamos en movimiento', '—', loanResult.reason.message));
  }

  if (salesResult.status === 'fulfilled') {
    const sales = unwrapList(salesResult.value, ['ventas']);
    const total = salesResult.value.pagination?.total ?? sales.length;
    const sampleTotal = sales.reduce((sum, sale) => sum + getAmount(sale), 0);
    fragment.append(renderMetric('Ventas registradas', total, `${formatMoney(sampleTotal)} en las seis más recientes`));
    renderChart(sales);
    renderSales(sales);
  } else {
    issues.push('ventas');
    fragment.append(renderMetric('Ventas registradas', '—', salesResult.reason.message));
    chart.replaceChildren();
    chartStatus.textContent = 'No pudimos consultar el movimiento de caja.';
    salesList.replaceChildren();
  }

  metrics.replaceChildren(fragment);
  metrics.setAttribute('aria-busy', 'false');
  status.textContent = issues.length
    ? `Algunas vistas necesitan atención: ${issues.join(', ')}.`
    : 'Todo en su lugar. Elige una venta para consultar su recibo.';
}

salesList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sale-detail]');
  if (button) openSale(button.dataset.saleDetail);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-sale]')) {
    dialog.close();
  }
});

loadDashboard().catch((error) => {
  status.textContent = error.message || 'No se pudo cargar el panorama.';
  metrics.setAttribute('aria-busy', 'false');
});
