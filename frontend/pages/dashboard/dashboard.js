/**
 * CORE — Dashboard Page Logic
 * Carrega métricas e orçamentos recentes
 */

const API_BASE = 'http://localhost:3000/api';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const usuario = requireAuth();
  if (!usuario) return; // requireAuth já redirecionou para login

  const ID_USUARIO = usuario.id_usuario;

  renderSidebar('dashboard');
  setGreeting(usuario.nome);
  loadDashboardData(ID_USUARIO);
});

// ── Greeting based on time ──
function setGreeting(nomeUsuario) {
  const hour = new Date().getHours();
  let greeting = 'Bom dia';
  if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  if (hour >= 18) greeting = 'Boa noite';

  const nome = nomeUsuario ? nomeUsuario.split(' ')[0] : 'Usuário';
  const titleEl = document.querySelector('.page-title');
  if (titleEl) {
    titleEl.textContent = `${greeting}, ${nome} 👋`;
  }
}

// ── Load All Data ──
async function loadDashboardData(ID_USUARIO) {
  try {
    const [clientesRes, orcamentosRes] = await Promise.allSettled([
      fetch(`${API_BASE}/clientes/${ID_USUARIO}`),
      fetch(`${API_BASE}/orcamentos/${ID_USUARIO}`)
    ]);

    let clientes = [];
    let orcamentos = [];

    if (clientesRes.status === 'fulfilled' && clientesRes.value.ok) {
      clientes = await clientesRes.value.json();
    }

    if (orcamentosRes.status === 'fulfilled' && orcamentosRes.value.ok) {
      orcamentos = await orcamentosRes.value.json();
    }

    // Métricas
    document.getElementById('metric-orcamentos').textContent = orcamentos.length;
    document.getElementById('metric-clientes').textContent = clientes.length;

    const faturamento = orcamentos
      .filter(o => o.status === 'aprovado')
      .reduce((sum, o) => sum + (o.valor_total || 0), 0);
    document.getElementById('metric-faturamento').textContent = formatCurrency(faturamento);

    const aprovados = orcamentos.filter(o => o.status === 'aprovado').length;
    const taxa = orcamentos.length > 0 ? Math.round((aprovados / orcamentos.length) * 100) : 0;
    document.getElementById('metric-conversao').textContent = `${taxa}%`;

    // Últimos orçamentos
    renderRecentes(orcamentos.slice(0, 5));

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);

    // Preenche valores padrão se der erro
    document.getElementById('metric-orcamentos').textContent = '0';
    document.getElementById('metric-clientes').textContent = '0';
    document.getElementById('metric-faturamento').textContent = 'R$ 0,00';
    document.getElementById('metric-conversao').textContent = '0%';
    renderRecentes([]);
  }
}

// ── Render Recent Budgets ──
function renderRecentes(orcamentos) {
  const tbody = document.getElementById('tbody-recentes');
  const empty = document.getElementById('empty-recentes');

  if (orcamentos.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = orcamentos.map(o => `
    <tr>
      <td><span style="font-weight:600; font-variant-numeric:tabular-nums;">#${o.id_orcamento || o.id || '—'}</span></td>
      <td>${escapeHtml(o.cliente_nome || o.id_cliente || '—')}</td>
      <td><span class="badge status-${o.status || 'rascunho'}">${getStatusLabel(o.status)}</span></td>
      <td class="text-right" style="font-weight:600; font-variant-numeric:tabular-nums;">${formatCurrency(o.valor_total || 0)}</td>
    </tr>
  `).join('');
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

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
