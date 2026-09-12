# 🥗 Geladeira Inteligente

> Sistema inteligente de gerenciamento de alimentos, escaneamento por visão computacional com IA (Gemma 3 4B), controle proativo de validade, listas de mercado dinâmicas e recomendação de receitas com aproveitamento integral sem desperdício.

---

## 1. Visão Geral

O **Geladeira Inteligente** é uma aplicação web progressiva e responsiva desenvolvida para resolver o problema crítico do desperdício de alimentos domésticos e simplificar o planejamento das refeições diárias. 

### O Problema Resolvido
Milhões de toneladas de alimentos são descartadas anualmente em residências porque as famílias perdem a visibilidade dos itens guardados no fundo da geladeira ou despensa, esquecem os prazos de validade ou não sabem o que cozinhar com os ingredientes remanescentes antes que estraguem.

### Público-Alvo
- Indivíduos e famílias que buscam economia doméstica e sustentabilidade alimentar.
- Pessoas com rotinas dinâmicas que precisam de agilidade na gestão de compras e despensa.
- Cozinheiros amadores e usuários com restrições alimentares específicas (vegetarianos, veganos, celíacos, intolerantes a lactose, dietas low-carb e hiperproteicas).

### Proposta de Valor
1. **Scanner Visual por IA**: Fotografe sua geladeira ou prateleira e identifique múltiplos itens alimentícios de uma só vez.
2. **Controle de Validade sem Furos**: Alertas visuais cromáticos baseados em dias de calendário que avisam itens vencidos, que vencem hoje ou nos próximos dias.
3. **Matching Antidesperdício**: O motor calcula a porcentagem de compatibilidade da sua despensa com centenas de receitas culinárias, indicando pratos com selo *"Pronta para cozinhar"* (100% dos ingredientes disponíveis).
4. **Lista de Mercado Integrada**: Crie listas com controle orçamentário em tempo real (R$), compartilhe no WhatsApp e transfira os itens comprados diretamente para a geladeira com um único clique.

---

## 2. Principais Funcionalidades

- **Autenticação Segura (Firebase Authentication)**:
  - Login rápido com conta Google (`GoogleAuthProvider` via popup nativo).
  - Cadastro e login por E-mail e Senha.
  - Recuperação de senha por e-mail com fluxo oficial Firebase.
  - Persistência de sessão local (`browserLocalPersistence`).
- **Perfil do Usuário**:
  - Foto de perfil e avatar personalizável.
  - Medidas corporais (peso em kg e altura em cm) para acompanhamento calórico.
  - Definição de porções padrão (1, 2, 3-4 ou 5+ pessoas).
  - Restrições alimentares permanentes salvas no perfil.
- **Sistema de Créditos no Backend**:
  - Cada novo usuário recebe 5 créditos promocionais de boas-vindas.
  - A verificação e o desconto de créditos ocorrem exclusivamente no backend com fila atômica anti-race condition.
  - Saldo autoritativo atualizado em tempo real na interface.
- **Scanner Inteligente de Alimentos (Gemma 3 4B Vision)**:
  - Upload ou captura fotográfica via câmera do dispositivo ou galeria.
  - Otimização prévia de imagem no cliente (compressão e redimensionamento balanceado).
  - Processamento seguro via endpoint autenticado `/api/scan` no Hugging Face Router.
  - Sanitização rigorosa contra objetos ou termos não alimentícios.
  - Associação automática com a taxonomia alimentar brasileira (8 categorias padrão).
  - Agrupamento inteligente e deduplicação somando quantidades.
- **Inventário e Despensa Virtual**:
  - Categorias: Frutas, Laticínios, Proteínas & Ovos, Bebidas, Despensa, Temperos & Molhos, Pães & Massas e Outros.
  - Locais de armazenamento: Geladeira, Freezer, Gaveta de legumes, Porta ou Despensa.
  - Unidades suportadas: `un`, `kg`, `g`, `L`, `ml`, `pct` e `fatias`.
  - Estados: Fresco (`fresh`) ou Congelado (`frozen`).
  - Consolidação automática de duplicados em lote (`WriteBatch`).
- **Controle Visual de Validade**:
  - Alerta Vencido (`< 0` dias) ou Vence hoje (`0` dias): Vermelho de alto contraste.
  - Alerta Falta 1 dia (`1` dia): Laranja intenso.
  - Alerta Falta 2 dias (`2` dias): Âmbar forte.
  - Alerta Falta 3 dias (`3` dias): Âmbar suave.
  - Alerta Normal (`> 3` dias): Neutro com contorno de apoio.
- **Matching Inteligente de Receitas**:
  - Catálogo amplo de receitas culinárias com modo de preparo passo a passo.
  - Ingredientes disponíveis destacados em verde; ingredientes faltantes em vermelho.
  - Filtros instantâneos por restrições dietéticas (Vegetariano, Vegano, Sem Glúten, Sem Lactose, Low Carb, Sem Frituras, Rico em Proteína), tempo de preparo e dificuldade.
- **Temporizador de Cozimento Integrado**:
  - Contador regressivo acionado diretamente da receita ("Começar a Cozinhar").
  - Barra flutuante persistente durante a navegação em qualquer aba.
  - Armazenamento em `localStorage` baseado em timestamps absolutos (`startedAt` e `endAt`), mantendo a contagem precisa mesmo após recarregar a página ou alternar abas.
- **Lista de Mercado com Controle Financeiro**:
  - Criação de múltiplas listas com agendamento opcional de data e hora.
  - Precificação unitária e cálculo de subtotal/total em Reais (R$) usando centavos inteiros para evitar imprecisões de ponto flutuante.
  - Checklist interativo de itens no carrinho com barra de progresso visual.
  - Cópia formatada para compartilhamento via WhatsApp com emojis por produto.
  - Transferência atômica dos itens comprados direto para a geladeira.
- **Painel Administrativo (`AdminView`)**:
  - Acesso protegido verificado via documento em `/admins/{uid}` no Firestore.
  - Visualização de todas as receitas do catálogo com filtros de imagens.
  - Upload direto e seguro de fotos de pratos via Cloudinary (preset unsigned restrito).

---

## 3. Stack Tecnológica

As seguintes tecnologias, bibliotecas e serviços compõem a arquitetura real do projeto:

- **Frontend Core**:
  - [React](https://react.dev/) (v19.0.1)
  - [TypeScript](https://www.typescriptlang.org/) (v5.8.2)
  - [Vite](https://vite.dev/) (v6.2.3)
- **Design System & Estilização**:
  - [Tailwind CSS](https://tailwindcss.com/) (v4.1.14) com `@tailwindcss/vite`
  - [Lucide React](https://lucide.dev/) (v0.546.0) para ícones vetoriais
  - [Motion](https://motion.dev/) (v12.23.24) para animações de interface fluídas
- **Plataforma Firebase**:
  - [Firebase SDK](https://firebase.google.com/) (v12.18.0)
  - Firebase Authentication (Google Auth + E-mail/Senha)
  - Cloud Firestore (Banco NoSQL em tempo real com modo Long-Polling para proxy)
  - Firebase App Check (Provedor reCAPTCHA Enterprise)
  - Firebase Storage (Armazenamento de avatares e imagens de escaneamento)
- **Inteligência Artificial & Backend Serverless**:
  - [Hugging Face Router API](https://router.huggingface.co/) com modelos de visão multimodal Gemma 3 4B IT:
    - `google/gemma-3-4b-it:fastest` (Cloudflare Pages Functions em `functions/api/scan.ts` e Cloudflare Worker em `worker.ts`)
    - `google/gemma-3-4b-it:featherless-ai` (Netlify Functions em `netlify/functions/scan.mts`)
- **Mídia & Hospedagem de Imagens**:
  - [Cloudinary](https://cloudinary.com/) (Upload client-side seguro via preset unsigned para receitas da comunidade e catálogo)

---

## 4. Estrutura do Projeto

A organização de diretórios e arquivos do repositório reflete uma arquitetura modular por domínios:

```text
/
├── .env.example                     # Declaração padronizada de variáveis de ambiente
├── firebase-applet-config.json      # Configurações do projeto Firebase do cliente
├── firebase-blueprint.json          # Esquema declarativo de coleções e segurança
├── firestore.rules                  # Regras endurecidas de segurança do Cloud Firestore
├── storage.rules                    # Regras de segurança e validação MIME do Storage
├── metadata.json                    # Metadados do applet AI Studio e permissões
├── netlify.toml                     # Configuração de build e redirecionamentos Netlify
├── wrangler.jsonc                   # Configuração de deploy do Cloudflare Worker / Assets
├── package.json                     # Manifesto npm com dependências e scripts de teste
├── tsconfig.json                    # Configuração do compilador TypeScript
├── vite.config.ts                   # Configuração do empacotador Vite com Tailwind v4
├── worker.ts                        # Implementação do Worker para Cloudflare
│
├── functions/                       # Backend Cloudflare Pages Functions
│   ├── _ai/                         # Módulos de IA, segurança e schemas de validação
│   │   ├── foodPrompt.ts            # Engenharia de prompt para detecção estruturada
│   │   ├── foodSchema.ts            # JSON Schema estrito para o modelo de visão
│   │   └── security.ts              # Validação de JWT, App Check, Rate Limit e Créditos
│   └── api/
│       └── scan.ts                  # Endpoint seguro POST /api/scan
│
├── netlify/                         # Backend alternativo Netlify Functions
│   └── functions/
│       └── scan.mts                 # Handler equivalente POST /api/scan para Netlify
│
├── scripts/                         # Scripts de catálogo e testes locais
│   ├── catalog/                     # Testes de heurísticas de dieta
│   └── recipes/                     # Importação e geração do catálogo TheMealDB
│
├── src/                             # Código-fonte da aplicação React
│   ├── assets/                      # Recursos visuais estáticos
│   ├── components/                  # Componentes reutilizáveis organizados por domínio
│   │   ├── admin/                   # Modal de edição fotográfica e gestão de receitas
│   │   ├── common/                  # Modais, botões, cards, estados vazios e de erro
│   │   ├── food/                    # Componentes de cartões e itens de alimentos
│   │   ├── layout/                  # Header e BottomNavigation (Spatial UI)
│   │   ├── recipe/                  # Modais de detalhes e temporizador flutuante
│   │   ├── shopping/                # Modais e itens de lista de compras
│   │   └── views/                   # Telas principais (Dashboard, Scanner, etc.)
│   ├── data/                        # Dados iniciais e fotos de amostra da geladeira
│   ├── services/                    # Camada de comunicação com Firebase e APIs
│   │   ├── authService.ts           # Gestão de usuários, Google e E-mail/Senha
│   │   ├── cookingTimerStorage.ts   # Persistência de timestamps do temporizador
│   │   ├── firebaseConfig.ts        # Singleton Firebase, App Check e Firestore
│   │   ├── firestoreService.ts      # Acesso a coleções, regras e lotes (WriteBatch)
│   │   ├── foodService.ts           # Gestão do inventário de alimentos
│   │   ├── imageUploadService.ts    # Upload Cloudinary para fotos de receitas
│   │   ├── recipeService.ts         # Catálogo culinário e motor de matching
│   │   ├── scannerService.ts        # Cliente do scanner e tratamento de erros
│   │   └── shoppingListService.ts   # Gestão de listas de compras e transferências
│   ├── types/                       # Tipagens e interfaces TypeScript unificadas
│   ├── utils/                       # Utilitários de data, taxonomia e otimização
│   ├── App.tsx                      # Componente raiz com navegação e abas
│   ├── main.tsx                     # Ponto de entrada DOM
│   └── index.css                    # Folha de estilos global com Tailwind CSS v4
│
└── docs/                            # Documentação oficial do projeto
    ├── DOCUMENTACAO_DO_SISTEMA.md   # Especificação arquitetural detalhada
    └── MANUAL_DO_ADMINISTRADOR.md   # Guia prático de operação e manutenção
```

---

## 5. Como Executar Localmente

### Pré-requisitos
- **Node.js**: Versão 20 ou superior (conforme `.nvmrc` e `.node-version`).
- **NPM**: Versão 9 ou superior.

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha as chaves necessárias (veja seção 6 abaixo).

### Passo 3: Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor estará acessível em `http://localhost:3000`.

### Passo 4: Executar Testes Automatizados
A suíte completa de testes (heurísticas dietéticas, filtros, segurança A–J, taxonomia alimentar, otimizador de imagem, temporizador e listas de compras) é executada via:
```bash
npm test
```
Para executar apenas os testes de segurança:
```bash
npm run test:security
```

### Passo 5: Verificação de Tipagem (Typecheck / Lint)
```bash
npm run lint
```
*(Executa `tsc --noEmit` garantindo conformidade rigorosa do TypeScript)*.

### Passo 6: Gerar Build de Produção
```bash
npm run build
```
Os artefatos estáticos otimizados serão emitidos no diretório `dist/`.

---

## 6. Variáveis de Ambiente

Todas as variáveis de ambiente utilizadas no projeto estão declaradas em `.env.example`. A tabela abaixo descreve o papel de cada uma:

| Variável | Escopo | Finalidade | Onde Configurar |
| :--- | :---: | :--- | :--- |
| `HF_TOKEN` | **Secreta** | Token de autenticação Bearer para o Hugging Face Router (usado na rota `/api/scan`). | Cloudflare Pages (Variables and Secrets), Netlify Environment Variables ou arquivo `.env` do servidor. |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` *(ou alias `VITE_RECAPTCHA_SITE_KEY`)* | **Pública** | Chave de site do reCAPTCHA Enterprise para validação do Firebase App Check no frontend. | Painel de variáveis do frontend ou arquivo `.env` do cliente. |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | **Pública (Dev)** | Token opcional de depuração do App Check para testes locais no navegador. | Arquivo `.env.local` apenas em ambiente de desenvolvimento. |
| `GEMINI_API_KEY` | **Secreta** | Chave injetada pelo ambiente do Google AI Studio para recursos adicionais de IA. | Secrets do Google AI Studio / Cloud Run. |
| `APP_URL` | **Pública** | URL base de hospedagem da aplicação injetada automaticamente pela infraestrutura. | Variáveis de ambiente da plataforma de nuvem. |
| `ENFORCE_APP_CHECK` | **Secreta (Backend)** | Define se o backend deve rejeitar requisições sem App Check válido (`true`/`false`). | Variáveis de ambiente das Functions no Cloudflare/Netlify. |

> ⚠️ **AVISO DE SEGURANÇA**: Nunca versione arquivos contendo credenciais reais ou tokens (como `HF_TOKEN`). Mantenha-os exclusivamente nos cofres de segredos da sua plataforma de hospedagem.

---

## 7. Configuração do Firebase e Serviços

As credenciais do cliente web Firebase residem em `firebase-applet-config.json`:
- **Projeto ID (Firebase Auth / GCP)**: `ai-studio-applet-webapp-1a826`
- **Banco de Dados Firestore (Database ID)**: `ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5`
- **Bucket de Armazenamento**: `ai-studio-applet-webapp-1a826.firebasestorage.app`

> ✅ **Alinhamento de Project ID (Resolvido)**:  
> - **Validação Criptográfica**: A constante em `functions/_ai/security.ts` está configurada como `export const FIREBASE_PROJECT_ID = "ai-studio-applet-webapp-1a826";`, perfeitamente alinhada com o `projectId` do Firebase Authentication.
> - **Compatibilidade com ID Tokens**: Os tokens JWT emitidos pelo Google Secure Token Service (`iss: "https://securetoken.google.com/ai-studio-applet-webapp-1a826"` e `aud: "ai-studio-applet-webapp-1a826"`) são validados com sucesso pelo backend `/api/scan`.
> - **Distinção de Banco de Dados**: O banco NoSQL Cloud Firestore opera sob a instância dedicada `ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5` (`firestoreDatabaseId`), sem conflito com o emissor de autenticação.

### Segurança do Firestore e Storage
- As regras de segurança em `firestore.rules` e `storage.rules` garantem que nenhum usuário comum possa manipular créditos ou se auto-promover a administrador pelo client SDK.
- Uploads de imagens passam por checagem estrita de tipos MIME (`image/jpeg`, `image/png`, `image/webp`) e limite máximo de 10 MB.

---

## 8. Documentação Técnica Adicional

Para especificações detalhadas e manuais operacionais, consulte os documentos em `/docs`:
- **[Documentação do Sistema](docs/DOCUMENTACAO_DO_SISTEMA.md)**: Arquitetura técnica, coleções NoSQL, pipelines de IA, matching e matrizes de segurança.
- **[Manual do Administrador](docs/MANUAL_DO_ADMINISTRADOR.md)**: Guia passo a passo para operação, concessão de acessos administrativos, gestão de catálogo e troubleshooting.
