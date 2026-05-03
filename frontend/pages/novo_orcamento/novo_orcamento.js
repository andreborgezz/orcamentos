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
      addItemRow(item.nome_produto, item.quantidade, item.preco_unitario);
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
function addItemRow(nome = '', qtd = 1, preco = '') {
  itemCounter++;
  const tbody = document.getElementById('tbody-items');
  
  const tr = document.createElement('tr');
  tr.className = 'item-row';
  tr.id = `item-${itemCounter}`;
  
  const showImposto = currentBudgetType !== 'itens' ? 'table-cell' : 'none';

  tr.innerHTML = `
    <td>
      <input type="text" class="form-input item-nome" placeholder="Produto ou Serviço" required value="${nome}">
      ${currentBudgetType !== 'itens' ? `
        <textarea class="form-textarea mt-2 item-desc-tec" placeholder="Descrição técnica do serviço..." rows="1"></textarea>
      ` : ''}
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
    const descTecnica = row.querySelector('.item-desc-tec') ? row.querySelector('.item-desc-tec').value.trim() : null;

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
      descricao: descTecnica
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
  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Salvando...
  `;

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
    showToast(EDIT_MODE_ID ? 'Orçamento atualizado!' : `Orçamento #${result.id} criado!`, 'success');
    
    setTimeout(() => {
      window.location.href = '/pages/orcamentos/orcamentos.html';
    }, 1500);

  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar o orçamento. Tente novamente.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

// ── Reset Form ──
function resetForm() {
  document.getElementById('select-cliente').value = '';
  document.getElementById('tbody-items').innerHTML = '';
  document.getElementById('input-desconto').value = '0';
  document.getElementById('input-frete').value = '0';
  
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
  const cardProg = document.getElementById('card-desconto-progressivo');
  
  const hasItems = tbody.querySelectorAll('.item-row').length > 0;
  empty.style.display = hasItems ? 'none' : 'flex';
  table.style.display = hasItems ? 'table' : 'none';
  cardProg.style.display = hasItems ? 'block' : 'none';
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

function exportarComTemplate() {
  fecharModalTemplate();
  
  const rows = document.querySelectorAll('.item-row');
  const usuario = getUsuarioLogado();
  const nomeEmpresa = usuario?.empresa || 'CORE';
  const logoUrl = usuario?.logo || null;
  const selectCliente = document.getElementById('select-cliente');
  const clienteNome = selectCliente.options[selectCliente.selectedIndex]?.text || 'Não informado';
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const numeroOrc = `ORC-${Date.now().toString().slice(-6)}`;

  // Coleta dados dos totais visíveis
  const subtotalStr = document.getElementById('summary-subtotal').textContent;
  const totalStr = document.getElementById('summary-total').textContent;
  const freteValue = parseFloat(document.getElementById('input-frete').value) || 0;
  
  // Calcula descontos somados (Manual + Progressivo)
  const descontoManual = parseFloat(document.getElementById('input-desconto').value) || 0;
  let descontoProg = 0;
  if (descontoProgressivoAtivo && document.getElementById('summary-prog-row').style.display !== 'none') {
    const txt = document.getElementById('summary-prog-value').textContent;
    descontoProg = parseFloat(txt.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    descontoProg = Math.abs(descontoProg);
  }
  const descontoTotal = descontoManual + descontoProg;

  // Impostos
  let impostosTotal = 0;
  if (currentBudgetType !== 'itens' && document.getElementById('summary-impostos-row').style.display !== 'none') {
    const txt = document.getElementById('summary-impostos').textContent;
    impostosTotal = parseFloat(txt.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  }

  // Gera HTML dos itens baseado no template
  let itensHtml = '';
  rows.forEach((row, i) => {
    const nome = row.querySelector('.item-nome')?.value || '-';
    const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
    const descTec = row.querySelector('.item-desc-tec') ? row.querySelector('.item-desc-tec').value : '';
    const rowSub = formatCurrency(qtd * preco); // Simplificado para visualização PDF

    if (selectedTemplate === '01') {
      itensHtml += `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${nome}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${qtd}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(preco)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${rowSub}</td>
      </tr>`;
    } else if (selectedTemplate === '02') {
      itensHtml += `<tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${i + 1}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;color:#111827;">${nome}</div>
          ${descTec ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;">${descTec}</div>` : ''}
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;vertical-align:top;">${qtd}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">${formatCurrency(preco)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;vertical-align:top;">${rowSub}</td>
      </tr>`;
    } else if (selectedTemplate === '03') {
      itensHtml += `
      <div style="display:flex;gap:20px;margin-bottom:24px;background:#f9fafb;padding:16px;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="width:120px;height:120px;background:#e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;flex-shrink:0;">
          [Imagem]
        </div>
        <div style="flex:1;">
          <h3 style="font-size:18px;margin-bottom:8px;color:#111827;">${nome}</h3>
          ${descTec ? `<p style="font-size:14px;color:#6b7280;margin-bottom:12px;">${descTec}</p>` : ''}
          <div style="display:flex;gap:16px;font-size:14px;">
            <div><span style="color:#6b7280;">Qtd:</span> <strong>${qtd}</strong></div>
            <div><span style="color:#6b7280;">Preço:</span> <strong>${formatCurrency(preco)}</strong></div>
            <div style="margin-left:auto;"><span style="color:#6b7280;">Subtotal:</span> <strong style="font-size:16px;color:#2563eb;">${rowSub}</strong></div>
          </div>
        </div>
      </div>`;
    }
  });

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="height:52px;object-fit:contain;">`
    : `<div style="font-size:22px;font-weight:800;color:#2563eb;letter-spacing:-0.04em;">${nomeEmpresa}</div>`;

  let html = '';

  if (selectedTemplate === '01') {
    // TEMPLATE 01: Minimalista (Igual ao que existia)
    html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento ${numeroOrc}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; padding:40px; font-size:14px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:2px solid #2563eb; }
        table { width:100%; border-collapse:collapse; margin-top:20px; }
        th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; border-bottom:2px solid #e5e7eb; }
        .totals { margin-top:30px; display:flex; justify-content:flex-end; }
        .totals-box { width:260px; }
        .totals-row { display:flex; justify-content:space-between; padding:6px 0; color:#6b7280; }
        .totals-row.total { font-size:18px; font-weight:700; color:#111827; margin-top:8px; padding-top:12px; border-top:2px solid #111827; }
        @media print { body { padding:20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>${logoHtml}<div style="margin-top:12px;color:#6b7280;">Nº ${numeroOrc} <br> ${dataHoje}</div></div>
        <div style="text-align:right;background:#f9fafb;padding:16px;border-radius:8px;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Para:</div>
          <div style="font-size:16px;font-weight:600;">${clienteNome}</div>
        </div>
      </div>
      <table>
        <thead><tr><th style="width:40px">#</th><th>Produto/Serviço</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Subtotal</span><span>${subtotalStr}</span></div>
        ${descontoTotal > 0 ? `<div class="totals-row"><span>Descontos</span><span style="color:#059669;">- ${formatCurrency(descontoTotal)}</span></div>` : ''}
        ${impostosTotal > 0 ? `<div class="totals-row"><span>Impostos (ISS)</span><span>${formatCurrency(impostosTotal)}</span></div>` : ''}
        ${freteValue > 0 ? `<div class="totals-row"><span>Frete</span><span>${formatCurrency(freteValue)}</span></div>` : ''}
        <div class="totals-row total"><span>Total</span><span>${totalStr}</span></div>
      </div></div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`;
  
  } else if (selectedTemplate === '02') {
    // TEMPLATE 02: Corporativo
    html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Proposta ${numeroOrc}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#374151; padding:40px; font-size:13px; line-height:1.6; }
        .top-bar { height:8px; background:#111827; position:absolute; top:0; left:0; right:0; }
        .header { margin-top:20px; display:flex; justify-content:space-between; margin-bottom:40px; }
        h1 { font-size:24px; color:#111827; margin-bottom:4px; }
        .client-box { border-left:3px solid #2563eb; padding-left:16px; margin-bottom:30px; }
        table { width:100%; border-collapse:collapse; margin-bottom:30px; }
        th { background:#f3f4f6; padding:12px; text-align:left; font-size:12px; color:#111827; }
        .totals-table { width:300px; margin-left:auto; border-collapse:collapse; }
        .totals-table td { padding:8px 12px; border-bottom:1px solid #e5e7eb; }
        .terms { margin-top:50px; font-size:11px; color:#6b7280; background:#f9fafb; padding:20px; border-radius:8px; }
      </style>
    </head>
    <body>
      <div class="top-bar"></div>
      <div class="header">
        <div><h1>Proposta Comercial</h1><div style="color:#6b7280;">Ref: ${numeroOrc} | Data: ${dataHoje}</div></div>
        <div>${logoHtml}</div>
      </div>
      <div class="client-box">
        <strong style="font-size:12px;text-transform:uppercase;color:#6b7280;">Preparado para</strong><br>
        <span style="font-size:18px;color:#111827;font-weight:600;">${clienteNome}</span>
      </div>
      <table>
        <thead><tr><th>#</th><th>Descrição do Item</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor Un.</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <table class="totals-table">
        <tr><td>Subtotal</td><td style="text-align:right">${subtotalStr}</td></tr>
        ${descontoTotal > 0 ? `<tr><td>Descontos</td><td style="text-align:right;color:#059669">- ${formatCurrency(descontoTotal)}</td></tr>` : ''}
        ${impostosTotal > 0 ? `<tr><td>Impostos Retidos</td><td style="text-align:right">${formatCurrency(impostosTotal)}</td></tr>` : ''}
        ${freteValue > 0 ? `<tr><td>Frete</td><td style="text-align:right">${formatCurrency(freteValue)}</td></tr>` : ''}
        <tr><td style="font-weight:bold;font-size:16px;color:#111827;">Total Geral</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#2563eb;">${totalStr}</td></tr>
      </table>
      <div class="terms">
        <strong>Termos e Condições</strong><br>
        1. Validade da proposta: 15 dias a partir da data de emissão.<br>
        2. Condições de pagamento: A combinar. Sujeito a aprovação de crédito.<br>
        3. Prazo de entrega/execução: Conforme cronograma acordado após assinatura.<br>
        4. Os valores de impostos retidos na fonte (se aplicável) estão discriminados acima.
      </div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`;
  
  } else if (selectedTemplate === '03') {
    // TEMPLATE 03: Visual / Portfolio
    html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Projeto ${numeroOrc}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; padding:40px; }
        .hero { background:linear-gradient(135deg, #2563eb, #1d4ed8); border-radius:16px; padding:40px; color:white; margin-bottom:40px; display:flex; justify-content:space-between; align-items:center; }
        .items-container { display:flex; flex-direction:column; gap:20px; margin-bottom:40px; }
        .totals-banner { background:#111827; color:white; border-radius:12px; padding:30px; display:flex; justify-content:space-between; align-items:center; }
        .totals-banner div { font-size:14px; color:#9ca3af; }
        .totals-banner strong { font-size:24px; color:white; display:block; margin-top:4px; }
      </style>
    </head>
    <body>
      <div class="hero">
        <div>
          <div style="font-size:14px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;">Apresentação de Projeto</div>
          <h1 style="font-size:36px;margin:8px 0;">${clienteNome}</h1>
          <div style="opacity:0.9;">Ref: ${numeroOrc} | ${dataHoje}</div>
        </div>
        <div style="background:white;padding:12px;border-radius:12px;">${logoHtml.replace('style="', 'style="max-width:150px;')}</div>
      </div>
      <h2 style="font-size:20px;color:#111827;margin-bottom:20px;border-bottom:2px solid #e5e7eb;padding-bottom:10px;">Escopo do Projeto</h2>
      <div class="items-container">${itensHtml}</div>
      <div class="totals-banner">
        <div style="display:flex;gap:40px;">
          <div>Subtotal<strong>${subtotalStr}</strong></div>
          ${descontoTotal > 0 ? `<div>Desconto<strong style="color:#34d399">- ${formatCurrency(descontoTotal)}</strong></div>` : ''}
          ${impostosTotal > 0 ? `<div>Impostos<strong>${formatCurrency(impostosTotal)}</strong></div>` : ''}
        </div>
        <div style="text-align:right;">Investimento Total<strong style="font-size:32px;color:#60a5fa;">${totalStr}</strong></div>
      </div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`;
  }

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
