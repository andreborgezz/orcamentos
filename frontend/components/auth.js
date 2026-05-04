/**
 * CORE — Auth Module
 * Gerencia sessão do usuário via localStorage
 */

const AUTH_KEY = 'core_user';
const _AUTH_API = 'http://localhost:3000/api';

/**
 * Retorna o usuário logado ou null
 */
function getUsuarioLogado() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Salva o usuário na sessão com validade de 24 horas
 */
function salvarSessao(usuario) {
    usuario.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24h
    localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
}

/**
 * Limpa a sessão e redireciona para login
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/login.html';
}

/**
 * Garante que o usuário está logado e com sessão válida.
 * Se não estiver, redireciona para o login.
 * Retorna o objeto do usuário.
 */
function requireAuth() {
    const usuario = getUsuarioLogado();
    if (!usuario || !usuario.id_usuario) {
        window.location.href = '/login.html';
        return null;
    }

    // Verifica se a sessão expirou
    if (usuario.expiresAt && Date.now() > usuario.expiresAt) {
        logout();
        return null;
    }

    return usuario;
}

/**
 * Faz login via API e salva a sessão
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function fazerLogin(email, senha) {
    try {
        const res = await fetch(`${_AUTH_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.error || 'Erro ao fazer login.' };
        }

        salvarSessao(data);
        return { success: true, usuario: data };
    } catch (err) {
        return { success: false, error: 'Não foi possível conectar ao servidor.' };
    }
}

/**
 * Faz cadastro via API e salva a sessão
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function fazerCadastro(dados) {
    try {
        const res = await fetch(`${_AUTH_API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.error || 'Erro ao criar conta.' };
        }

        salvarSessao(data);
        return { success: true, usuario: data };
    } catch (err) {
        return { success: false, error: 'Não foi possível conectar ao servidor.' };
    }
}
