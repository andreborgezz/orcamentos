const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Listar orçamentos de um usuário
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const { data, error } = await supabase
        .from('orcamentos')
        .select('*, clientes(nome)')
        .eq('id_usuario', id_usuario)
        .order('data_criacao', { ascending: false });

    if (error) return res.status(400).json(error);
    res.json(data);
});

// Criar Orçamento + Itens
router.post('/', async (req, res) => {
    const { id_usuario, id_cliente, subtotal, desconto, frete, valor_total, itens } = req.body;

    // 1. Insere o cabeçalho do orçamento
    const { data: orcamento, error: errOrc } = await supabase
        .from('orcamentos')
        .insert([{ 
            id_usuario, id_cliente, subtotal, desconto, frete, valor_total, 
            status: 'rascunho' 
        }])
        .select().single();

    if (errOrc) return res.status(400).json(errOrc);

    // 2. Prepara os itens vinculando ao ID do orçamento criado
    const itensFormatados = itens.map(item => ({
        id_orcamento: orcamento.id_orcamento,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario
    }));

    const { error: errItens } = await supabase
        .from('itens_orcamento')
        .insert(itensFormatados);

    if (errItens) return res.status(400).json(errItens);

    res.status(201).json({ message: "Orçamento criado com sucesso!", id: orcamento.id_orcamento });
});

// Buscar detalhes de um orçamento (Cabeçalho + Itens)
router.get('/detalhes/:id_orcamento', async (req, res) => {
    const { id_orcamento } = req.params;

    // 1. Busca o cabeçalho
    const { data: orcamento, error: errOrc } = await supabase
        .from('orcamentos')
        .select('*, clientes(nome)')
        .eq('id_orcamento', id_orcamento)
        .single();

    if (errOrc) return res.status(400).json(errOrc);

    // 2. Busca os itens
    const { data: itens, error: errItens } = await supabase
        .from('itens_orcamento')
        .select('*')
        .eq('id_orcamento', id_orcamento);

    if (errItens) return res.status(400).json(errItens);

    res.json({ ...orcamento, itens });
});

// Atualizar Orçamento
router.put('/:id_orcamento', async (req, res) => {
    const { id_orcamento } = req.params;
    const { id_cliente, subtotal, desconto, frete, valor_total, itens, status } = req.body;

    // 1. Atualiza o cabeçalho
    const { error: errOrc } = await supabase
        .from('orcamentos')
        .update({ id_cliente, subtotal, desconto, frete, valor_total, status })
        .eq('id_orcamento', id_orcamento);

    if (errOrc) return res.status(400).json(errOrc);

    // 2. Remove itens antigos e insere os novos (estratégia simples de sync)
    await supabase.from('itens_orcamento').delete().eq('id_orcamento', id_orcamento);

    const itensFormatados = itens.map(item => ({
        id_orcamento,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario
    }));

    const { error: errItens } = await supabase
        .from('itens_orcamento')
        .insert(itensFormatados);

    if (errItens) return res.status(400).json(errItens);

    res.json({ message: "Orçamento atualizado com sucesso!" });
});

// Deletar Orçamento
router.delete('/:id_orcamento', async (req, res) => {
    const { id_orcamento } = req.params;

    // 1. Remove os itens primeiro (FK constraint)
    const { error: errItens } = await supabase
        .from('itens_orcamento')
        .delete()
        .eq('id_orcamento', id_orcamento);

    if (errItens) return res.status(400).json({ error: errItens.message });

    // 2. Remove o orçamento
    const { error: errOrc } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id_orcamento', id_orcamento);

    if (errOrc) return res.status(400).json({ error: errOrc.message });

    res.json({ message: "Orçamento excluído com sucesso!" });
});

module.exports = router;