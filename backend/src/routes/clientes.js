const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Listar clientes do usuário
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_usuario', id_usuario)
        .order('nome', { ascending: true });

    if (error) return res.status(400).json(error);
    res.json(data);
});

// Adicionar novo cliente
router.post('/', async (req, res) => {
    const { id_usuario, nome, email, telefone, status_negocio } = req.body;
    const { data, error } = await supabase
        .from('clientes')
        .insert([{ id_usuario, nome, email, telefone, status_negocio }])
        .select().single();

    if (error) return res.status(400).json(error);
    res.status(201).json(data);
});

module.exports = router;