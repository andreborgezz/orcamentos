const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

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

module.exports = router;