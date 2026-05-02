const express = require('express');
const cors = require('cors');
const path = require('path');

// Captura erros não tratados ANTES de qualquer coisa
process.on('uncaughtException', (err) => {
    console.error('\n💥 ERRO CRÍTICO (uncaughtException):', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n💥 PROMISE REJEITADA (unhandledRejection):', reason);
    process.exit(1);
});

// Importando as rotas
const authRoutes = require('./src/routes/auth');
const clienteRoutes = require('./src/routes/clientes');
const orcamentoRoutes = require('./src/routes/orcamentos');
const perfisRoutes = require('./src/routes/perfis');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Definindo os caminhos da API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/perfis', perfisRoutes);

// Saúde do sistema
app.get('/api/health', (req, res) => {
    res.json({ status: "CORE Backend operando", uptime: process.uptime() });
});

// Raiz → login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 CORE SYSTEM ONLINE`);
    console.log(`📍 Acesse: http://localhost:${PORT}`);
    console.log(`🔐 Login:  http://localhost:${PORT}/login.html\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Porta ${PORT} em uso! Rode: npx kill-port ${PORT}\n`);
    } else {
        console.error('\n❌ Erro no servidor:', err.message);
    }
    process.exit(1);
});