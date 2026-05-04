/**
 * CORE — Toast Notification System
 * Sistema de notificações leve e elegante
 */

function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
    error: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    warning: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    ${icons[type] || icons.success}
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

window.showToast = showToast;

// ==========================================
// TRATAMENTO GLOBAL DE ERROS DE REDE (FETCH)
// ==========================================
const originalFetch = window.fetch;
window.fetch = async function(resource, config) {
  // Configura um timeout de 15 segundos para evitar que a tela congele para sempre
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  const modifiedConfig = {
    ...config,
    signal: config?.signal || controller.signal
  };

  try {
    const response = await originalFetch(resource, modifiedConfig);
    clearTimeout(timeoutId);
    
    // Tratamento de Sessão Expirada / Não Autorizado pelo Backend
    if (response.status === 401 && typeof resource === 'string' && !resource.includes('/login')) {
      if (typeof logout === 'function') {
        logout();
      } else {
        localStorage.removeItem('core_user');
        window.location.href = '/login.html';
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Tratamento de Timeout
    if (error.name === 'AbortError') {
      showToast('O servidor demorou muito para responder. Tente novamente.', 'error');
      throw new Error('Timeout: O servidor demorou muito para responder.');
    }
    
    // Tratamento de falha de conexão (Internet caiu ou servidor offline)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showToast('Sem conexão com a internet ou servidor offline.', 'error');
      throw new Error('Falha de conexão. Verifique sua internet ou tente mais tarde.');
    }
    
    // Outros erros
    throw error;
  }
};
