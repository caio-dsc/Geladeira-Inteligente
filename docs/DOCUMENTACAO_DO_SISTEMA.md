# Documentação Técnica do Sistema — Geladeira Inteligente

**Projeto:** Geladeira Inteligente  
**Versão:** 1.0.0 (Release Candidate / Segurança Validada)  
**Ambiente:** Web / Mobile PWA (React 19, Vite, Tailwind CSS 4, Firebase 12, Hugging Face Router API)  

---

## 1. Arquitetura

O sistema adota uma arquitetura em camadas orientada a eventos e serviços distribuídos, segregando com rigor as responsabilidades entre o cliente (Single Page Application executada no navegador) e as camadas seguras de retaguarda (Firebase Cloud Services e Serverless Backend).

### 1.1 Diagrama Textual de Fluxo e Confiança

```text
+-------------------------------------------------------------------------------+
|                             CLIENTE (FRONTEND)                                |
|  - React 19 SPA (Vite + Tailwind v4 + Motion)                                 |
|  - Camada de Apresentação (Spatial UI 2D)                                     |
|  - Gerenciamento de Estado Local & Cache (Auth, Inventário, Listas, Receitas)  |
|  - Otimização & Compressão Prévia de Imagens (HTML5 Canvas)                   |
+-------------------------------------------------------------------------------+
       |                                |                            |
       | (Firebase ID Token             | (Leitura e Gravação        | (Upload de Foto
       |  + App Check Token)            |  com Security Rules)       |  de Receitas)
       v                                v                            v
+-----------------------+     +-------------------+     +-----------------------+
|  BACKEND (/api/scan)  |     |  FIREBASE SUITE   |     |  CLOUDINARY MEDIA     |
| - Cloudflare Pages /  |     | - Authentication  |     | - Upload Endpoint     |
|   Workers / Netlify   |     | - Cloud Firestore |     | - Preset Unsigned     |
| - Validação JWT RS256 |     | - Storage         |     |   Restrito            |
| - App Check Enforce   |     | - App Check       |     +-----------------------+
| - Rate Limiting (UID) |     +-------------------+
| - Dedução de Créditos |
+-----------------------+
       |
       | (Chamada com HF_TOKEN protegido)
       v
+-----------------------------------------------+
|  HUGGING FACE ROUTER API                      |
|  - Modelo de Visão: google/gemma-3-4b-it      |
|  - Saída Estruturada: JSON Schema Estrito     |
+-----------------------------------------------+
```

### 1.2 Segregação de Responsabilidades

| Camada | Responsabilidades Principais | Limitações de Acesso |
| :--- | :--- | :--- |
| **Frontend (Browser)** | Renderização da interface, captura de câmera, otimização de imagens, interação de receitas e checklist de compras. | Nunca armazena tokens de terceiros (HF_TOKEN) nem decide autoridade final de saldo de créditos. |
| **Firebase Auth** | Emissão, renovação de tokens JWT (ID Token), autenticação federada Google e recuperação de senhas. | Gerenciado exclusivamente pelo provedor oficial do Firebase. |
| **Cloud Firestore** | Armazenamento de dados persistentes (usuários, inventário, histórico, listas de mercado e receitas). | Todo acesso é filtrado por `firestore.rules`. Usuários comuns não escrevem em `/admins` nem no campo `credits`. |
| **Firebase Storage** | Armazenamento de avatares de perfil e fotos brutas de escaneamento. | Validado por `storage.rules` (MIME types `image/(jpeg\|png\|webp)` e tamanho máximo de 10 MB). |
| **Backend `/api/scan`** | Autenticação estrita do chamador, rate limiting, controle atômico de créditos e proxy seguro para o modelo de IA. | Único detentor do secret `HF_TOKEN`. |
| **Hugging Face Router** | Execução de inferência de visão computacional multimodal utilizando o modelo Gemma 3 4B IT. | Acessível unicamente pelo backend por requisições autenticadas. |

---

## 2. Autenticação

A autenticação do Geladeira Inteligente é gerenciada pelo Firebase Authentication, com suporte a múltiplos provedores e sincronização de perfil em tempo real:

- **Criação de Conta e Cadastro**: Usuários podem se cadastrar utilizando e-mail e senha via `createUserWithEmailAndPassword()`. No momento da criação, o método `syncUserProfile()` em `authService.ts` instancia o documento inicial em `/users/{uid}` com 5 créditos promocionais de boas-vindas.
- **Login Federado com Google**: Implementado via `signInWithPopup(auth, googleAuthProvider)`. O provedor Google está configurado com `prompt: 'select_account'` para facilitar a alternância de perfis.
- **Login Tradicional por E-mail e Senha**: Executado através de `signInWithEmailAndPassword()`.
- **Recuperação de Senha**: Disparada por `sendPasswordResetEmail(auth, email)` enviando link seguro padronizado do Firebase.
- **Persistência de Sessão**: Configurada explicitamente no carregamento via `setPersistence(auth, browserLocalPersistence)`, mantendo a conexão entre abas e recarregamentos.
- **Ciclo de Vida com `onAuthStateChanged`**: O singleton `FirebaseAuthService` assina o observador de autenticação, recuperando os dados do perfil no Firestore e notificando todos os ouvintes da interface reativa.
- **Perfil do Usuário**: Armazena nome, e-mail, URL do avatar, medidas corporais (peso em kg e altura em cm), porções padrão de refeição e restrições alimentares permanentes.

---

## 3. Cloud Firestore

O banco de dados NoSQL Cloud Firestore está modelado em coleções e subcoleções com chaves primárias isoladas:

### 3.1 Estrutura das Coleções

#### `/users/{userId}`
- **Finalidade**: Perfil cadastral do usuário, configurações e controle de saldo.
- **Proprietário**: Usuário identificado por `request.auth.uid == userId`.
- **Leitura**: Permitida apenas ao próprio usuário (`isOwner(userId)`).
- **Escrita (Criação)**: Permitida apenas pelo próprio usuário com `credits <= 5` e sem auto-promoção (`isAdmin == false`).
- **Escrita (Atualização)**: Permitida apenas pelo próprio usuário, sendo **estritamente proibida** a alteração dos campos `credits`, `isAdmin`, `id` e `createdAt`.
- **Campos Principais**:
  - `id` (string): UID do Firebase Auth.
  - `name` (string): Nome de exibição.
  - `email` (string): E-mail da conta.
  - `avatarUrl` (string): URL pública da imagem de perfil.
  - `credits` (number): Saldo de créditos do usuário para escaneamentos.
  - `preferences` (object): Objeto com `dietaryRestrictions`, `cookingLevel`, `allergies`, `defaultServings`.
  - `age`, `weightKg`, `heightCm` (number | null): Dados corporais opcionais.
  - `isAdmin` (boolean): Flag de privilégios de administrador.
  - `createdAt` (string): Timestamp ISO de registro.

#### `/users/{userId}/inventory/{itemId}`
- **Finalidade**: Armazenamento dos alimentos presentes na geladeira e despensa do usuário.
- **Proprietário**: Próprio usuário (`isOwner(userId)`).
- **Leitura e Escrita**: Totalmente restritas ao dono do perfil.
- **Campos Principais**:
  - `id` (string): Identificador único do item.
  - `name` (string): Nome do alimento (ex.: "Banana", "Queijo Minas").
  - `category` (string): Categoria canônica (`fruits`, `dairy`, `proteins`, etc.).
  - `quantity` (number): Quantidade numérica.
  - `unit` (string): Unidade de medida (`un`, `kg`, `g`, `L`, `ml`, `pct`, `fatias`).
  - `state` (string): Estado físico (`fresh` ou `frozen`).
  - `location` (string): Local (`geladeira`, `freezer`, `gaveta_legumes`, `porta`, `despensa`).
  - `addedAt` (string): Timestamp ISO da inclusão.
  - `expiryDate` (string | optional): Data de validade (formato `YYYY-MM-DD` ou `DD/MM/YYYY`).

#### `/users/{userId}/scans/{scanId}`
- **Finalidade**: Histórico e metadados das sessões de escaneamento por imagem.
- **Proprietário**: Próprio usuário (`isOwner(userId)`).
- **Leitura e Escrita**: Apenas o próprio usuário.
- **Campos Principais**:
  - `id` (string): ID da sessão de scan.
  - `imageUrl` (string): URL da imagem analisada.
  - `timestamp` (string): Data e hora da análise.
  - `status` (string): Status (`success`, `error`, etc.).
  - `detectedItems` (array): Lista dos itens detectados na análise.

#### `/users/{userId}/shoppingLists/{listId}`
- **Finalidade**: Listas de compras de mercado com planejamento orçamentário.
- **Proprietário**: Próprio usuário (`isOwner(userId)`).
- **Leitura e Escrita**: Apenas o próprio usuário.
- **Campos Principais**:
  - `id` (string): ID da lista.
  - `title` (string): Título descritivo (ex.: "Compras da Semana").
  - `shoppingDate` (string | optional): Data planejada (`YYYY-MM-DD`).
  - `shoppingTime` (string | optional): Horário planejado (`HH:mm`).
  - `completed` (boolean): Flag de lista finalizada.
  - `total` (number): Valor financeiro total calculado em BRL (R$).
  - `items` (array): Lista de objetos `ShoppingListItem` contendo `id`, `name`, `quantity`, `unit`, `price`, `completed`, `category`.

#### `/recipes/{recipeId}`
- **Finalidade**: Catálogo público de receitas culinárias.
- **Proprietário**: Sistema / Administradores.
- **Leitura**: Pública (`allow read: if true;`).
- **Escrita e Exclusão**: Restrita exclusivamente a administradores credenciados (`allow write: if isAdmin();`).
- **Campos Principais**:
  - `id` (string): ID único da receita.
  - `title` (string): Nome da receita.
  - `description` (string): Breve resumo ou introdução gastronômica.
  - `prepTimeMinutes` (number): Tempo total de preparo em minutos.
  - `difficulty` (string): Dificuldade (`Fácil`, `Médio`, `Avançado`).
  - `servings` (number): Número de porções servidas.
  - `category` (string): Categoria culinária (ex.: "Massas", "Sobremesas").
  - `imageUrl` (string): URL pública da foto do prato pronto.
  - `ingredients` (array): Array de objetos `{ name, quantity, required, category }`.
  - `steps` (array): Lista sequencial ordenada de instruções de preparo.
  - `tags` (array): Marcadores de busca e restrições alimentares.
  - `diet` (object): Flags booleanas calculadas (`vegetarian`, `vegan`, `hasGluten`, etc.).

#### `/admins/{adminId}`
- **Finalidade**: Whitelist de controle de acesso para permissões administrativas.
- **Proprietário**: Sistema (gerenciado exclusivamente via Console Firebase ou Admin SDK).
- **Leitura**: Qualquer usuário autenticado pode verificar se seu próprio ID consta na coleção.
- **Escrita**: **Completamente bloqueada no cliente** (`allow write: if false;`).

#### `/test/{testId}`
- **Finalidade**: Coleção técnica para teste automatizado de handshake e conectividade.
- **Leitura**: Usuários autenticados.
- **Escrita**: Bloqueada (`allow write: if false;`).

---

## 4. Firestore Security Rules

> **Declaração Fundamental de Segurança:**  
> *"Firebase Security Rules são uma camada independente do cliente."*  
> Nenhuma validação feita no frontend substitui ou afrouxa as regras avaliadas no servidor do Firestore.

### 4.1 Funções de Suporte
- `isAuthenticated()`: Valida se a requisição possui credencial ativa (`request.auth != null`).
- `isOwner(userId)`: Valida se o UID do chamador corresponde estritamente ao documento acessado.
- `isAdmin()`: Verifica no banco de dados se existe um documento ativo em `/admins/{request.auth.uid}`.

### 4.2 Mecanismos de Proteção Endurecidos
1. **Trava de Créditos e Auto-promoção**:
   ```javascript
   allow update: if isOwner(userId)
     && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['credits', 'isAdmin', 'id', 'createdAt']);
   ```
   Esta regra utiliza `diff().affectedKeys()` para rejeitar sumariamente qualquer tentativa de modificação nos campos `credits` ou `isAdmin` via cliente.
2. **Imutabilidade da Coleção de Administradores**:
   A coleção `/admins/{adminId}` possui `allow write: if false;`, garantindo que nenhum usuário possa conceder privilégios administrativos a si mesmo ou a terceiros pelo frontend.
3. **Isolamento Completo entre Usuários**:
   Subcoleções de inventário, scans e listas de mercado só podem ser lidas ou modificadas quando `isOwner(userId)` for verdadeiro. Um usuário B não possui nenhuma visibilidade sobre os alimentos ou compras do usuário A.
4. **Proteção do Catálogo de Receitas**:
   A coleção `/recipes/{recipeId}` permite leitura pública, mas escrita condicionada exclusivamente a `isAdmin()`.

---

## 5. Firebase Storage

As regras de armazenamento de arquivos no Firebase Storage (`storage.rules`) controlam o upload seguro de binários:

- **Avatar de Perfil (`/users/{userId}/avatar.jpg`)**: Leitura pública; gravação permitida unicamente ao dono da conta (`isOwner(userId)`).
- **Fotos de Escaneamento (`/users/{userId}/scans/{scanId}`)**: Leitura e gravação restritas ao dono da conta.
- **Imagens Oficiais de Receitas (`/recipes/{recipeId}/{allPaths=**}`)**: Leitura pública; gravação restrita exclusivamente a administradores (`isAdmin()`).
- **Validação Estrita de Arquivos (`isValidImage()`)**:
  - Validação de MIME Type: Aceita unicamente `image/jpeg`, `image/png` e `image/webp`. Arquivos executáveis, scripts ou PDFs são bloqueados no servidor.
  - Tamanho Máximo: Limitado a 10 MB (`request.resource.size <= 10 * 1024 * 1024`).

---

## 6. Firebase App Check

O Firebase App Check protege os recursos do projeto contra tráfego abusivo, bots e requisições fraudulentas:

- **Provedor Integrado [IMPLEMENTADO NO CÓDIGO]**: Utiliza `ReCaptchaEnterpriseProvider` com a chave do site fornecida em `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` (com suporte ao alias retrocompatível `VITE_RECAPTCHA_SITE_KEY`). Se a chave não for fornecida, a aplicação segue em execução regular, mas o envio do token nos cabeçalhos é omitido.
- **Modo Debug em Desenvolvimento [IMPLEMENTADO NO CÓDIGO]**: Quando executado em modo de desenvolvimento (`import.meta.env.DEV`) ou com a variável `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`, o SDK atribui `self.FIREBASE_APPCHECK_DEBUG_TOKEN`, gerando ou usando o token de depuração impresso no console do desenvolvedor para ser cadastrado no console do Firebase.
- **Integração no Backend [IMPLEMENTADO NO CÓDIGO]**: O token gerado no cliente é enviado via cabeçalho `X-Firebase-AppCheck` nas requisições ao endpoint `/api/scan`.
- **Validação no Servidor [IMPLEMENTADO NO CÓDIGO]**: A função `validateAppCheck` decodifica e verifica a validade temporal do token JWT do App Check. Quando a variável de ambiente `ENFORCE_APP_CHECK=true` está configurada no backend, requisições sem token válido são rejeitadas com HTTP 403 Forbidden (`APP_CHECK_MISSING` ou `APP_CHECK_INVALID`). Quando `ENFORCE_APP_CHECK` está ausente ou `false`, o backend opera em modo permissivo (auditoria).
- **Ativação nos Serviços Cloud [CONFIGURAÇÃO OPERACIONAL EXTERNA]**:
  > *"Configuração operacional externa ao código."*  
  > O registro da chave do reCAPTCHA Enterprise, a adição dos domínios autorizados e a ativação do modo Enforcement do App Check para o Firestore e Storage devem ser realizados exclusivamente no console do Firebase / Google Cloud Console.

---

## 7. Scanner por IA e Processamento Visual

O pipeline de análise e reconhecimento visual de alimentos é estruturado nas seguintes etapas sequenciais:

> **Nota sobre Implementações de Backend e Modelos:**  
> - **Cloudflare Pages Functions** (`functions/api/scan.ts`) e **Cloudflare Worker** (`worker.ts`): Utilizam o modelo `google/gemma-3-4b-it:fastest`.  
> - **Netlify Functions** (`netlify/functions/scan.mts`): Utiliza o modelo `google/gemma-3-4b-it:featherless-ai`.  
> - **Ambiente Local / Amostras de Teste**: O frontend dispõe de imagens de teste pré-configuradas (`SAMPLE_FRIDGE_IMAGES` em `mockData.ts`) que retornam dados estruturados instantaneamente para testes de interface com custo zero de rede.

```text
[Usuário seleciona/captura foto]
               │
               ▼
[1. Otimização no cliente (Redimensionamento e compressão WebP/JPEG)]
               │
               ▼
[2. Obtenção do Firebase ID Token e token do App Check]
               │
               ▼
[3. Chamada POST /api/scan com Authorization: Bearer <token>]
               │
               ▼
[4. Backend: Validação criptográfica do JWT (RS256, exp, iss, aud)]
               │
               ▼
[5. Backend: Validação do token do Firebase App Check]
               │
               ▼
[6. Backend: Verificação de Rate Limit (máximo 6 req/min por UID)]
               │
               ▼
[7. Backend: Verificação e Dedução Atômica de Créditos (Mutex por UID)]
               │
               ▼
[8. Backend: Montagem do payload e chamada à Hugging Face Router API]
               │
               ▼
[9. Inferência com modelo Gemma 3 4B IT (fastest ou featherless-ai)]
               │
               ▼
[10. Validação da saída via JSON Schema estrito]
               │
               ▼
[11. Backend retorna HTTP 200 com itens e saldo authoritative restante]
               │
               ▼
[12. Frontend: Higienização contra termos não alimentícios e objetos]
               │
               ▼
[13. Frontend: Mapeamento e resolução de categoria (Food Taxonomy)]
               │
               ▼
[14. Frontend: Mesclagem inteligente e consolidação de quantidades]
               │
               ▼
[15. Interface exibe lista pré-selecionada para confirmação do usuário]
               │
               ▼
[16. Inclusão no Inventário da Geladeira com WriteBatch]
```

### 7.1 Matriz de Respostas HTTP do Endpoint `/api/scan`

| Status | Código Interno | Significado | Comportamento da Aplicação |
| :---: | :--- | :--- | :--- |
| **200** | `SUCCESS` | Alimentos identificados com sucesso. | Interface apresenta lista de itens detectados para revisão. |
| **400** | `BAD_REQUEST` | Payload sem imagem, formato inválido ou corrompido. | Exibe mensagem solicitando envio de imagem válida. |
| **401** | `AUTH_TOKEN_MISSING` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID_ISSUER` / `AUTH_TOKEN_INVALID_AUDIENCE` | Usuário não autenticado, token expirado ou emissor/audiência incompatíveis. | Solicita reconexão à conta do usuário. |
| **402** | `INSUFFICIENT_CREDITS` | Usuário não possui créditos disponíveis (`credits <= 0`). | Bloqueia a análise antes da IA e abre o modal de créditos. |
| **403** | `APP_CHECK_MISSING` / `APP_CHECK_INVALID` | Token do App Check ausente ou inválido (com enforcement ativo). | Bloqueia requisição proveniente de cliente não confiável. |
| **429** | `RATE_LIMIT_EXCEEDED` | Limite de 6 requisições por minuto atingido por este UID. | Exibe aviso com contador de espera do cabeçalho `Retry-After`. |
| **500** | `INTERNAL_SERVER_ERROR` | Falha interna no servidor ou secret `HF_TOKEN` não configurado. | Exibe aviso de falha temporária no serviço de IA. |
| **502** | `BAD_GATEWAY` | Hugging Face Router recusou a requisição ou retornou payload corrompido. | Exibe aviso de indisponibilidade da API do modelo. |
| **503** | `MODEL_BUSY` | Servidor do modelo de IA temporariamente sobrecarregado. | Aciona fluxo de retry automático no backend com backoff exponencial. |

### 7.2 Análise Crítica de Segurança: Project ID vs. Database ID (Resolvido)

> ✅ **CONFORMIDADE DE VALIDAÇÃO CRIPTOGRÁFICA**:  
> - **Alinhamento do Backend**: No arquivo `functions/_ai/security.ts`, a constante de validação está configurada como `export const FIREBASE_PROJECT_ID = "ai-studio-applet-webapp-1a826";`.
> - **Validação de Claims**: O backend valida com rigor que `iss === "https://securetoken.google.com/ai-studio-applet-webapp-1a826"` e `aud === "ai-studio-applet-webapp-1a826"`, aceitando perfeitamente os ID Tokens reais emitidos pelo Google Firebase Auth.
> - **Isolamento de Base de Dados**: As operações NoSQL apontam especificamente para o banco dedicado `ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5` (`firestoreDatabaseId`), garantindo independência entre governança de identidade e persistência.

---

## 8. Sistema de Créditos

O consumo de créditos foi integralmente migrado para o backend para garantir autoridade financeira absoluta:

- **Créditos Iniciais**: 5 créditos atribuídos no momento da criação do documento `/users/{uid}`.
- **Autoridade Centralizada**: O cliente **nunca** deduz créditos diretamente. O endpoint `/api/scan` é o único responsável por verificar se `credits >= 1` e debitar o valor.
- **Prevenção de Condições de Corrida (Race Conditions)**: Implementado controle atômico por UID de usuário com bloqueio de concorrência (`acquireUidLock`). Se um usuário com apenas 1 crédito disparar 5 requisições simultâneas, exatamente uma requisição é processada com sucesso e as outras 4 são imediatamente rejeitadas com HTTP 402.
- **Sincronização com o Frontend**: O backend retorna `remainingCredits` no corpo da resposta HTTP 200, e o método `authService.syncRemainingCredits()` atualiza o estado da interface instantaneamente.
- **Comportamento em Falhas de Inferência**: O débito atômico na memória do backend ocorre previamente à chamada ao Hugging Face. Caso ocorra erro de rede ou indisponibilidade da IA (500, 502, 503), o cliente web **não** atualiza o saldo exibido, preservando a experiência do usuário, pois `syncRemainingCredits()` só é invocado quando `response.ok && data.success`.

---

## 9. Inventário e Despensa Virtual

O inventário armazena o estoque alimentar ativo do usuário:

- **Categorias Suportadas (8 padrão)**:
  1. `vegetables` (Legumes & Verduras)
  2. `fruits` (Frutas)
  3. `dairy` (Laticínios)
  4. `proteins` (Proteínas e Ovos)
  5. `drinks` (Bebidas)
  6. `pantry` (Despensa e Grãos)
  7. `condiments` (Temperos & Molhos)
  8. `bakery` (Pães & Massas)
- **Locais de Armazenamento**: Geladeira, Freezer, Gaveta de legumes, Porta e Despensa.
- **Unidades Suportadas**: Unidades (`un`), Quilogramas (`kg`), Gramas (`g`), Litros (`L`), Mililitros (`ml`), Pacotes (`pct`) e Fatias (`fatias`).
- **Consolidação em Lote (`consolidateInventoryDuplicates`)**: Função que agrupa itens com o mesmo nome e categoria, somando as quantidades e preservando a data de validade mais próxima via `writeBatch(db)`.

---

## 10. Controle de Data de Validade

O utilitário `expirationHelper.ts` calcula a diferença em dias corridos utilizando partes de calendário local (ano, mês, dia), eliminando desvios provocados por fuso horário UTC:

- **Cálculo da Diferença (`diffDays = targetCalendar - todayCalendar`)**:
  - `diffDays > 3`: **Estado Normal** — Badge neutro com contorno de apoio ("Faltam X dias para vencer").
  - `diffDays === 3`: **Estado de Atenção** — Badge âmbar suave ("Faltam 3 dias para vencer").
  - `diffDays === 2`: **Estado de Atenção Forte** — Badge âmbar vivo ("Falta 2 dias para vencer").
  - `diffDays === 1`: **Estado de Alerta** — Badge laranja intenso ("Falta 1 dia para vencer").
  - `diffDays === 0`: **Vence Hoje** — Badge vermelho de alto contraste ("Vence hoje").
  - `diffDays < 0`: **Vencido** — Badge vermelho de alto contraste ("Vencido há X dias").

---

## 11. Motor de Matching de Receitas

O motor de recomendação culinária cruza os ingredientes do inventário do usuário com as receitas cadastradas:

- **Normalização e Sinônimos**: O helper `normalizeIngredientName()` remove artigos, acentuações e termos secundários (ex.: "queijo mussarela ralado" cruza com "queijo").
- **Destaque Visual de Ingredientes**:
  - Verde (`matchedIngredients`): Alimentos já existentes na geladeira do usuário.
  - Vermelho (`missingIngredients`): Ingredientes faltantes necessários para o preparo.
- **Selo "Pronta para Cozinhar"**: Atribuído automaticamente a receitas que atingem 100% de compatibilidade (`matchPercentage === 100` ou `missingIngredients.length === 0`).
- **Filtros Culinários Suportados**:
  - Restrições: Vegetariano, Vegano, Sem Glúten, Sem Lactose, Low Carb, Sem Frituras, Rico em Proteína.
  - Tempo de Preparo: Até 15 minutos, até 30 minutos ou qualquer duração.
  - Dificuldade: Fácil, Médio ou Avançado.

---

## 12. Lista de Mercado e Transferência para a Geladeira

O módulo `shoppingListService.ts` gerencia as compras de mercado integrando planejamento e reabastecimento:

- **Cálculo Financeiro Preciso**: A função `calculateListTotal()` multiplica preço unitário por quantidade utilizando centavos inteiros (`Math.round(qty * price * 100) / 100`), prevenindo erros clássicos de arredondamento IEEE 754.
- **Checklist Interativo**: Marcar um item como comprado calcula o progresso percentual e o valor financeiro da compra em tempo real.
- **Exportação Formatada**: Gera texto legível com emojis inteligentes por alimento para compartilhamento via WhatsApp.
  *Exemplo de formato gerado:*
  ```text
  🛒 Lista de Mercado - 11/09/2026 - 10:00

  🥚 3 Ovos — R$ 6,00
  🍞 10 Pães — R$ 10,00
  🥛 2 Leite — R$ 9,00

  Total: R$ 25,00
  ```
- **Finalização da Compra com `WriteBatch`**: Ao tocar em "Finalizar Compra", os itens marcados como concluídos são convertidos em instâncias de `FoodItem` e gravados na subcoleção `/users/{uid}/inventory` através de um lote atômico do Firestore, garantindo que o reabastecimento seja concluído em uma única transação de rede.

---

## 13. Temporizador de Cozimento Persistente

O serviço `cookingTimerStorage.ts` implementa o temporizador com contagem baseada em tempo absoluto:

- **Sessão Baseada em Timestamps**: Ao iniciar um cozimento, o sistema calcula `endAt = Date.now() + (totalSeconds * 1000)`.
- **Persistência em `localStorage`**: Armazena a sessão sob a chave `geladeira_cooking_session_{userId}` apenas em eventos discretos (início, pausa, retomada e cancelamento), sem I/O repetitivo a cada segundo.
- **Recuperação Precisa pós-Reload**: Ao recarregar a aba ou reabrir o app, o método `restoreCookingSession()` compara `endAt` com `Date.now()`. Se o tempo expirou durante a ausência do usuário, a sessão é restaurada com 0 segundos e marcada como concluída (`isCompleted: true`).
- **Barra Flutuante (`FloatingCookingTimer`)**: Componente posicionado globalmente que acompanha a navegação entre todas as telas da aplicação.

---

## 14. Catálogo de Receitas

- **Origem do Catálogo**: Catálogo base local extraído e traduzido do TheMealDB e Wikibooks, complementado por receitas armazenadas dinamicamente no Firestore na coleção `/recipes`.
- **Deduplicação**: Chave canônica `canonicalKey` para garantir que variações nominais apontem para a mesma receita.
- **Enriquecimento Dietético**: O script de geração analisa ingredientes para marcar flags dietéticas automáticas (`vegetarian`, `vegan`, `hasLactose`, etc.).

---

## 15. Painel Administrativo

- **Acesso Restrito**: O componente `AdminView` só é exibido na navegação caso o usuário autenticado tenha confirmação em tempo real de registro na coleção `/admins/{uid}`.
- **Funcionalidades Administrativas**:
  - Catálogo de receitas com visualização de fotos pendentes ou atribuídas.
  - Filtros por categoria e busca textual por títulos e tags.
  - Modal de edição e upload de fotografias oficiais dos pratos.
- **Criação de Administradores**:
  > Conforme projetado, a coleção `/admins` possui escrita desativada no cliente (`allow write: if false;`). A promoção de administradores deve ser realizada exclusivamente via Console do Firebase ou Firebase Admin SDK.

---

## 16. Upload de Imagens

1. **Otimização no Cliente (`imageOptimizer.ts`)**:
   - Imagens são carregadas em um elemento HTML5 Canvas.
   - Redimensionamento proporcional para resolução máxima de 1200x1200px sem upscaling.
   - Compressão em formato WebP/JPEG com qualidade balanceada (82%), reduzindo arquivos de 10 MB para menos de 350 KB antes do tráfego de rede.
2. **Armazenamento no Cloudinary (`imageUploadService.ts`)**:
   - Utilizado para imagens de receitas da comunidade e catálogo.
   - Conexão via endpoint público `https://api.cloudinary.com/v1_1/vlqg76jp/image/upload`.
   - Utiliza o preset unsigned restrito `geladeira_recipe_images`.
   - Acompanhamento de upload byte a byte com timeout de 35 segundos.

---

## 17. Documentação do Guia Rápido (Tutorial Oficial)

O componente `QuickGuideModal.tsx` apresenta um tutorial interativo de 8 passos para orientar os novos usuários:

1. **Etapa 1 — Adicionar alimentos**: Apresenta as 8 categorias do inventário com ícones e exemplos claros, explicando o acompanhamento de validade com seus respectivos selos visuais cromáticos.
2. **Etapa 2 — Escaneie ou registre**: Fornece dicas de fotografia para o Scanner (boa iluminação, manter alimentos no enquadramento, retirar obstruções e fotografar grupos menores).
3. **Etapa 3 — Encontre receitas compatíveis**: Demonstra o motor de matching e a redução de desperdício alimentar.
4. **Etapa 4 — Use os filtros**: Detalha o uso de filtros por restrições dietéticas, tempo de preparo e dificuldade.
5. **Etapa 5 — Veja o que pode preparar**: Apresenta a porcentagem de ingredientes e o selo *"Pronta para cozinhar"*.
6. **Etapa 6 — Abra uma receita**: Explica os ingredientes destacados em verde (disponíveis) e vermelho (faltantes), além de introduzir o temporizador de preparo.
7. **Etapa 7 — Personalize seu perfil**: Orienta a configuração de foto, medidas corporais, porções habituais e preferências alimentares.
8. **Etapa 8 — Lista de Mercado Inteligente**: Ensina a criação de listas, controle financeiro em reais, checklist de compras, compartilhamento por cópia e a transferência automática dos produtos para a geladeira.

---

## 18. Matriz de Funcionalidades do Sistema

| Funcionalidade | Frontend | Backend | Firebase | Persistência | Segurança |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Autenticação** | Interface de Login/Cadastro | Não | Firebase Auth | Local + Nuvem | Senhas criptografadas, JWT |
| **Scanner por IA** | Captura & Otimização | `/api/scan` | App Check | Firestore (`scans`) | JWT, Rate Limit, Fila atômica |
| **Créditos** | Exibição de Saldo | Dedução Atômica | Firestore (`users`) | Firestore | Trava em `firestore.rules` |
| **Inventário** | Gestão & Filtros | Não | Firestore | Firestore (`inventory`) | `isOwner(userId)` |
| **Validade** | Badges & Alertas | Não | Firestore | Firestore | Fuso horário local puro |
| **Receitas** | Navegação & Busca | Não | Firestore (`recipes`) | Local + Firestore | Escrita restrita a Admin |
| **Matching** | Cálculo de Afinidade | Não | Não | Memória / Cache | Heurística no cliente |
| **Temporizador** | UI Flutuante & Modal | Não | Não | `localStorage` | Timestamps absolutos |
| **Lista de Mercado** | Checklist & Totais | Não | Firestore | Firestore (`shoppingLists`) | `isOwner(userId)`, WriteBatch |
| **Perfil** | Edição de Dados | Não | Firestore | Firestore (`users`) | Imutabilidade de créditos |
| **Painel Admin** | Catálogo & Fotos | Não | Firestore | Firestore (`admins`) | Whitelist `/admins/{uid}` |
| **Upload de Fotos** | Canvas Otimizador | Não | Storage / Cloudinary | Nuvem | MIME estrito, limite 10MB |

---

## 19. Matriz de Regras de Segurança

| Recurso | Autenticação Exigida | Autorização | App Check | Regra Aplicável | Observação |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **`/api/scan`** | Sim (Bearer JWT) | Usuário com créditos (`>= 1`) | Sim | Validação criptográfica do token | Rate limiting de 6 req/min por UID |
| **`/users/{userId}`** | Sim | `isOwner(userId)` | Opcional | `credits` e `isAdmin` imutáveis | Criação limita `credits <= 5` |
| **`/inventory/{id}`** | Sim | `isOwner(userId)` | Opcional | Leitura e escrita apenas pelo dono | Isolamento completo entre contas |
| **`/scans/{id}`** | Sim | `isOwner(userId)` | Opcional | Leitura e escrita apenas pelo dono | Histórico privado de análises |
| **`/shoppingLists`** | Sim | `isOwner(userId)` | Opcional | Leitura e escrita apenas pelo dono | Suporte a transações em lote |
| **`/recipes/{id}`** | Leitura: Não / Escrita: Sim | `isAdmin()` | Opcional | Leitura pública, escrita Admin | Modificação de catálogo culinário |
| **`/admins/{id}`** | Sim | Somente leitura | Opcional | `allow write: if false;` | Escrita bloqueada no cliente |
| **Firebase Storage** | Sim | `isOwner` ou `isAdmin` | Opcional | MIME `image/*`, máx. 10 MB | Avatares e imagens de escaneamento |
| **Cloudinary** | Não (Preset Unsigned) | Pública para upload | Não | Pasta e formatos restritos | Fotos de receitas do catálogo |

---

## 20. Matriz de Variáveis de Ambiente

| Variável | Tipo | Serviço Relacionado | Onde Configurar | Obrigatória |
| :--- | :---: | :--- | :--- | :---: |
| `HF_TOKEN` | **Secreta** | Hugging Face Router API | Backend Cloudflare / Netlify / `.env` | **Sim** |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` *(alias: `VITE_RECAPTCHA_SITE_KEY`)* | **Pública** | Firebase App Check | Variáveis de Frontend / `.env` | Recomendada |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | **Pública** | Firebase App Check | `.env.local` (apenas em dev) | Não |
| `ENFORCE_APP_CHECK` | **Secreta** | Backend `/api/scan` | Variáveis de Backend (Cloudflare/Netlify) | Não |
| `GEMINI_API_KEY` | **Secreta** | Google AI Studio | Secrets do AI Studio / Cloud Run | Não |
| `APP_URL` | **Pública** | Infraestrutura de Hospedagem | Injetado pela plataforma | Não |

---

## 21. Matriz de Tratamento de Erros

| Código / Status | Contexto | Causa Raiz | Comportamento da Aplicação |
| :--- | :--- | :--- | :--- |
| `AUTH_REQUIRED` (401) | Scanner / API | Usuário não autenticado ou token ausente. | Apresenta mensagem informativa e direciona ao login. |
| `AUTH_TOKEN_EXPIRED` (401) | Scanner / API | Token do Firebase expirou durante a sessão. | O SDK renova o token automaticamente ou solicita login. |
| `INSUFFICIENT_CREDITS` (402) | Scanner / API | Saldo de créditos do usuário é 0. | Bloqueia a requisição e abre o modal de créditos. |
| `APP_CHECK_MISSING` (403) | Scanner / API | App Check está habilitado mas token não foi enviado. | Bloqueia a requisição como cliente não confiável. |
| `RATE_LIMIT_EXCEEDED` (429) | Scanner / API | Mais de 6 requisições emitidas em menos de 1 minuto. | Exibe aviso com contador baseado no cabeçalho `Retry-After`. |
| `MODEL_BUSY` (503) | Scanner / API | Hugging Face com alta demanda momentânea. | Tenta reenvio com backoff ou alerta o usuário para tentar em instantes. |
| `INVALID_IMAGE_FORMAT` (400) | Scanner / Upload | Arquivo não é JPEG/PNG/WebP ou está corrompido. | Exibe alerta amigável solicitando formato suportado. |
| `STORAGE_SIZE_EXCEEDED` (400) | Upload / Storage | Imagem bruta excede o limite máximo de 10 MB. | Otimizador redimensiona antes do upload para evitar falha. |
