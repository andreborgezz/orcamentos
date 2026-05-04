# 🚀 Plano de Voo: CORE Budget (SaaS)

Este é o plano de ação estratégico para transformar a versão atual da plataforma CORE Budget em um SaaS (Software as a Service) 100% comercializável, pronto para receber usuários e gerar receita.

---

## Fase 1: Refinamentos do Produto (O que falta no MVP)

*O objetivo desta fase é fechar todas as pontas soltas do sistema para garantir que os usuários reais tenham uma experiência sem bugs, segura e completa.*

- [X] **Página de Cadastro (Sign Up):**
  - Desenvolver uma página de registro (`cadastro.html`) com o mesmo padrão premium do login.
  - Integrar com a API e o banco de dados (Supabase) para criar novos usuários e perfis.
- [X] **Página de Configurações (Settings):**
  - Criar uma tela onde o usuário possa atualizar seus dados (Nome, E-mail, Senha).
  - Adicionar campos para os dados da empresa do usuário (Nome Fantasia, CNPJ, Endereço, Telefone, Logo). **Essencial para que os PDFs gerados tenham a identidade visual do cliente.**
- [X] **Loading States & Feedback Visual:**
  - Implementar "spinners" (ícones de carregamento) nos botões de ação principal (Ex: Salvar Orçamento, Fazer Login).
  - Desabilitar botões durante requisições para prevenir cliques duplos e duplicação de dados.
- [ ] **Tratamento Global de Erros:**
  - Exibir toasts amigáveis caso a internet caia ou o servidor demore a responder, evitando telas congeladas.
- [ ] **Proteção e Expiração de Sessão:**
  - Garantir que se a sessão local ou o token expirarem, o usuário seja direcionado automaticamente e com segurança para a tela de login.

---


## Fase 2: Hospedagem e Setup de Produção (Deployment)

*Tirar o código do ambiente local (localhost) e disponibilizar na nuvem de forma escalável e profissional.*

- [ ] **Domínio Customizado:**

  - Registrar um domínio profissional (ex: `getcore.com.br` ou `corebudget.com.br`).
- [ ] **Deploy do Frontend:**

  - Hospedar os arquivos HTML/CSS/JS na **Vercel** ou **Cloudflare Pages** (gratuitos, ultra-rápidos e seguros).
- [ ] **Deploy do Backend (API):**

  - Hospedar o servidor Node.js/Express no **Render** ou **Railway**.
- [ ] **Ajustes de Segurança (CORS & Env):**

  - Configurar as variáveis de ambiente `.env` para apontar para as URLs de produção.
  - Bloquear acessos via CORS, permitindo que apenas o domínio oficial converse com o backend.
- [ ] **Banco de Dados (Supabase):**

  - Validar as políticas RLS (Row Level Security) para garantir que um inquilino (tenant) jamais acesse os dados de outro.

  ---

## Fase 3: A Landing Page (Máquina de Vendas)

*Criar a vitrine pública do projeto, focada em converter visitantes em usuários cadastrados.*

- [ ] **Design e Estrutura:**
  - **Hero Section:** Título principal focado na dor do cliente (ex: "Feche mais negócios com orçamentos em 1 clique"). Botão claro de "Comece Gratuitamente".
  - **Showcase (Mockups):** Mostrar o visual incrível da plataforma (Dashboard e os PDFs gerados).
  - **Features:** Destacar os principais benefícios (Cálculos automáticos, Controle de Clientes, Design Premium).
- [ ] **Pricing (Planos de Assinatura):**
  - Desenhar a estrutura de monetização inicial (ex: Freemium, Trial de 7 dias, ou Plano Pro mensal).
- [ ] **Desenvolvimento Front-end da LP:**
  - HTML/CSS/JS otimizado para SEO, rápido e responsivo.

---

## Fase 4: O Soft-Launch (Lançamento Beta)

*Colocar o sistema à prova antes de injetar dinheiro em marketing.*

- [ ] **Teste QA (Ponta a Ponta):**
  - Simular toda a jornada: Cadastro > Configuração de Conta > Novo Cliente > Criação e Exportação de PDF > Análise no Dashboard.
- [ ] **Convite a Early Adopters:**
  - Liberar o sistema para 5 a 10 pessoas (empreendedores próximos) para uso gratuito inicial em troca de feedback construtivo.
- [ ] **Abertura Oficial:**
  - Implementar gateway de pagamento (Stripe / Mercado Pago / Asaas) na plataforma para as cobranças das assinaturas.
  - Iniciar a prospecção e divulgação oficial do SaaS.
