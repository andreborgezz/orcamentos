/**
 * CORE — Orçamentos List Page Logic
 * Lista e filtros de orçamentos
 */

const API_BASE = 'http://localhost:3000/api';

let ID_USUARIO = null;
let orcamentos = [];
let orcamentosFiltrados = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const usuario = requireAuth();
  if (!usuario) return;

  ID_USUARIO = usuario.id_usuario;
  renderSidebar('orcamentos');
  loadOrcamentos();
});

// ── Fetch Orçamentos ──
async function loadOrcamentos() {
  showSkeletonLoading();

  try {
    const res = await fetch(`${API_BASE}/orcamentos/${ID_USUARIO}`);

    if (!res.ok) {
      // Se a rota ainda não existe, mostra estado vazio
      if (res.status === 404) {
        orcamentos = [];
        orcamentosFiltrados = [];
        renderOrcamentos();
        updateStats();
        return;
      }
      throw new Error('Erro ao buscar orçamentos');
    }

    orcamentos = await res.json();
    orcamentosFiltrados = [...orcamentos];
    renderOrcamentos();
    updateStats();
  } catch (err) {
    console.error('Erro:', err);
    // Se o backend não tiver a rota GET, mostrar estado vazio graciosamente
    orcamentos = [];
    orcamentosFiltrados = [];
    renderOrcamentos();
    updateStats();
  }
}

// ── Render Table ──
function renderOrcamentos() {
  const tbody = document.getElementById('tbody-orcamentos');
  const emptyState = document.getElementById('empty-state');

  if (orcamentosFiltrados.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = orcamentosFiltrados.map(o => `
    <tr>
      <td><span class="orc-id">#${o.id_orcamento || o.id || '—'}</span></td>
      <td><span class="orc-cliente">${escapeHtml(o.cliente_nome || o.id_cliente || '—')}</span></td>
      <td><span class="orc-data">${formatDate(o.created_at || o.data_criacao)}</span></td>
      <td><span class="badge status-${o.status || 'rascunho'}">${getStatusLabel(o.status)}</span></td>
      <td class="text-right"><span class="orc-valor">${formatCurrency(o.valor_total || 0)}</span></td>
      <td>
        <div class="orc-actions">
          <button class="btn btn-icon btn-sm btn-ghost" title="Visualizar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-icon btn-sm btn-ghost" title="Duplicar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Stats ──
function updateStats() {
  document.getElementById('stat-total').textContent = orcamentos.length;
  document.getElementById('stat-rascunhos').textContent = orcamentos.filter(o => o.status === 'rascunho').length;
  document.getElementById('stat-enviados').textContent = orcamentos.filter(o => o.status === 'enviado').length;

  const valorTotal = orcamentos.reduce((sum, o) => sum + (o.valor_total || 0), 0);
  document.getElementById('stat-valor').textContent = formatCurrency(valorTotal);
}

// ── Filter ──
function filterOrcamentos() {
  const search = document.getElementById('search-orcamentos').value.toLowerCase().trim();
  const statusFilter = document.getElementById('filter-status').value;

  orcamentosFiltrados = orcamentos.filter(o => {
    const matchSearch = !search ||
      String(o.id_orcamento || o.id || '').includes(search) ||
      (o.cliente_nome && o.cliente_nome.toLowerCase().includes(search));

    const matchStatus = !statusFilter || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  renderOrcamentos();
}

// ── Skeleton ──
function showSkeletonLoading() {
  const tbody = document.getElementById('tbody-orcamentos');
  let rows = '';
  for (let i = 0; i < 5; i++) {
    rows += `
      <tr class="skeleton-row">
        <td><div class="skeleton-block w-12"></div></td>
        <td><div class="skeleton-block w-32"></div></td>
        <td><div class="skeleton-block w-24"></div></td>
        <td><div class="skeleton-block w-20"></div></td>
        <td><div class="skeleton-block w-24"></div></td>
        <td><div class="skeleton-block w-20"></div></td>
      </tr>
    `;
  }
  tbody.innerHTML = rows;
}

// ── Helpers ──
function getStatusLabel(status) {
  const labels = {
    rascunho: 'Rascunho',
    enviado: 'Enviado',
    aprovado: 'Aprovado',
    recusado: 'Recusado'
  };
  return labels[status] || 'Rascunho';
}

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
