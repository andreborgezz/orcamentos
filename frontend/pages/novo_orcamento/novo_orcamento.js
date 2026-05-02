/**
 * CORE — Novo Orçamento Page Logic
 * Gerador de orçamentos com itens dinâmicos
 */

const API_BASE = 'http://localhost:3000/api';

let ID_USUARIO = null;
let itemCounter = 0;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const usuario = requireAuth();
  if (!usuario) return;

  ID_USUARIO = usuario.id_usuario;
  renderSidebar('novo_orcamento');
  loadClientes();
  updateEmptyState();
});

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

// ── Add Item Row ──
function addItemRow() {
  itemCounter++;
  const tbody = document.getElementById('tbody-items');
  
  const tr = document.createElement('tr');
  tr.className = 'item-row';
  tr.id = `item-${itemCounter}`;
  tr.innerHTML = `
    <td>
      <input type="text" class="form-input item-nome" placeholder="Nome do produto" required>
    </td>
    <td>
      <input type="number" class="form-input item-qtd" value="1" min="1" step="1" oninput="recalculate()">
    </td>
    <td>
      <input type="number" class="form-input item-preco" placeholder="0,00" min="0" step="0.01" oninput="recalculate()">
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

  // Focus no input de nome do item recém-adicionado
  tr.querySelector('.item-nome').focus();
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

  rows.forEach(row => {
    const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
    const rowSubtotal = qtd * preco;

    const subtotalEl = row.querySelector('.item-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = formatCurrency(rowSubtotal);
    }

    subtotal += rowSubtotal;
  });

  const desconto = parseFloat(document.getElementById('input-desconto').value) || 0;
  const frete = parseFloat(document.getElementById('input-frete').value) || 0;
  const total = Math.max(0, subtotal - desconto + frete);

  document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
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
    const quantidade = parseInt(row.querySelector('.item-qtd').value) || 0;
    const preco_unitario = parseFloat(row.querySelector('.item-preco').value) || 0;

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

    itens.push({ nome_produto: nome, quantidade, preco_unitario });
  });

  if (hasError) {
    showToast('Preencha todos os campos obrigatórios dos itens.', 'error');
    return;
  }

  // Calcula os totais
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
    const res = await fetch(`${API_BASE}/orcamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao salvar');

    const result = await res.json();
    showToast(`Orçamento #${result.id} criado com sucesso!`, 'success');
    
    // Redirecionar para lista após 1.5s
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
  
  const hasItems = tbody.querySelectorAll('.item-row').length > 0;
  empty.style.display = hasItems ? 'none' : 'flex';
  table.style.display = hasItems ? 'table' : 'none';
}

// ── Helpers ──
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Exportar PDF ──
function exportarPDF() {
  // Valida: precisa ter pelo menos 1 item
  const rows = document.querySelectorAll('.item-row');
  if (rows.length === 0) {
    showToast('Adicione pelo menos um item para exportar o PDF.', 'warning');
    return;
  }

  // Dados do usuário e empresa
  const usuario = getUsuarioLogado();
  const nomeEmpresa = usuario?.empresa || 'CORE';
  const logoUrl = usuario?.logo || null;

  // Cliente selecionado
  const selectCliente = document.getElementById('select-cliente');
  const clienteNome = selectCliente.options[selectCliente.selectedIndex]?.text || 'Não informado';

  // Itens
  let itensHtml = '';
  let subtotalCalc = 0;
  rows.forEach((row, i) => {
    const nome = row.querySelector('.item-nome')?.value || '-';
    const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
    const rowTotal = qtd * preco;
    subtotalCalc += rowTotal;
    itensHtml += `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${nome}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${qtd}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(preco)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(rowTotal)}</td>
    </tr>`;
  });

  const desconto = parseFloat(document.getElementById('input-desconto').value) || 0;
  const frete = parseFloat(document.getElementById('input-frete').value) || 0;
  const total = Math.max(0, subtotalCalc - desconto + frete);

  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const numeroOrc = `ORC-${Date.now().toString().slice(-6)}`;

  // Logo HTML
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="height:52px;object-fit:contain;">`
    : `<div style="font-size:22px;font-weight:800;color:#2563eb;letter-spacing:-0.04em;">${nomeEmpresa}</div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento ${numeroOrc}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; background:#fff; padding:40px; font-size:14px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:2px solid #2563eb; }
    .header-info h1 { font-size:28px; font-weight:800; color:#111827; }
    .header-info p { color:#6b7280; margin-top:4px; }
    .numero { font-size:13px; color:#6b7280; margin-top:8px; }
    .section { margin-bottom:28px; }
    .section-title { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
    .client-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px 18px; display:inline-block; min-width:220px; }
    .client-name { font-size:16px; font-weight:600; color:#111827; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    thead { background:#f3f4f6; }
    th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; }
    th:last-child, th:nth-child(4) { text-align:right; }
    th:nth-child(3) { text-align:center; }
    .totals { margin-top:20px; display:flex; justify-content:flex-end; }
    .totals-box { width:260px; }
    .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; color:#6b7280; border-bottom:1px solid #f3f4f6; }
    .totals-row.total { font-size:18px; font-weight:700; color:#111827; border-bottom:none; margin-top:8px; padding-top:12px; border-top:2px solid #111827; }
    .footer { margin-top:48px; padding-top:20px; border-top:1px solid #e5e7eb; color:#9ca3af; font-size:12px; text-align:center; }
    @media print {
      body { padding:20px; }
      @page { margin:15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoHtml}
      <div class="header-info" style="margin-top:12px;">
        <p class="numero">Orçamento Nº ${numeroOrc}</p>
        <p class="numero">Data: ${dataHoje}</p>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">PROPOSTA COMERCIAL</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="client-box">
      <div class="client-name">${clienteNome}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itens do Orçamento</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th>Produto / Serviço</th>
          <th style="width:80px;text-align:center;">Qtd.</th>
          <th style="width:120px;text-align:right;">Preço Unit.</th>
          <th style="width:130px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itensHtml}</tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(subtotalCalc)}</span></div>
      ${desconto > 0 ? `<div class="totals-row"><span>Desconto</span><span style="color:#059669;">- ${formatCurrency(desconto)}</span></div>` : ''}
      ${frete > 0 ? `<div class="totals-row"><span>Frete</span><span>${formatCurrency(frete)}</span></div>` : ''}
      <div class="totals-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    </div>
  </div>

  <div class="footer">
    Documento gerado por ${nomeEmpresa} via CORE Budget System em ${dataHoje}
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
