import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, unwrapList } from '../utils/dom.js';

const metrics = document.querySelector('[data-dashboard-metrics]');
const status = document.querySelector('[data-dashboard-status]');
const chart = document.querySelector('[data-sales-chart]');
const chartStatus = document.querySelector('[data-sales-chart-status]');

function getStock(book) {
  const stock = Number(book.stock);
  return Number.isFinite(stock) && stock > 0 ? stock : 0;
}

function getAmount(sale) {
  const amount = Number(sale.total ?? sale.monto_total ?? sale.total_venta ?? sale.monto);
  return Number.isFinite(amount) ? amount : 0;
}

function renderMetric(label, value, detail) {
  const card = createElement('article', 'tarjeta metrica-card');
  card.append(
    createElement('p', 'metrica-label', label),
    createElement('p', 'metrica-valor', value),
    createElement('p', 'metrica-detalle', detail)
  );
  return card;
}

function renderChart(sales) {
  const recentSales = sales.slice(-6);
  chart.replaceChildren();

  if (recentSales.length === 0) {
    chartStatus.textContent = 'No hay ventas registradas para mostrar.';
    return;
  }

  const maxAmount = Math.max(...recentSales.map(getAmount), 1);
  for (const [index, sale] of recentSales.entries()) {
    const column = createElement('div', 'grafico-columna');
    const amount = getAmount(sale);
    const bar = createElement('div', 'grafico-barra');
    bar.style.height = `${Math.max((amount / maxAmount) * 100, 4)}%`;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `Venta por Q ${amount.toFixed(2)}`);
    const caption = createElement('span', 'grafico-etiqueta', sale.fecha_venta ?? sale.fecha ?? `Venta ${index + 1}`);
    const value = createElement('span', 'grafico-valor', `Q ${amount.toFixed(2)}`);
    column.append(value, bar, caption);
    chart.append(column);
  }

  chartStatus.textContent = 'Montos de las últimas seis ventas.';
}

async function loadCollection(endpoint, keys) {
  return unwrapList(await apiFetch(endpoint), keys);
}

async function loadDashboard() {
  const [bookResult, loanResult, salesResult] = await Promise.allSettled([
    loadCollection(API_ENDPOINTS.books, ['libros', 'books']),
    loadCollection(API_ENDPOINTS.loans, ['prestamos', 'loans']),
    loadCollection(API_ENDPOINTS.sales, ['ventas', 'sales'])
  ]);
  const fragment = document.createDocumentFragment();
  const issues = [];

  if (bookResult.status === 'fulfilled') {
    const books = bookResult.value;
    const inventory = books.reduce((total, book) => total + getStock(book), 0);
    fragment.append(renderMetric('Títulos en catálogo', books.length, `${inventory} ejemplares en inventario`));
  } else {
    issues.push('libros');
    fragment.append(renderMetric('Títulos en catálogo', '—', 'API no disponible'));
  }

  if (loanResult.status === 'fulfilled') {
    const activeLoans = loanResult.value.filter((loan) => !['DEVUELTO', 'CERRADO'].includes(String(loan.estado_prestamo).toUpperCase()));
    fragment.append(renderMetric('Préstamos activos', activeLoans.length, `${loanResult.value.length} registros consultados`));
  } else {
    issues.push('préstamos');
    fragment.append(renderMetric('Préstamos activos', '—', 'API no disponible'));
  }

  if (salesResult.status === 'fulfilled') {
    const sales = salesResult.value;
    const total = sales.reduce((sum, sale) => sum + getAmount(sale), 0);
    fragment.append(renderMetric('Ventas registradas', sales.length, `Q ${total.toFixed(2)} acumulados`));
    renderChart(sales);
  } else {
    issues.push('ventas');
    fragment.append(renderMetric('Ventas registradas', '—', 'API no disponible'));
    chart.replaceChildren();
    chartStatus.textContent = salesResult.reason?.message || 'No se pudieron consultar las ventas.';
  }

  metrics.replaceChildren(fragment);
  metrics.setAttribute('aria-busy', 'false');
  status.textContent = issues.length
    ? `No fue posible consultar: ${issues.join(', ')}. Las rutas correspondientes deben estar habilitadas en el backend.`
    : 'Indicadores actualizados.';
}

loadDashboard().catch((error) => {
  status.textContent = error.message || 'No se pudieron cargar los indicadores.';
  metrics.setAttribute('aria-busy', 'false');
});
