/**
 * CORE — Novo Orçamento Page Logic
 * Gerador de orçamentos com itens dinâmicos, serviços e templates PDF
 */

const API_BASE = 'http://localhost:3000/api';

let ID_USUARIO = null;
let EDIT_MODE_ID = null;
let itemCounter = 0;
let currentBudgetType = 'itens'; // 'itens', 'servicos', 'hibrido'
let selectedTemplate = '01'; // '01', '02', '03'
let descontoProgressivoAtivo = false;

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  const usuario = requireAuth();
  if (!usuario) return;

  ID_USUARIO = usuario.id_usuario;
  renderSidebar('novo_orcamento');
  
  await loadClientes();

  // Verifica se estamos editando
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    EDIT_MODE_ID = id;
    loadOrcamentoDetails(id);
  }

  updateEmptyState();
  setBudgetType('itens'); // Inicializa no modo itens
});

// ── Load Detalhes do Orçamento para Edição ──
async function loadOrcamentoDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/orcamentos/detalhes/${id}`);
    if (!res.ok) throw new Error('Erro ao buscar detalhes do orçamento');
    
    const orc = await res.json();
    
    // Titulo da página
    const titleEl = document.querySelector('.page-title');
    if (titleEl) titleEl.textContent = `Editar Orçamento #${id}`;

    // Popula campos
    document.getElementById('select-cliente').value = orc.id_cliente;
    document.getElementById('input-desconto').value = orc.desconto || 0;
    document.getElementById('input-frete').value = orc.frete || 0;

    // Popula itens
    const tbody = document.getElementById('tbody-items');
    tbody.innerHTML = ''; // Limpa antes de popular
    
    orc.itens.forEach(item => {
      addItemRow(item.nome_produto, item.quantidade, item.preco_unitario, item.descricao || '');
    });

    recalculate();
    updateEmptyState();
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar dados do orçamento.', 'error');
  }
}

// ── Load Clientes para Select ──
async function loadClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes/${ID_USUARIO}`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    
    const clientes = await res.json();
    const select = document.getElementById('select-cliente');
    
    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_cliente || c.id;
      opt.textContent = c.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

// ── Toggle Budget Type ──
function setBudgetType(type) {
  currentBudgetType = type;
  
  // Atualiza botões
  document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`type-btn-${type}`).classList.add('active');

  const descEl = document.getElementById('type-description');
  const thQtd = document.getElementById('th-qtd');
  const thImposto = document.getElementById('th-imposto');
  const summaryImpostos = document.getElementById('summary-impostos-row');

  // Ajusta UI com base no tipo
  if (type === 'itens') {
    descEl.textContent = "Orçamento de Itens: Focado em quantidade e preço unitário. Ideal para quem vende mercadorias.";
    thQtd.textContent = "Qtd.";
    thImposto.style.display = "none";
    summaryImpostos.style.display = "none";
  } else if (type === 'servicos') {
    descEl.textContent = "Orçamento de Serviços: Focado em Horas/Dias trabalhados, inclui campo técnico e impostos (ISS).";
    thQtd.textContent = "Horas/Dias";
    thImposto.style.display = "table-cell";
    summaryImpostos.style.display = "flex";
  } else if (type === 'hibrido') {
    descEl.textContent = "Modelo Híbrido: Permite misturar mercadorias e mão de obra. (ex: peças + horas técnicas).";
    thQtd.textContent = "Qtd/Hrs";
    thImposto.style.display = "table-cell";
    summaryImpostos.style.display = "flex";
  }

  // Atualiza rows existentes
  const rows = document.querySelectorAll('.item-row');
  rows.forEach(row => {
    const impostoTd = row.querySelector('.td-imposto');
    if (impostoTd) {
      impostoTd.style.display = (type === 'itens') ? 'none' : 'table-cell';
    }
  });

  recalculate();
}

// ── Desconto Progressivo ──
function toggleDescontoProgressivo() {
  descontoProgressivoAtivo = document.getElementById('toggle-desconto-progressivo').checked;
  const body = document.getElementById('body-desconto-progressivo');
  const summaryRow = document.getElementById('summary-prog-row');
  
  if (descontoProgressivoAtivo) {
    body.style.display = 'block';
  } else {
    body.style.display = 'none';
    summaryRow.style.display = 'none';
  }
  recalculate();
}

// ── Add Item Row ──
function addItemRow(nome = '', qtd = 1, preco = '', descricao = '') {
  itemCounter++;
  const tbody = document.getElementById('tbody-items');
  
  const tr = document.createElement('tr');
  tr.className = 'item-row';
  tr.id = `item-${itemCounter}`;
  
  const showImposto = currentBudgetType !== 'itens' ? 'table-cell' : 'none';
  const escapedDesc = descricao.replace(/"/g, '&quot;');

  tr.innerHTML = `
    <td>
      <input type="text" class="form-input item-nome" placeholder="Nome do item/serviço" required value="${nome}">
    </td>
    <td>
      <textarea class="form-textarea item-desc-det" placeholder="Detalhe etapas, entregas ou especificações..." rows="2" style="min-height:56px;font-size:12px;" oninput="updatePreview()">${descricao}</textarea>
    </td>
    <td>
      <input type="number" class="form-input item-qtd" value="${qtd}" min="0.5" step="0.5" oninput="recalculate()">
    </td>
    <td>
      <input type="number" class="form-input item-preco" placeholder="0,00" min="0" step="0.01" oninput="recalculate()" value="${preco}">
    </td>
    <td class="td-imposto text-center" style="display:${showImposto};">
      <select class="form-select item-imposto" onchange="recalculate()">
        <option value="0">Isento</option>
        <option value="0.05" ${currentBudgetType === 'servicos' ? 'selected' : ''}>ISS (5%)</option>
      </select>
    </td>
    <td class="text-right">
      <span class="item-subtotal">R$ 0,00</span>
    </td>
    <td>
      <button class="btn-remove-item" onclick="removeItem('item-${itemCounter}')" title="Remover item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </td>
  `;

  tbody.appendChild(tr);
  updateEmptyState();

  // Focus no input
  tr.querySelector('.item-nome').focus();
  recalculate();
}

// ── Remove Item ──
function removeItem(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  row.classList.add('removing');
  row.addEventListener('animationend', () => {
    row.remove();
    recalculate();
    updateEmptyState();
  });
}

// ── Recalculate ──
function recalculate() {
  const rows = document.querySelectorAll('.item-row');
  let subtotal = 0;
  let totalImpostos = 0;
  let itemCount = 0;

  rows.forEach(row => {
    const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
    
    // Soma itens para o desconto progressivo
    if (qtd > 0 && preco > 0) itemCount += 1;

    let rowSubtotal = qtd * preco;
    
    // Impostos
    if (currentBudgetType !== 'itens') {
      const impostoRate = parseFloat(row.querySelector('.item-imposto')?.value) || 0;
      const impostoRow = rowSubtotal * impostoRate;
      totalImpostos += impostoRow;
      rowSubtotal += impostoRow;
      
      // Update badge de imposto no subtotal da linha se houver
      const subtotalEl = row.querySelector('.item-subtotal');
      if (subtotalEl) {
        if (impostoRate > 0) {
          subtotalEl.innerHTML = `${formatCurrency(rowSubtotal)} <br><span class="imposto-badge" style="font-size:10px;font-weight:normal;">inc. ${formatCurrency(impostoRow)} impostos</span>`;
        } else {
          subtotalEl.textContent = formatCurrency(rowSubtotal);
        }
      }
    } else {
      const subtotalEl = row.querySelector('.item-subtotal');
      if (subtotalEl) subtotalEl.textContent = formatCurrency(rowSubtotal);
    }

    subtotal += rowSubtotal;
  });

  // Atualiza totais base
  document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal - totalImpostos);
  
  if (currentBudgetType !== 'itens') {
    document.getElementById('summary-impostos').textContent = formatCurrency(totalImpostos);
  }

  // Desconto Progressivo
  let valorDescontoProgressivo = 0;
  if (descontoProgressivoAtivo) {
    const minItens = parseInt(document.getElementById('prog-min-itens').value) || 3;
    const descPct = parseFloat(document.getElementById('prog-desconto-pct').value) || 5;
    
    document.getElementById('prog-hint').textContent = `Desconto de ${descPct}% será aplicado automaticamente se houver ${minItens} ou mais itens (Atual: ${itemCount}).`;

    if (itemCount >= minItens) {
      valorDescontoProgressivo = subtotal * (descPct / 100);
      document.getElementById('summary-prog-row').style.display = 'flex';
      document.getElementById('summary-prog-value').textContent = `- ${formatCurrency(valorDescontoProgressivo)}`;
    } else {
      document.getElementById('summary-prog-row').style.display = 'none';
    }
  }

  // Totais Finais
  const descontoManual = parseFloat(document.getElementById('input-desconto').value) || 0;
  const frete = parseFloat(document.getElementById('input-frete').value) || 0;
  
  const descontoTotal = descontoManual + valorDescontoProgressivo;
  const total = Math.max(0, subtotal - descontoTotal + frete);

  document.getElementById('summary-total').textContent = formatCurrency(total);
}

// ── Save Orçamento ──
async function saveOrcamento() {
  const clienteId = document.getElementById('select-cliente').value;
  
  if (!clienteId) {
    showToast('Selecione um cliente antes de salvar.', 'warning');
    document.getElementById('select-cliente').focus();
    return;
  }

  const rows = document.querySelectorAll('.item-row');
  if (rows.length === 0) {
    showToast('Adicione pelo menos um item ao orçamento.', 'warning');
    return;
  }

  // Coleta os itens
  const itens = [];
  let hasError = false;

  rows.forEach(row => {
    const nome = row.querySelector('.item-nome').value.trim();
    const quantidade = parseFloat(row.querySelector('.item-qtd').value) || 0;
    const preco_unitario = parseFloat(row.querySelector('.item-preco').value) || 0;
    const descDetalhada = row.querySelector('.item-desc-det') ? row.querySelector('.item-desc-det').value.trim() : null;

    if (!nome) {
      hasError = true;
      row.querySelector('.item-nome').style.borderColor = 'var(--color-danger)';
      return;
    }

    if (preco_unitario <= 0) {
      hasError = true;
      row.querySelector('.item-preco').style.borderColor = 'var(--color-danger)';
      return;
    }

    itens.push({ 
      nome_produto: nome, 
      quantidade, 
      preco_unitario,
      descricao: descDetalhada
    });
  });

  if (hasError) {
    showToast('Preencha todos os campos obrigatórios dos itens.', 'error');
    return;
  }

  // Calcula para payload (simplificado, já que a API original não espera impostos)
  const subtotal = itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
  const desconto = parseFloat(document.getElementById('input-desconto').value) || 0;
  const frete = parseFloat(document.getElementById('input-frete').value) || 0;
  const valor_total = Math.max(0, subtotal - desconto + frete);

  const payload = {
    id_usuario: ID_USUARIO,
    id_cliente: clienteId,
    subtotal,
    desconto,
    frete,
    valor_total,
    itens
  };

  const btn = document.getElementById('btn-save');
  const originalHTML = btn.innerHTML;
  btn.classList.add('btn-loading');
  btn.innerHTML = 'Salvando...';

  try {
    const url = EDIT_MODE_ID ? `${API_BASE}/orcamentos/${EDIT_MODE_ID}` : `${API_BASE}/orcamentos`;
    const method = EDIT_MODE_ID ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao salvar');

    const result = await res.json();
    showToast(EDIT_MODE_ID ? 'Orçamento atualizado com sucesso!' : `Orçamento #${result.id} criado! Agora você pode exportar o PDF.`, 'success');
    // Sem redirecionamento — o usuário pode exportar o PDF logo após salvar

  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar o orçamento. Tente novamente.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = originalHTML;
  }
}

// ── Reset Form ──
function resetForm() {
  document.getElementById('select-cliente').value = '';
  document.getElementById('tbody-items').innerHTML = '';
  document.getElementById('input-desconto').value = '0';
  document.getElementById('input-frete').value = '0';
  document.getElementById('input-pagamento').value = '';
  document.getElementById('input-validade').value = '15 dias';
  
  
  if (document.getElementById('toggle-desconto-progressivo').checked) {
    document.getElementById('toggle-desconto-progressivo').click();
  }
  
  itemCounter = 0;
  recalculate();
  updateEmptyState();
  showToast('Formulário limpo.', 'success');
}

// ── Empty State Toggle ──
function updateEmptyState() {
  const tbody = document.getElementById('tbody-items');
  const empty = document.getElementById('empty-items');
  const table = document.getElementById('table-items');
  const cardProg = document.getElementById('card-desconto-progressivo') || document.getElementById('card-prog');
  
  const hasItems = tbody.querySelectorAll('.item-row').length > 0;
  empty.style.display = hasItems ? 'none' : 'flex';
  table.style.display = hasItems ? 'table' : 'none';
  if (cardProg) cardProg.style.display = hasItems ? 'block' : 'none';

  updatePreview();
}

// ── Preview em Tempo Real ──
function updatePreview() {
  const rows = document.querySelectorAll('.item-row');
  const cardPreview = document.getElementById('card-preview');
  const previewBody = document.getElementById('preview-body');
  if (!cardPreview || !previewBody) return;

  if (rows.length === 0) {
    cardPreview.style.display = 'none';
    return;
  }

  cardPreview.style.display = 'block';
  const AZUL = '#1e40af';

  previewBody.innerHTML = Array.from(rows).map((row, i) => {
    const nome = row.querySelector('.item-nome')?.value?.trim() || `Item ${i + 1}`;
    const desc = row.querySelector('.item-desc-det')?.value?.trim() ||
      `Execução de ${nome}. Inclui planejamento, desenvolvimento e entrega.`;
    const qtd  = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
    const sub  = (qtd * preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return `<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:${AZUL};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;flex-shrink:0;">${i+1}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#111;">${nome}</div>
        <div style="font-size:11px;color:#555;margin-top:3px;line-height:1.5;">${desc.replace(/\n/g,'<br>')}</div>
        <div style="margin-top:6px;font-size:11px;color:#888;">Qtd: <strong>${qtd}</strong> · Unit: <strong>${preco ? preco.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'}</strong></div>
      </div>
      <div style="font-size:14px;font-weight:800;color:${AZUL};flex-shrink:0;">${sub}</div>
    </div>`;
  }).join('');
}

// ── Helpers ──
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// LÓGICA DE EXPORTAÇÃO PDF (3 TEMPLATES)
// ==========================================

function abrirModalTemplate() {
  const rows = document.querySelectorAll('.item-row');
  if (rows.length === 0) {
    showToast('Adicione pelo menos um item para exportar o PDF.', 'warning');
    return;
  }
  document.getElementById('modal-template').classList.add('active');
}

function fecharModalTemplate(e) {
  if (e && e.target !== e.currentTarget && e.target.closest('.modal')) return;
  document.getElementById('modal-template').classList.remove('active');
}

function selectTemplate(id) {
  selectedTemplate = id;
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`tpl-${id}`).classList.add('selected');
}

// exportarComTemplate() foi movida para pdf_templates.js
// Essa separação facilita manutenção dos layouts de PDF
