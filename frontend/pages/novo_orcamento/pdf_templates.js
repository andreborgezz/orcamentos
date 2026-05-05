/**
 * CORE — PDF Template Engine (v2)
 * Paleta: Branco · #333 · Azul #1e40af
 */

function exportarComTemplate() {
  fecharModalTemplate();

  const rows = document.querySelectorAll('.item-row');
  const usuario = getUsuarioLogado();
  const nomeEmpresa = usuario?.empresa || 'CORE';
  // Usa logo customizada (upload local ou URL do Supabase), com fallback para o perfil
  const logoUrl = pdfCustomLogo || usuario?.logo || null;
  const cnpj = usuario?.cnpj || '';
  const telefone = usuario?.telefone || '';
  const emailEmp = usuario?.email || '';

  const selectCliente = document.getElementById('select-cliente');
  const clienteNome = selectCliente.options[selectCliente.selectedIndex]?.text || 'Não informado';
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const numeroOrc = `ORC-${Date.now().toString().slice(-6)}`;

  // Forma de pagamento obrigatória
  const inputPag = document.getElementById('input-pagamento');
  const formaPagamento = inputPag?.value?.trim() || '';
  if (!formaPagamento || formaPagamento === 'A combinar') {
    showToast('Preencha a Forma de Pagamento antes de exportar.', 'warning');
    return;
  }
  const validadeProposta = document.getElementById('input-validade')?.value || '15 dias';
  // Dados de contato/local vêm do perfil do usuário logado (não do formulário)

  const subtotalStr = document.getElementById('summary-subtotal').textContent;
  const totalStr = document.getElementById('summary-total').textContent;
  const freteValue = parseFloat(document.getElementById('input-frete').value) || 0;
  const descontoManual = parseFloat(document.getElementById('input-desconto').value) || 0;
  let descontoProg = 0;
  if (descontoProgressivoAtivo && document.getElementById('summary-prog-row').style.display !== 'none') {
    descontoProg = Math.abs(parseFloat(document.getElementById('summary-prog-value').textContent.replace(/[^\d,.-]/g,'').replace(',','.')) || 0);
  }
  const descontoTotal = descontoManual + descontoProg;
  let impostosTotal = 0;
  if (currentBudgetType !== 'itens' && document.getElementById('summary-impostos-row').style.display !== 'none') {
    impostosTotal = parseFloat(document.getElementById('summary-impostos').textContent.replace(/[^\d,.-]/g,'').replace(',','.')) || 0;
  }

  // Usa a cor customizada com fallback para azul padrão CORE
  const AZUL = pdfCustomColor || '#1e40af';
  const CINZA = '#333333';

  // ── Logo ──
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="height:44px;object-fit:contain;">`
    : `<span style="font-size:20px;font-weight:800;color:${AZUL};letter-spacing:-0.03em;">${nomeEmpresa}</span>`;

  // ── Ícones de contato do USUÁRIO (quem emite o orçamento) ──
  const SVG_PHONE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${AZUL}" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const SVG_MAIL = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${AZUL}" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const SVG_PIN  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${AZUL}" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  function contactLine(icon, text) {
    return `<div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:11.5px;color:#555;margin-bottom:3px;">${icon}<span>${text}</span></div>`;
  }
  let contactRightHtml = '';
  if (telefone)  contactRightHtml += contactLine(SVG_PHONE, telefone);
  if (emailEmp)  contactRightHtml += contactLine(SVG_MAIL, emailEmp);
  if (cnpj)      contactRightHtml += contactLine(SVG_PIN, cnpj);
  // Local/cidade do perfil do usuário
  const localUsuario = usuario?.local || usuario?.cidade || usuario?.endereco || '';
  if (localUsuario) contactRightHtml += contactLine(SVG_PIN, localUsuario);

  // ── Totals helper ──
  function buildTotalsRows() {
    let r = `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#666;border-bottom:1px solid #f0f0f0;"><span>Subtotal</span><span>${subtotalStr}</span></div>`;
    if (descontoTotal > 0) r += `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#059669;"><span>Desconto</span><span>- ${formatCurrency(descontoTotal)}</span></div>`;
    if (impostosTotal > 0) r += `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#666;"><span>ISS (5%)</span><span>${formatCurrency(impostosTotal)}</span></div>`;
    if (freteValue > 0)    r += `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#666;"><span>Frete</span><span>${formatCurrency(freteValue)}</span></div>`;
    return r;
  }

  // ── Footer helper ──
  function buildFooter(mt = 40) {
    return `<div style="margin-top:${mt}px;display:flex;gap:40px;padding-top:20px;border-top:1px solid #e5e7eb;">
      <div><div style="font-size:11px;font-weight:700;color:${AZUL};text-transform:uppercase;margin-bottom:5px;">Forma de Pagamento</div><div style="font-size:12px;color:#555;line-height:1.6;">${formaPagamento}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:${AZUL};text-transform:uppercase;margin-bottom:5px;">Termos e Condições</div><div style="font-size:12px;color:#555;line-height:1.6;">Este orçamento é válido por ${validadeProposta} a partir da data de emissão.</div></div>
    </div>`;
  }

  const CSS = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',-apple-system,sans-serif;color:${CINZA};font-size:13px;line-height:1.5;}@media print{.page{padding:24px!important;}}`;

  let html = '';

  // ════════════════════════════════════════════
  // TEMPLATE 01 — MINIMALISTA
  // Sem bordas verticais · só linhas horizontais finas
  // Total único em negrito e maior
  // ════════════════════════════════════════════
  if (selectedTemplate === '01') {
    let itensHtml = '';
    rows.forEach((row) => {
      const nome = row.querySelector('.item-nome')?.value || '-';
      const desc = row.querySelector('.item-desc-det')?.value?.trim() || '';
      const qtd  = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
      const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
      const sub  = formatCurrency(qtd * preco);
      const descHtml = desc ? `<div style="font-size:11px;color:#777;margin-top:3px;line-height:1.5;">${desc.replace(/\n/g,'<br>')}</div>` : '';
      itensHtml += `<tr>
        <td style="padding:11px 0;border-bottom:1px solid #eee;text-align:left;vertical-align:top;">${nome}${descHtml}</td>
        <td style="padding:11px 8px;border-bottom:1px solid #eee;text-align:center;vertical-align:top;color:#555;">${qtd}</td>
        <td style="padding:11px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;color:#555;">${formatCurrency(preco)}</td>
        <td style="padding:11px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;color:${CINZA};">${sub}</td>
      </tr>`;
    });

    html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Orçamento ${numeroOrc}</title>
    <style>${CSS}.page{max-width:760px;margin:0 auto;padding:44px;}</style></head><body><div class="page">
      <!-- Header bipartido -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid ${AZUL};margin-bottom:28px;">
        <div>
          ${logoHtml}
          <div style="margin-top:14px;font-size:21px;font-weight:700;color:${CINZA};">ORÇAMENTO #${numeroOrc.replace('ORC-','')}</div>
          <div style="font-size:12px;color:#777;margin-top:3px;">${dataHoje}</div>
        </div>
        <div style="text-align:right;">${contactRightHtml}</div>
      </div>
      <!-- Cliente -->
      <div style="margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:${AZUL};text-transform:uppercase;">A/C:</div>
        <div style="font-size:15px;font-weight:600;color:${CINZA};margin-top:2px;">${clienteNome}</div>
      </div>
      <!-- Tabela sem bordas verticais -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead><tr>
          <th style="text-align:left;padding:8px 0;font-size:10.5px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Item / Descrição</th>
          <th style="text-align:center;padding:8px 8px;font-size:10.5px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Qtd</th>
          <th style="text-align:right;padding:8px 0;font-size:10.5px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Unit.</th>
          <th style="text-align:right;padding:8px 0;font-size:10.5px;font-weight:700;color:#999;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Subtotal</th>
        </tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="width:260px;">${buildTotalsRows()}</div></div>
      <!-- Total destaque: único em negrito e maior -->
      <div style="display:flex;justify-content:flex-end;">
        <div style="width:260px;display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:2px solid ${CINZA};">
          <span style="font-size:15px;font-weight:700;color:${CINZA};">TOTAL</span>
          <span style="font-size:22px;font-weight:800;color:${CINZA};">${totalStr}</span>
        </div>
      </div>
      ${buildFooter(36)}
    </div><script>window.onload=()=>window.print();<\/script></body></html>`;

  // ════════════════════════════════════════════
  // TEMPLATE 02 — CORPORATIVO
  // Header bipartido: logo+nome esq · contatos dir
  // Mais espaço antes dos Termos
  // ════════════════════════════════════════════
  } else if (selectedTemplate === '02') {
    let itensHtml = '';
    rows.forEach((row) => {
      const nome = row.querySelector('.item-nome')?.value || '-';
      const desc = row.querySelector('.item-desc-det')?.value?.trim() || '';
      const qtd  = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
      const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
      const sub  = formatCurrency(qtd * preco);
      let descFormatted = '';
      if (desc) {
        const lines = desc.split('\n').filter(l => l.trim());
        descFormatted = lines.length > 1
          ? lines.map((l, i) => `${i+1}. ${l.trim()}`).join('<br>')
          : desc;
      }
      itensHtml += `<tr>
        <td style="padding:13px 12px 13px 0;border-bottom:1px solid #eee;font-weight:600;color:${CINZA};vertical-align:top;width:28%;">${nome}</td>
        <td style="padding:13px 12px;border-bottom:1px solid #eee;font-size:12px;color:#555;vertical-align:top;line-height:1.65;width:48%;">${descFormatted || '<span style="color:#ccc;">—</span>'}</td>
        <td style="padding:13px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${CINZA};vertical-align:top;width:24%;">${sub}</td>
      </tr>`;
    });

    html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Proposta ${numeroOrc}</title>
    <style>${CSS}.page{max-width:760px;margin:0 auto;padding:44px;position:relative;overflow:hidden;}
    .top-bar{height:5px;background:linear-gradient(90deg,${AZUL},#3b82f6);position:absolute;top:0;left:0;right:0;}
    </style></head><body><div class="page">
      <div class="top-bar"></div>
      <!-- Header bipartido -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:18px;margin-bottom:30px;">
        <div>
          ${logoHtml}
          <div style="margin-top:12px;font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Proposta Comercial</div>
          <div style="font-size:22px;font-weight:800;color:${CINZA};margin-top:2px;">PROPOSTA #${numeroOrc.replace('ORC-','')}</div>
          <div style="font-size:12px;color:#777;margin-top:3px;">Emitido em ${dataHoje}</div>
        </div>
        <!-- Contatos direita com ícones -->
        <div style="text-align:right;padding-top:4px;">${contactRightHtml}</div>
      </div>
      <!-- Cliente -->
      <div style="border-left:4px solid ${AZUL};padding:10px 16px;margin-bottom:28px;background:#f7f9ff;border-radius:0 6px 6px 0;">
        <div style="font-size:10px;font-weight:700;color:${AZUL};text-transform:uppercase;">Preparado para</div>
        <div style="font-size:17px;font-weight:700;color:${CINZA};margin-top:3px;">${clienteNome}</div>
      </div>
      <!-- Tabela: SERVIÇO | DESCRIÇÃO | VALOR -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead><tr>
          <th style="background:#f0f4ff;padding:11px 12px 11px 0;font-size:10.5px;font-weight:700;color:${AZUL};text-transform:uppercase;text-align:left;border-bottom:2px solid ${AZUL};">Serviço</th>
          <th style="background:#f0f4ff;padding:11px 12px;font-size:10.5px;font-weight:700;color:${AZUL};text-transform:uppercase;text-align:left;border-bottom:2px solid ${AZUL};">Descrição</th>
          <th style="background:#f0f4ff;padding:11px 0;font-size:10.5px;font-weight:700;color:${AZUL};text-transform:uppercase;text-align:right;border-bottom:2px solid ${AZUL};">Valor</th>
        </tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="width:260px;">${buildTotalsRows()}</div></div>
      <!-- Total banner -->
      <div style="background:${AZUL};color:white;padding:16px 24px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">TOTAL</span>
        <span style="font-size:24px;font-weight:800;">${totalStr}</span>
      </div>
      <!-- Footer com espaçamento maior -->
      ${buildFooter(52)}
    </div><script>window.onload=()=>window.print();<\/script></body></html>`;

  // ════════════════════════════════════════════
  // TEMPLATE 03 — VISUAL / PORTFÓLIO
  // Descrição obrigatória: auto-gera texto padrão
  // ════════════════════════════════════════════
  } else if (selectedTemplate === '03') {
    let itensHtml = '';
    rows.forEach((row, i) => {
      const nome = row.querySelector('.item-nome')?.value || '-';
      const descRaw = row.querySelector('.item-desc-det')?.value?.trim() || '';
      const qtd  = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
      const preco = parseFloat(row.querySelector('.item-preco')?.value) || 0;
      const sub  = formatCurrency(qtd * preco);
      // Auto-gera texto padrão se descrição estiver vazia
      const desc = descRaw || `Execução de ${nome}. Inclui planejamento, desenvolvimento e entrega conforme especificações acordadas.`;
      itensHtml += `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:40px;height:40px;background:${AZUL};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:white;">${i+1}</div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:${CINZA};">${nome}</div>
          <div style="font-size:12px;color:#555;margin-top:5px;line-height:1.65;">${desc.replace(/\n/g,'<br>')}</div>
          <div style="margin-top:8px;font-size:11px;color:#888;">Qtd: <strong style="color:${CINZA};">${qtd}</strong> &nbsp;·&nbsp; Unit: <strong style="color:${CINZA};">${formatCurrency(preco)}</strong></div>
        </div>
        <div style="text-align:right;flex-shrink:0;padding-top:2px;">
          <div style="font-size:17px;font-weight:800;color:${AZUL};">${sub}</div>
        </div>
      </div>`;
    });

    html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Projeto ${numeroOrc}</title>
    <style>${CSS}.page{max-width:760px;margin:0 auto;padding:40px;}</style></head><body><div class="page">
      <!-- Hero -->
      <div style="background:linear-gradient(135deg,#1e3a8a,${AZUL});border-radius:14px;padding:32px 36px;color:white;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-28px;right:-28px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.75;">Apresentação de Projeto</div>
          <div style="font-size:28px;font-weight:800;margin:6px 0;">${clienteNome}</div>
          <div style="font-size:12px;opacity:0.8;">${numeroOrc} &nbsp;·&nbsp; ${dataHoje}</div>
          ${localUsuario ? `<div style="font-size:12px;opacity:0.75;margin-top:3px;">📍 ${localUsuario}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="background:white;padding:10px 12px;border-radius:8px;display:inline-block;">${logoHtml}</div>
          ${(telefone || emailEmp) ? `<div style="margin-top:10px;font-size:11px;opacity:0.8;">${[telefone, emailEmp].filter(Boolean).join(' · ')}</div>` : ''}
        </div>
      </div>
      <!-- Escopo -->
      <div style="font-size:16px;font-weight:700;color:${CINZA};margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Escopo do Projeto</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">${itensHtml}</div>
      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="width:260px;">${buildTotalsRows()}</div></div>
      <!-- Total banner escuro -->
      <div style="background:#111827;color:white;border-radius:10px;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11px;color:#9ca3af;">Investimento Total</div>
          <div style="font-size:26px;font-weight:800;color:#60a5fa;margin-top:2px;">${totalStr}</div>
        </div>
        ${descontoTotal > 0 ? `<div style="text-align:right;"><div style="font-size:11px;color:#9ca3af;">Desconto aplicado</div><div style="font-size:16px;font-weight:700;color:#34d399;margin-top:2px;">- ${formatCurrency(descontoTotal)}</div></div>` : ''}
      </div>
      ${buildFooter(48)}
    </div><script>window.onload=()=>window.print();<\/script></body></html>`;
  }

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
