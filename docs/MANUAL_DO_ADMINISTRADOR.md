# Manual Operacional do Administrador — Geladeira Inteligente

**Projeto:** Geladeira Inteligente  
**Documento:** Manual de Operação e Administração do Sistema  
**Versão:** 1.0.0 (Release Candidate)  

---

## 1. Objetivo do Manual

Este manual destina-se aos operadores, desenvolvedores e administradores de produto responsáveis pela sustentação, gestão de catálogo culinário, monitoramento operacional e segurança do ecossistema **Geladeira Inteligente**.

---

## 2. O Papel do Administrador

O administrador atua na manutenção da integridade do ecossistema e na garantia da melhor experiência ao usuário final:

### Responsabilidades
- **Gestão do Catálogo de Receitas**: Curadoria de receitas, adição e substituição de fotografias de pratos prontos.
- **Gestão de Acessos Críticos**: Concessão e revogação de acessos administrativos de forma restrita e auditável.
- **Monitoramento do Scanner por IA**: Acompanhamento da disponibilidade da Hugging Face Router API, controle de cotas e rotação de credenciais.
- **Auditoria de Segurança**: Monitoramento de bloqueios de App Check e validação periódica de regras no Firestore e Storage.

### O que o Administrador NÃO Faz
- **Não altera o código-fonte em tempo de execução**: Parâmetros de negócio e regras de segurança são declarativas.
- **Não manipula saldos de créditos de forma desordenada**: O consumo de créditos é autoritativo pelo backend.
- **Não visualiza inventários ou listas privadas**: Os dados pessoais e hábitos alimentares dos usuários finais são isolados criptograficamente pelas regras do Firestore.

---

## 3. Concessão de Acesso Administrativo

> 🛡️ **REGRA ABSOLUTA DE SEGURANÇA:**  
> *"Conforme projeto de segurança, a concessão de perfil administrativo NÃO existe no frontend."*  
> Nenhuma tela de cadastro, botão na interface ou formulário web permite conceder permissões de administrador. Essa trava impede que invasores ou usuários comuns promovam contas sem passar pela infraestrutura do Firebase.

### Procedimento Passo a Passo para Tornar um Usuário Administrador

1. **Obter o Identificador Único (UID) do Usuário**:
   - Acesse o [Console do Firebase](https://console.firebase.google.com/).
   - Selecione o projeto `ai-studio-applet-webapp-1a826`.
   - Navegue até **Authentication** > aba **Users**.
   - Localize o usuário pelo e-mail e copie a sequência alfanumérica da coluna **User UID** (ex.: `k8sD92mKlP0qw12...`).

2. **Registrar o Usuário na Coleção de Administradores**:
   - No menu lateral do Firebase Console, clique em **Firestore Database**.
   - *(Importante: Certifique-se de selecionar a base de dados do projeto: `ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5` ou a base ativa)*.
   - Localize a coleção `/admins`. Se ela ainda não existir no ambiente, clique em **Start collection**, informe o ID da coleção como `admins`.
   - Clique em **Add document** (Adicionar documento).
   - No campo **Document ID**, **COLE EXATAMENTE O UID DO USUÁRIO** obtido no passo 1.
   - Adicione os seguintes campos informativos:
     - `role` (string): `"admin"`
     - `assignedAt` (timestamp): selecione o timestamp atual
     - `assignedBy` (string): e-mail do administrador responsável
   - Clique em **Save**.

3. **Atualizar a Flag no Perfil do Usuário (Opcional, para consistência imediata de interface)**:
   - No Firestore, navegue até `/users/{UID}`.
   - No campo `isAdmin`, defina o valor booleano como `true`.

4. **Instruir o Usuário a Recarregar a Aplicação**:
   - Para que o observador de autenticação atualize o estado local, solicite ao usuário recarregar o navegador (`F5` ou `Ctrl+R`). O menu de navegação inferior exibirá imediatamente o ícone de escudo **Admin**.

### Procedimento para Revogar Acesso Administrativo
1. Acesse **Firestore Database** > coleção `/admins`.
2. Localize o documento cujo ID corresponde ao UID do usuário que perderá o acesso.
3. Clique nos três pontinhos laterais e selecione **Delete document** (Excluir documento).
4. *(Recomendado)* Na coleção `/users/{UID}`, altere o campo `isAdmin` para `false`.
5. A revogação é instantânea no nível do banco de dados: quaisquer tentativas de escrita no catálogo de receitas serão imediatamente bloqueadas pelas regras de segurança (`allow write: if isAdmin();`).

---

## 4. O Painel Administrativo no Aplicativo (`AdminView`)

Quando um usuário credenciado faz login, a barra de navegação espacial exibe o botão **Admin**:

- **Visão Geral**: Apresenta contadores de receitas totais, receitas com foto associada e receitas pendentes de imagem.
- **Barra de Busca e Filtros**:
  - Busca textual em tempo real por título da receita, ingredientes ou tags.
  - Filtro por status de foto: *Todas as receitas*, *Sem foto* ou *Com foto*.
  - Filtro seletor por categoria culinária (Massas, Sobremesas, Saladas, etc.).
- **Catálogo Visual**: Exibição em cards com título, tempo de preparo, dificuldade e botão de gerenciamento visual.

---

## 5. Gerenciamento de Imagens de Receitas

A atribuição de imagens oficiais às receitas é executada diretamente pelo painel:

1. **Abrir o Modal de Edição**:
   - Localize a receita no catálogo e clique no botão **Editar Foto** (ícone de câmera).
2. **Selecionar ou Capturar Imagem**:
   - Arraste uma foto ou clique na área de upload para selecionar um arquivo (`JPEG`, `PNG` ou `WebP`).
   - O otimizador no navegador comprime e redimensiona a foto mantendo alta nitidez visual sem sobrecarregar o tráfego de dados.
3. **Envio via Cloudinary**:
   - A aplicação envia o arquivo diretamente ao serviço Cloudinary utilizando o preset restrito `geladeira_recipe_images`.
   - A barra de progresso visual exibe a evolução percentual da transmissão.
4. **Persistência no Firestore**:
   - Ao concluir o upload, o serviço grava a nova URL segura no documento `/recipes/{recipeId}` do Firestore, atualizando também o campo `updatedAt`.
   - A nova imagem passa a ser exibida instantaneamente para todos os usuários do aplicativo.

---

## 6. Monitoramento e Manutenção da IA (Scanner)

O backend do Scanner depende da integração com a Hugging Face Router API:

### 6.1 Token de Autenticação (`HF_TOKEN`)
- O token Bearer deve possuir permissões de inferência de modelos.
- **Onde Configurar**:
  - **Cloudflare Pages**: Acesse o painel da Cloudflare > selecione o projeto Pages > **Settings** > **Environment variables** > crie a variável de produção e preview `HF_TOKEN`.
  - **Netlify**: Acesse o site no Netlify > **Site configuration** > **Environment variables** > adicione `HF_TOKEN`.
- **Rotação de Credenciais**:
  1. Gere um novo token no portal da Hugging Face (`Settings` > `Access Tokens`).
  2. Atualize o valor de `HF_TOKEN` no painel de controle do Cloudflare/Netlify.
  3. Realize um novo deploy ou reinicie a função para aplicar a alteração imediatamente.

### 6.2 Modelo de Visão Ativo
- Modelo em produção: `google/gemma-3-4b-it:fastest` via endpoint `https://router.huggingface.co/v1/chat/completions`.
- O payload utiliza o parâmetro `response_format` com JSON Schema estrito, garantindo que o modelo retorne apenas JSON sintaticamente válido.

---

## 7. Gestão de Segurança e Regras de Produção

### 7.1 Implantação e Auditoria de Regras
Sempre que houver alteração nas políticas de dados, realize o deploy das regras atualizadas via Firebase CLI:
```bash
# Implantação de regras de banco e storage
firebase deploy --only firestore:rules,storage
```

### 7.2 Configuração do Firebase App Check
1. Acesse o **Firebase Console** > **App Check**.
2. Na aba **Apps**, selecione a aplicação web registrada.
3. Vincule o provedor **reCAPTCHA Enterprise** inserindo a chave do site cadastrada no Google Cloud Console.
4. Na aba **APIs**, ative o monitoramento do **Cloud Firestore** e do **Cloud Storage**.
5. **Boas Práticas de Ativação**:
   - Mantenha os serviços inicialmente em modo **Monitoramento** (Audit Mode) durante os primeiros dias para verificar a taxa de requisições válidas.
   - Ative a aplicação forçada (**Enforcement**) somente após confirmar que clientes legítimos não enfrentam rejeições indevidas.

### 7.3 Checklist Pré-Publicação: Validação de Project ID no Backend (Concluído)
> ✅ **CONFERÊNCIA DE IDENTIFICADORES**:  
> 1. O `FIREBASE_PROJECT_ID` no backend (`functions/_ai/security.ts`) está configurado como `ai-studio-applet-webapp-1a826`, perfeitamente alinhado ao identificador do projeto emissor de autenticação no Firebase Auth.
> 2. O banco NoSQL Cloud Firestore opera na base dedicada `ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5`, garantindo integridade de persistência e validação sem conflitos.

---

## 8. Guia de Troubleshooting / Resolução de Problemas

| Sintoma / Erro | Possível Causa | Ação Recomendada |
| :--- | :--- | :--- |
| **Login com Google fecha a janela sem autenticar** | O domínio da aplicação não está listado nos domínios autorizados do Firebase Auth. | Acesse **Firebase Console** > **Authentication** > **Settings** > **Authorized domains** e adicione o domínio atual da aplicação (ex.: `localhost`, `*.pages.dev`, `*.netlify.app`). |
| **Scanner retorna erro 401 (AUTH_REQUIRED)** | O usuário tentou escanear deslogado ou o token JWT de autenticação expirou. | Solicite ao usuário realizar logout e login novamente para renovar as credenciais da sessão. |
| **Scanner retorna erro 401 (AUTH_TOKEN_INVALID_ISSUER ou AUDIENCE)** | Token emitido por projeto diferente do configurado no backend (`ai-studio-applet-webapp-1a826`). | Certifique-se de que a aplicação cliente e o backend utilizem o mesmo projeto Firebase (`ai-studio-applet-webapp-1a826`). |
| **Scanner retorna erro 402 (INSUFFICIENT_CREDITS)** | O usuário consumiu todos os créditos disponíveis. | Verifique se a cota do usuário expirou. Um administrador com acesso ao Firestore pode incrementar manualmente o campo `credits` em `/users/{uid}`. |
| **Scanner retorna erro 403 (APP_CHECK_INVALID)** | A requisição partiu de um ambiente não autenticado ou com token reCAPTCHA inválido. | Verifique se o domínio está cadastrado no reCAPTCHA Enterprise. Em ambiente de testes, utilize a variável `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`. |
| **Scanner retorna erro 429 (RATE_LIMIT_EXCEEDED)** | Mais de 6 requisições foram disparadas em menos de 60 segundos pelo mesmo usuário. | Aguarde o tempo indicado no contador visual na tela (baseado no cabeçalho `Retry-After`). |
| **Scanner retorna erro 503 (MODEL_BUSY)** | O cluster de inferência da Hugging Face está com alta latência momentânea. | A aplicação tentará reenvio automático. Caso persista, verifique a página de status da Hugging Face. |
| **Usuário recém-adicionado não vê a aba Admin** | A sessão local ainda não recarregou os dados do Firestore. | Solicite ao usuário recarregar a página (`F5`). Se persistir, confira se o ID do documento em `/admins` é exatamente o UID alfanumérico do Auth. |
| **Falha ao enviar foto de receita no painel** | Conexão com o Cloudinary indisponível ou rede bloqueando o upload. | Verifique a conexão do operador e se o preset unsigned `geladeira_recipe_images` continua ativo no painel do Cloudinary. |

---

## 9. Boas Práticas Operacionais e Rotinas de Backup

1. **Backups Periódicos do Cloud Firestore**:
   - Recomenda-se configurar uma rotina automática de exportação gerenciada do Firestore para um bucket do Google Cloud Storage através de uma Cloud Function agendada ou Cloud Scheduler:
     ```bash
     gcloud firestore export gs://seu-bucket-de-backup/backups-semanais
     ```
2. **Monitoramento de Logs**:
   - No painel da Cloudflare ou Netlify, filtre os logs do endpoint `/api/scan` buscando padrões de repetição de erros 429 ou 503.
3. **Auditoria de Custos**:
   - O uso de modelos abertos hospedados na infraestrutura do Hugging Face Router reduz significativamente os custos em comparação a APIs proprietárias de grande porte, mantendo o consumo previsível.
