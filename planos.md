# 🚀 Refinamentos Pré-Deploy — CORE Budget

## 🔴 CRÍTICO (bloqueia o deploy)

### 1. `localhost:3000` hardcoded em 6 arquivos
Todos os `.js` de página usam `const API_BASE = 'http://localhost:3000/api'`.
Em produção isso quebra completamente. Precisa ser uma variável relativa ou baseada no ambiente.
**Fix:** Centralizar em um `config.js` global com `const API_BASE = '/api'` (funciona em qualquer host).

### 2. Sem proteção de rotas no backend
Qualquer um com um `id_usuario` válido consegue acessar/deletar dados de outro usuário.
Não há verificação de que o usuário logado é dono do recurso que está manipulando.
**Fix:** Adicionar validação de `id_usuario` nas rotas críticas (DELETE, PUT).

### 3. Página de cadastro (`cadastro.html`) sem integração
O arquivo existe mas não foi verificado se o fluxo de criação de conta funciona de ponta a ponta.
**Fix:** Testar o cadastro → login → dashboard completo antes do deploy.

---

## 🟡 IMPORTANTE (experiência degradada sem isso)

### 4. Duplicar orçamento (botão existe, função não)
O botão de cópia na tabela de orçamentos tem `/* lógica de duplicar futuramente */`.
É uma funcionalidade muito esperada pelo usuário.
**Fix:** Criar `POST /api/orcamentos/duplicar/:id` e implementar no frontend.

### 5. Alterar status do orçamento
Não há como mudar um orçamento de "Rascunho" → "Enviado" → "Aprovado" na interface.
As badges existem mas o fluxo não existe.
**Fix:** Dropdown de status na tabela de orçamentos (inline edit).

### 6. Página de Clientes — ver orçamentos do cliente
Na página de um cliente, não há como ver quais orçamentos pertencem a ele.
**Fix:** Na listagem de clientes, mostrar badge com contagem de orçamentos.

### 7. Busca de orçamentos busca só pelo ID
A busca na página de Orçamentos não filtra pelo nome do cliente corretamente.
**Fix:** Incluir `o.clientes?.nome` no `matchSearch` da função `filterOrcamentos`.

---

## 🟢 REFINAMENTOS DE UX (polimento final)

### 8. Confirmação de saída no Novo Orçamento
Se o usuário tiver itens preenchidos e clicar em outro link da sidebar, perde tudo sem aviso.
**Fix:** `window.onbeforeunload` quando há itens não salvos.

### 9. Numeração de orçamento legível
Os orçamentos aparecem como `#8`, `#12` — números de banco sem contexto.
**Fix:** Gerar um número sequencial amigável por usuário (ex: `ORC-2026-001`).

### 10. Feedback no botão "Salvar Orçamento"
Quando salva, não há loading state no botão, o usuário não sabe se funcionou até o toast aparecer.
**Fix:** Adicionar `.btn-loading` durante o `await fetch`.

### 11. Empty state no Dashboard com CTA
Quando não há orçamentos, o dashboard mostra apenas uma tabela vazia.
**Fix:** Empty state com botão "+ Criar primeiro orçamento".

### 12. PDF com número/data dinâmica
O `numeroOrc` no `pdf_templates.js` usa `Date.now()` em vez do `id_orcamento` real.
**Fix:** Usar o ID do orçamento salvo quando disponível (modo edição).

---

## 📦 DEPLOY EM SI

| Etapa | O que fazer |
|---|---|
| **1. Variáveis de ambiente** | `API_BASE = '/api'` em todos os JS |
| **2. Build / Servidor** | O backend Express serve o frontend — ok para começar |
| **3. Supabase em produção** | Verificar se `.env` com as keys está configurado no servidor |
| **4. HTTPS** | Obrigatório para o localStorage funcionar de forma segura |
| **5. Domínio** | Apontar para o servidor com PM2 ou Railway/Render |

---

## Ordem sugerida de execução

```
1. Fix API_BASE (30 min) ← desbloqueia tudo
2. Duplicar orçamento (1h)
3. Alterar status inline (1h)  
4. Busca por nome de cliente (15 min)
5. Confirmação de saída (20 min)
6. Testes ponta a ponta (cadastro → orçamento → PDF)
7. Deploy
```
