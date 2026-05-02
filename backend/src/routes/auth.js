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
        .select('id_perfil, email_login, nome_completo, nome_empresa, cargo, logo_empresa')
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
        logo: perfil.logo_empresa
    });
});

module.exports = router;
