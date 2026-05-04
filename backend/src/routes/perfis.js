const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

// Multer em memória (sem salvar no disco)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas.'));
        }
        cb(null, true);
    }
});

/**
 * POST /api/perfis/:id_usuario/logo
 * Faz upload da logo para o Supabase Storage e atualiza o perfil.
 */
router.post('/:id_usuario/logo', upload.single('logo'), async (req, res) => {
    const { id_usuario } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Nome único por usuário — upsert sobrescreve automaticamente
    const ext = file.originalname.split('.').pop().toLowerCase();
    const filename = `logo_${id_usuario}.${ext}`;

    // Upload para o bucket "logos" no Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true // sobrescreve se já existir
        });

    if (uploadError) {
        console.error('Erro storage:', uploadError);
        return res.status(400).json({ error: uploadError.message });
    }

    // Pega a URL pública
    const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Salva a URL no perfil
    const { error: updateError } = await supabase
        .from('perfis')
        .update({ logo_empresa: publicUrl })
        .eq('id_perfil', id_usuario);

    if (updateError) {
        return res.status(400).json({ error: updateError.message });
    }

    res.json({ url: publicUrl });
});

/**
 * GET /api/perfis/:id_usuario
 * Retorna os dados do perfil do usuário.
 */
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    const { data, error } = await supabase
        .from('perfis')
        .select('id_perfil, email_login, nome_completo, nome_empresa, logo_empresa, cargo')
        .eq('id_perfil', id_usuario)
        .single();

    if (error || !data) return res.status(404).json({ error: 'Perfil não encontrado.' });
    res.json(data);
});

/**
 * PUT /api/perfis/:id_usuario
 * Atualiza os dados do perfil (Nome, Email, Senha, e dados da Empresa)
 */
router.put('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const {
        nome_completo,
        email_login,
        senha_atual,
        nova_senha,
        nome_empresa,
        cnpj,
        telefone
    } = req.body;

    // Se estiver tentando mudar a senha, verifica a atual
    if (nova_senha) {
        if (!senha_atual) {
            return res.status(400).json({ error: 'A senha atual é obrigatória para definir uma nova senha.' });
        }
        
        const { data: perfilAtual } = await supabase
            .from('perfis')
            .select('senha')
            .eq('id_perfil', id_usuario)
            .single();
            
        if (!perfilAtual || perfilAtual.senha !== senha_atual) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
    }

    const updates = {};
    if (nome_completo) updates.nome_completo = nome_completo;
    if (email_login) updates.email_login = email_login;
    if (nova_senha) updates.senha = nova_senha;
    if (nome_empresa !== undefined) updates.nome_empresa = nome_empresa;
    if (cnpj !== undefined) updates.cnpj = cnpj;
    if (telefone !== undefined) updates.telefone = telefone;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado enviado para atualização.' });
    }

    const { data, error } = await supabase
        .from('perfis')
        .update(updates)
        .eq('id_perfil', id_usuario)
        .select('id_perfil, email_login, nome_completo, nome_empresa, logo_empresa, cargo, cnpj, telefone')
        .single();

    if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return res.status(400).json({ error: 'Erro ao atualizar dados. Verifique se as colunas existem no banco.' });
    }

    res.json(data);
});

module.exports = router;
