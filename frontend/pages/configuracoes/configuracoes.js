const API_BASE = 'http://localhost:3000/api';
let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
  usuarioAtual = requireAuth();
  if (!usuarioAtual) return;

  renderSidebar('configuracoes');
  await carregarDados(usuarioAtual.id_usuario);
});

async function carregarDados(id_usuario) {
  try {
    const res = await fetch(`${API_BASE}/perfis/${id_usuario}`);
    if (!res.ok) throw new Error('Falha ao carregar perfil.');
    
    const dados = await res.json();
    
    // Pessoais
    document.getElementById('input-nome').value = dados.nome_completo || '';
    document.getElementById('input-email').value = dados.email_login || '';
    
    // Empresa
    document.getElementById('input-empresa').value = dados.nome_empresa || '';
    document.getElementById('input-cnpj').value = dados.cnpj || '';
    document.getElementById('input-telefone').value = dados.telefone || '';

  } catch (err) {
    console.error(err);
    if (typeof showToast === 'function') {
      showToast('Erro ao carregar dados do usuário.', 'error');
    }
  }
}

async function salvarConfiguracoes() {
  const btn = document.getElementById('btn-save-settings');
  const originalText = btn.innerHTML;
  
  btn.classList.add('btn-loading');
  btn.innerHTML = 'Salvando...';

  const payload = {
    nome_completo: document.getElementById('input-nome').value.trim(),
    email_login: document.getElementById('input-email').value.trim(),
    nome_empresa: document.getElementById('input-empresa').value.trim(),
    cnpj: document.getElementById('input-cnpj').value.trim(),
    telefone: document.getElementById('input-telefone').value.trim()
  };

  const senhaAtual = document.getElementById('input-senha-atual').value;
  const novaSenha = document.getElementById('input-nova-senha').value;

  if (novaSenha) {
    if (!senhaAtual) {
      if (typeof showToast === 'function') showToast('Preencha a senha atual para alterá-la.', 'warning');
      btn.classList.remove('btn-loading');
      btn.innerHTML = originalText;
      return;
    }
    payload.senha_atual = senhaAtual;
    payload.nova_senha = novaSenha;
  }

  try {
    const res = await fetch(`${API_BASE}/perfis/${usuarioAtual.id_usuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao salvar configurações.');
    }

    // Atualiza a sessão local
    const novoUsuario = {
      id_usuario: data.id_perfil,
      email: data.email_login,
      nome: data.nome_completo,
      empresa: data.nome_empresa,
      cargo: data.cargo,
      logo: data.logo_empresa,
      cnpj: data.cnpj,
      telefone: data.telefone
    };
    
    if (typeof salvarSessao === 'function') {
      salvarSessao(novoUsuario);
    }

    if (typeof showToast === 'function') {
      showToast('Configurações salvas com sucesso!', 'success');
    }

    // Limpa a senha
    document.getElementById('input-senha-atual').value = '';
    document.getElementById('input-nova-senha').value = '';
    
    // Re-renderiza o sidebar para atualizar o nome
    document.getElementById('sidebar').remove();
    renderSidebar('configuracoes');

  } catch (err) {
    console.error(err);
    if (typeof showToast === 'function') {
      showToast(err.message, 'error');
    } else {
      alert(err.message);
    }
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = originalText;
  }
}

// ── Helpers ──
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    // Ícone de olho cortado (esconder senha)
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = 'password';
    // Ícone de olho aberto (mostrar senha)
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}
