/**
 * CORE — Clientes Page Logic
 * Consumo da API e interatividade
 */

const API_BASE = 'http://localhost:3000/api';

let ID_USUARIO = null;
let clientes = [];
let clientesFiltrados = [];
let EDIT_MODE_ID = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const usuario = requireAuth();
  if (!usuario) return;

  ID_USUARIO = usuario.id_usuario;
  renderSidebar('clientes');
  loadClientes();
});

// ── Fetch Clientes ──
async function loadClientes() {
  showSkeletonLoading();

  try {
    const res = await fetch(`${API_BASE}/clientes/${ID_USUARIO}`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');

    clientes = await res.json();
    clientesFiltrados = [...clientes];
    renderClientes();
    updateStats();
  } catch (err) {
    console.error('Erro:', err);
    showToast('Erro ao carregar clientes. Verifique se o backend está rodando.', 'error');
    hideSkeletonLoading();
  }
}

// ── Render Table ──
function renderClientes() {
  const tbody = document.getElementById('tbody-clientes');
  const emptyState = document.getElementById('empty-state');

  if (clientesFiltrados.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = clientesFiltrados.map(c => `
    <tr>
      <td>
        <span class="client-name">${escapeHtml(c.nome)}</span>
      </td>
      <td>
        <span class="client-email">${c.email ? escapeHtml(c.email) : '—'}</span>
      </td>
      <td>
        <span class="client-phone">${c.telefone ? formatPhone(c.telefone) : '—'}</span>
      </td>
      <td>
        <span class="badge status-${c.status_negocio || 'lead'}">${getStatusLabel(c.status_negocio)}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-icon btn-sm btn-ghost" title="Editar" onclick="openModal(${c.id_cliente})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
          </button>
          <button class="btn btn-icon btn-sm btn-ghost" title="Excluir" style="color: var(--color-danger);" onclick="deletarCliente(${c.id_cliente})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Stats ──
function updateStats() {
  document.getElementById('stat-total').textContent = clientes.length;
  document.getElementById('stat-ativos').textContent = clientes.filter(c => c.status_negocio === 'negociacao').length;
  document.getElementById('stat-fechados').textContent = clientes.filter(c => c.status_negocio === 'fechado').length;
}

// ── Filter ──
function filterClientes() {
  const search = document.getElementById('search-clientes').value.toLowerCase().trim();
  const statusFilter = document.getElementById('filter-status').value;

  clientesFiltrados = clientes.filter(c => {
    const matchSearch = !search || 
      c.nome.toLowerCase().includes(search) ||
      (c.email && c.email.toLowerCase().includes(search)) ||
      (c.telefone && c.telefone.includes(search));

    const matchStatus = !statusFilter || c.status_negocio === statusFilter;

    return matchSearch && matchStatus;
  });

  renderClientes();
}

// ── Modal ──
function openModal(id = null) {
  EDIT_MODE_ID = id;
  const overlay = document.getElementById('modal-overlay');
  
  if (id) {
    const cliente = clientes.find(c => c.id_cliente === id);
    if (!cliente) return;
    document.querySelector('.modal-title').textContent = 'Editar Cliente';
    document.getElementById('input-nome').value = cliente.nome;
    document.getElementById('input-email').value = cliente.email || '';
    document.getElementById('input-telefone').value = cliente.telefone || '';
    document.getElementById('input-status').value = cliente.status_negocio;
  } else {
    document.querySelector('.modal-title').textContent = 'Novo Cliente';
    document.getElementById('form-cliente').reset();
  }
  
  overlay.classList.add('active');
  document.getElementById('input-nome').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('form-cliente').reset();
  EDIT_MODE_ID = null;
}

// Fechar modal clicando fora
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── Deletar ──
async function deletarCliente(id) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar');
    
    clientes = clientes.filter(c => c.id_cliente !== id);
    filterClientes();
    updateStats();
    showToast('Cliente excluído.', 'success');
  } catch (err) {
    showToast('Erro ao excluir cliente.', 'error');
  }
}

// ── Submit ──
async function handleSubmitCliente(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-submit-cliente');
  const originalHTML = btn.innerHTML;
  btn.classList.add('btn-loading');
  btn.textContent = 'Salvando...';

  const payload = {
    id_usuario: ID_USUARIO,
    nome: document.getElementById('input-nome').value.trim(),
    email: document.getElementById('input-email').value.trim() || null,
    telefone: document.getElementById('input-telefone').value.trim() || null,
    status_negocio: document.getElementById('input-status').value
  };

  try {
    const url = EDIT_MODE_ID ? `${API_BASE}/clientes/${EDIT_MODE_ID}` : `${API_BASE}/clientes`;
    const method = EDIT_MODE_ID ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao salvar');

    const result = await res.json();
    
    if (EDIT_MODE_ID) {
      const index = clientes.findIndex(c => c.id_cliente === EDIT_MODE_ID);
      if (index !== -1) clientes[index] = result;
      showToast('Cliente atualizado!', 'success');
    } else {
      clientes.unshift(result);
      showToast('Cliente adicionado!', 'success');
    }
    
    filterClientes();
    updateStats();
    closeModal();
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar cliente. Tente novamente.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = originalHTML;
  }
}

// ── Skeleton Loading ──
function showSkeletonLoading() {
  const tbody = document.getElementById('tbody-clientes');
  let rows = '';
  for (let i = 0; i < 5; i++) {
    rows += `
      <tr class="skeleton-row">
        <td><div class="skeleton-block w-40"></div></td>
        <td><div class="skeleton-block w-48"></div></td>
        <td><div class="skeleton-block w-32"></div></td>
        <td><div class="skeleton-block w-20"></div></td>
        <td><div class="skeleton-block w-24"></div></td>
      </tr>
    `;
  }
  tbody.innerHTML = rows;
}

function hideSkeletonLoading() {
  document.getElementById('tbody-clientes').innerHTML = '';
  document.getElementById('empty-state').style.display = 'flex';
}

// ── Helpers ──
function getStatusLabel(status) {
  const labels = {
    lead: 'Lead',
    negociacao: 'Negociação',
    fechado: 'Fechado',
    inativo: 'Inativo'
  };
  return labels[status] || 'Lead';
}

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }
  return phone;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
