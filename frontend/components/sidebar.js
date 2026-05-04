/**
 * CORE — Sidebar Component
 */

function renderSidebar(activePageId) {
  const currentPage = activePageId || '';

  // Dados do usuário logado
  const usuario = (typeof getUsuarioLogado === 'function') ? getUsuarioLogado() : null;
  const nomeUsuario = usuario && usuario.nome ? usuario.nome : (usuario && usuario.email ? usuario.email : 'Usuário');
  const primeiroNome = nomeUsuario.split(' ')[0];
  const iniciais = nomeUsuario.split(' ').map(function(n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
  const cargo = usuario && usuario.cargo ? usuario.cargo : 'Usuário';
  const logoUrl = usuario && usuario.logo ? usuario.logo : null;

  // Nav items
  var navItems = [
    { id: 'dashboard',      label: 'Dashboard',       href: '/pages/dashboard/dashboard.html' },
    { id: 'orcamentos',     label: 'Orçamentos',      href: '/pages/orcamentos/orcamentos.html' },
    { id: 'novo_orcamento', label: 'Novo Orçamento',  href: '/pages/novo_orcamento/novo_orcamento.html' },
    { id: 'clientes',       label: 'Clientes',         href: '/pages/clientes/clientes.html' }
  ];

  var navHtml = '';
  navItems.forEach(function(item) {
    var isActive = item.id === currentPage ? ' active' : '';
    navHtml += '<a href="' + item.href + '" class="nav-link' + isActive + '" id="nav-' + item.id + '">' +
      '<span>' + item.label + '</span></a>';
  });

  // Avatar
  var avatarContent = logoUrl
    ? '<img src="' + logoUrl + '" alt="Logo" class="sidebar-logo-img">'
    : '<span>' + iniciais + '</span>';

  var sidebarHTML = '<aside class="sidebar" id="sidebar">' +
    '<div class="sidebar-header">' +
      '<div class="sidebar-logo">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M12 2 2 7l10 5 10-5-10-5Z"/>' +
          '<path d="m2 17 10 5 10-5"/>' +
          '<path d="m2 12 10 5 10-5"/>' +
        '</svg>' +
      '</div>' +
      '<div class="sidebar-brand">' +
        '<span class="sidebar-brand-name">CORE</span>' +
        '<span class="sidebar-brand-label">Budget System</span>' +
      '</div>' +
    '</div>' +
    '<nav class="sidebar-nav">' + navHtml + '</nav>' +
    '<div class="sidebar-footer">' +
      '<label class="sidebar-avatar-upload" for="sidebar-file-input" title="Clique para alterar a logo">' +
        '<div class="sidebar-avatar" id="sidebar-avatar">' + avatarContent + '</div>' +
        '<div class="sidebar-avatar-hover-overlay">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>' +
            '<circle cx="12" cy="13" r="3"/>' +
          '</svg>' +
        '</div>' +
        '<input type="file" id="sidebar-file-input" accept="image/*" style="display:none">' +
      '</label>' +
      '<div class="sidebar-user-info" style="flex:1;min-width:0;">' +
        '<span class="sidebar-user-name">' + primeiroNome + '</span>' +
        '<span class="sidebar-user-role">' + cargo + '</span>' +
      '</div>' +
      '<div style="display:flex; gap:4px;">' +
        '<a href="/pages/configuracoes/configuracoes.html" class="sidebar-logout-btn" title="Configurações" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>' +
            '<circle cx="12" cy="12" r="3"/>' +
          '</svg>' +
        '</a>' +
        '<button class="sidebar-logout-btn" onclick="logout()" title="Sair">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
            '<polyline points="16 17 21 12 16 7"/>' +
            '<line x1="21" x2="9" y1="12" y2="12"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</aside>';

  var appLayout = document.querySelector('.app-layout');
  if (appLayout) {
    appLayout.insertAdjacentHTML('afterbegin', sidebarHTML);
  } else {
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  }

  // Upload de logo
  var fileInput = document.getElementById('sidebar-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;

      var u = typeof getUsuarioLogado === 'function' ? getUsuarioLogado() : null;
      if (!u) return;

      var formData = new FormData();
      formData.append('logo', file);

      var avatarEl = document.getElementById('sidebar-avatar');
      var labelEl = document.querySelector('.sidebar-avatar-upload');
      if (labelEl) labelEl.classList.add('uploading');

      fetch('/api/perfis/' + u.id_usuario + '/logo', { method: 'POST', body: formData })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.url) {
            var updated = Object.assign({}, u, { logo: data.url });
            if (typeof salvarSessao === 'function') salvarSessao(updated);
            if (avatarEl) avatarEl.innerHTML = '<img src="' + data.url + '" alt="Logo" class="sidebar-logo-img">';
            if (typeof showToast === 'function') showToast('Logo atualizada!', 'success');
          }
        })
        .catch(function() {
          if (typeof showToast === 'function') showToast('Erro ao enviar a logo.', 'error');
        })
        .finally(function() {
          if (labelEl) labelEl.classList.remove('uploading');
          fileInput.value = '';
        });
    });
  }

  // Global Greeting Logic
  var hour = new Date().getHours();
  var greeting = 'Bom dia';
  if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  if (hour >= 18) greeting = 'Boa noite';

  var headerDiv = document.querySelector('.page-header-row > div:first-child');
  if (headerDiv) {
    if (currentPage === 'dashboard') {
      var titleEl = headerDiv.querySelector('.page-title');
      if (titleEl) {
        titleEl.textContent = greeting + ', ' + primeiroNome + '👋';
      }
    } else {
      var greetingEl = document.createElement('div');
      greetingEl.style.fontSize = 'var(--font-size-sm, 14px)';
      greetingEl.style.color = 'var(--color-text-secondary, #64748b)';
      greetingEl.style.marginBottom = '4px';
      greetingEl.style.fontWeight = '500';
      greetingEl.textContent = greeting + ', ' + primeiroNome + '👋';
      headerDiv.insertBefore(greetingEl, headerDiv.firstChild);
    }
  }
}

window.renderSidebar = renderSidebar;
