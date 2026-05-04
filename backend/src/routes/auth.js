const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Busca o perfil pelo email_login e compara a senha armazenada.
 */
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const { data: perfil, error } = await supabase
        .from('perfis')
        .select('id_perfil, email_login, nome_completo, nome_empresa, cargo, logo_empresa, cnpj, telefone')
        .eq('email_login', email.toLowerCase().trim())
        .eq('senha', senha)
        .single();

    if (error || !perfil) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // Retorna os dados do usuário (sem a senha)
    res.json({
        id_usuario: perfil.id_perfil,
        email: perfil.email_login,
        nome: perfil.nome_completo,
        empresa: perfil.nome_empresa,
        cargo: perfil.cargo,
        logo: perfil.logo_empresa,
        cnpj: perfil.cnpj,
        telefone: perfil.telefone
    });
});

/**
 * POST /api/auth/register
 * Body: { email_login, nome_completo, nome_empresa, senha }
 * Cria um novo perfil de usuário.
 */
router.post('/register', async (req, res) => {
    const { email_login, nome_completo, nome_empresa, senha } = req.body;

    if (!email_login || !nome_completo || !senha) {
        return res.status(400).json({ error: 'E-mail, nome e senha são obrigatórios.' });
    }

    const emailFormatado = email_login.toLowerCase().trim();

    // Verifica se já existe
    const { data: existente } = await supabase
        .from('perfis')
        .select('id_perfil')
        .eq('email_login', emailFormatado)
        .single();

    if (existente) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    // Insere o novo usuário
    const { data: novoPerfil, error } = await supabase
        .from('perfis')
        .insert([
            {
                email_login: emailFormatado,
                nome_completo: nome_completo,
                nome_empresa: nome_empresa || null,
                senha: senha, // Nota: em produção o ideal é hashear a senha (ex: bcrypt)
                cargo: 'Admin'
            }
        ])
        .select('id_perfil, email_login, nome_completo, nome_empresa, cargo, logo_empresa, cnpj, telefone')
        .single();

    if (error || !novoPerfil) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao criar a conta.' });
    }

    // Retorna os dados para login automático
    res.status(201).json({
        id_usuario: novoPerfil.id_perfil,
        email: novoPerfil.email_login,
        nome: novoPerfil.nome_completo,
        empresa: novoPerfil.nome_empresa,
        cargo: novoPerfil.cargo,
        logo: novoPerfil.logo_empresa,
        cnpj: novoPerfil.cnpj,
        telefone: novoPerfil.telefone
    });
});

module.exports = router;
