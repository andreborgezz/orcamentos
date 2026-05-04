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

// Atualizar cliente
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, status_negocio } = req.body;
    
    const { data, error } = await supabase
        .from('clientes')
        .update({ nome, email, telefone, status_negocio })
        .eq('id_cliente', id)
        .select().single();

    if (error) return res.status(400).json(error);
    res.json(data);
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id_cliente', id);

    if (error) return res.status(400).json(error);
    res.json({ message: 'Cliente deletado com sucesso' });
});

module.exports = router;