const express = require('express');
const cors = require('cors');

// Importando as rotas
const clienteRoutes = require('./src/routes/clientes');
const orcamentoRoutes = require('./src/routes/orcamentos');

const app = express();
app.use(cors());
app.use(express.json());

// Definindo os caminhos da API
app.use('/api/clientes', clienteRoutes);
app.use('/api/orcamentos', orcamentoRoutes);

// Teste rápido de saúde do sistema
app.get('/api/health', (req, res) => {
    res.json({ status: "CORE Backend operando", uptime: process.uptime() });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 CORE SYSTEM BACKEND`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Estrutura: Modularizada\n`);
});