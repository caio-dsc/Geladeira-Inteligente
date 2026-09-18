# Documentação Técnica — Geladeira Inteligente

## 1. Finalidade

Este documento registra a arquitetura e os principais fluxos técnicos da Geladeira Inteligente.

O objetivo é facilitar manutenção, transferência do projeto e futuras alterações sem depender do contexto de desenvolvimento original.

O `README.md` apresenta o produto de forma resumida. Este documento trata dos detalhes técnicos.

---

## 2. Visão geral da aplicação

A aplicação é uma SPA em React/TypeScript com três níveis de acesso:

- **Free**
- **Premium**
- **Admin**

As áreas principais são:

1. Minha Geladeira
2. Scan com IA
3. Lista de Compras
4. Receitas
5. Perfil
6. Painel Administrativo

A regra comercial atual é simples: o Free mantém a gestão manual da geladeira; o Premium acrescenta os recursos inteligentes; o Admin acrescenta as ferramentas de administração.

---

## 3. Matriz de acesso

| Recurso | Free | Premium | Admin |
|---|:---:|:---:|:---:|
| Minha Geladeira | Sim | Sim | Sim |
| Cadastro manual | Sim | Sim | Sim |
| Quantidade e validade | Sim | Sim | Sim |
| Busca e filtros | Sim | Sim | Sim |
| Organização da geladeira | Sim | Sim | Sim |
| Scan com IA | Não | Sim | Sim |
| Lista de Compras | Não | Sim | Sim |
| Receitas | Não | Sim | Sim |
| Painel Administrativo | Não | Não | Sim |

A diferenciação visual no frontend não substitui as verificações de autorização no backend.

---

## 4. Frontend

A interface possui componentes para navegação, dashboard, inventário, cadastro manual, planos, Scanner, compras, receitas, perfil e administração.

### Conta Free

A conta Free pode utilizar a Minha Geladeira normalmente, incluindo cadastro e edição manual dos alimentos.

As funções Premium permanecem visíveis como parte da navegação do produto, mas recebem indicação de bloqueio. Ao selecionar uma função bloqueada, o frontend abre o modal de planos no contexto do recurso escolhido.

As telas Premium também possuem proteção interna. O objetivo é evitar que uma conta Free utilize uma função apenas por acessar diretamente sua tela.

### Modal de planos

O conteúdo varia conforme a conta.

**Free**

- Meu plano
- Plano Premium

**Admin**

- Meu plano
- Plano Premium
- Admin

A aba Admin é exclusiva de contas administrativas.

---

## 5. Minha Geladeira

A Minha Geladeira é o núcleo do plano Free.

O inventário permite adicionar, editar, remover, pesquisar e filtrar alimentos.

Um item pode conter campos como:

```text
id
name
category
quantity
unit
state
location
confidence
expiryDate
selected
```

A nomenclatura definitiva deve seguir os tipos presentes no código do projeto.

A organização pode considerar categoria, localização/compartimento e estado do alimento.

---

## 6. Scan com IA

> **Componente estabilizado:** alterações de frontend que não estejam relacionadas ao Scan não devem modificar câmera, preparação da imagem, payload, Worker, modelo ou schema do reconhecimento.

### Fluxo

```text
Imagem
  │
  ▼
Frontend
  │
  ▼
Preparação da imagem
  │
  ▼
POST /api/scan
  │
  ├── Firebase Auth
  ├── Firebase App Check
  ├── Rate limit
  └── scanEnabled
  │
  ▼
Hugging Face Router
  │
  ▼
Google Gemma
  │
  ▼
JSON estruturado
  │
  ▼
Parser e validação
  │
  ▼
Inventário
```

### Modelo

```text
google/gemma-3-4b-it:fastest
```

O modelo não deve ser trocado em uma manutenção que não tenha como objetivo alterar a infraestrutura de IA.

### Endpoint

```text
POST /api/scan
```

### Responsabilidades do Worker

O Worker:

1. aceita somente `POST`;
2. valida o Firebase Authentication;
3. valida o Firebase App Check quando exigido;
4. aplica rate limiting;
5. verifica se o usuário possui `scanEnabled`;
6. valida a imagem recebida;
7. envia a solicitação ao Hugging Face Router;
8. repete a solicitação em erros transitórios;
9. devolve o resultado estruturado ao frontend.

### Tratamento de indisponibilidade

O fluxo atual considera, entre outros, os seguintes casos:

- HTTP 429;
- HTTP 503;
- modelo temporariamente ocupado.

O retry utiliza backoff exponencial e jitter.

---

## 7. Prompt e schema do reconhecimento

O Scan envia um prompt de detecção visual e solicita uma resposta estruturada.

O schema atual restringe as categorias a:

```text
vegetables
fruits
dairy
proteins
drinks
pantry
condiments
bakery
```

Os campos principais do retorno são:

```text
name
category
quantity
unit
```

O frontend faz uma segunda camada de validação antes de adicionar os resultados ao inventário.

Entre as validações estão:

- nome obrigatório;
- categoria permitida;
- remoção de termos genéricos;
- rejeição de objetos e elementos da cena;
- normalização da quantidade;
- normalização do estado;
- resolução da categoria;
- agrupamento de itens repetidos.

---

## 8. Lista de Compras

A Lista de Compras é Premium.

O fluxo permite:

- adicionar itens;
- informar quantidade;
- escolher unidade;
- informar preço unitário;
- calcular o total;
- filtrar por status;
- concluir itens;
- copiar a lista para a área de transferência;
- finalizar a compra;
- transferir os itens comprados para a Minha Geladeira.

Fluxo:

```text
Lista de Compras
      │
      ├── Pendentes
      └── Concluídos
              │
              ▼
       Finalizar compra
              │
              ▼
       Minha Geladeira
```

---

## 9. Receitas

O catálogo de receitas é Premium.

Os recursos existentes incluem:

- catálogo;
- busca;
- categorias;
- filtros;
- detalhes da receita;
- ingredientes;
- disponibilidade dos ingredientes;
- matching com o inventário.

O Admin também pode gerenciar o catálogo e as fotos oficiais das receitas.

---

## 10. Firebase

### Authentication

Responsável pela autenticação das contas.

Quando necessário, o frontend obtém o ID Token do usuário autenticado para chamadas protegidas.

### Firestore

Armazena os dados persistentes utilizados pela aplicação, incluindo dados de usuários e inventário.

A estrutura das coleções deve ser considerada conforme o código atualmente implantado.

### App Check

O App Check adiciona uma camada de integridade à aplicação.

O Worker utiliza a configuração:

```text
ENFORCE_APP_CHECK
```

Quando a exigência está habilitada, uma requisição sem App Check válido é rejeitada.

---

## 11. Controle de usuários

As contas são classificadas como:

```text
Free
Premium
Admin
```

A mudança de plano é uma operação administrativa.

Uma conta Free não deve conseguir alterar sua própria permissão ou promover-se a Admin.

O Painel Administrativo é responsável pelas alterações comerciais previstas no produto.

---

## 12. Painel Administrativo

O Painel Administrativo é exclusivo do Admin.

As operações atualmente previstas incluem:

- visualizar usuários;
- pesquisar usuários;
- transformar Free em Premium;
- revogar Premium;
- pré-cadastrar e-mails de clientes pagos;
- administrar o catálogo de receitas;
- gerenciar fotos oficiais;
- controlar o acesso ao Scan quando essa função estiver disponível.

Fluxo de alteração de plano:

```text
Free
 │
 │ liberação pelo Admin
 ▼
Premium
 │
 │ revogação pelo Admin
 ▼
Free
```

---

## 13. Segurança

Segredos não devem ser colocados no frontend.

Isso inclui:

- `HF_TOKEN`;
- credenciais privadas;
- chaves secretas;
- tokens administrativos;
- qualquer informação capaz de contornar autorização.

Chamadas que dependem de segredo devem passar pelo backend/Worker.

As operações sensíveis devem ser autorizadas no servidor, independentemente do que estiver sendo exibido ou ocultado pelo frontend.

---

## 14. Configuração

O Worker utiliza, entre outras configurações:

```text
HF_TOKEN
ENFORCE_APP_CHECK
```

As configurações do Firebase devem ser fornecidas pelo ambiente apropriado do projeto.

Os valores reais de tokens e credenciais devem ser configurados no ambiente de execução, não no código-fonte público.

---

## 15. Desenvolvimento e build

Instalação:

```bash
npm install
```

Servidor local:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Os scripts de lint e testes existentes no projeto também devem ser executados antes de uma publicação.

---

## 16. Checklist técnico

### Frontend

- [ ] Login e cadastro
- [ ] Minha Geladeira
- [ ] Cadastro manual
- [ ] Quantidades
- [ ] Validade
- [ ] Busca e filtros
- [ ] Modal Free
- [ ] Modal Premium
- [ ] Modal Admin
- [ ] Bloqueios do Free
- [ ] Scan
- [ ] Lista de Compras
- [ ] Receitas
- [ ] Perfil
- [ ] Painel Administrativo
- [ ] Desktop
- [ ] Mobile

### Backend

- [ ] Firebase Authentication
- [ ] App Check
- [ ] Rate limiting
- [ ] `scanEnabled`
- [ ] `/api/scan`
- [ ] Hugging Face Router
- [ ] Gemma
- [ ] Retry
- [ ] JSON estruturado

### Segurança

- [ ] Segredos fora do frontend
- [ ] Regras do Firestore revisadas
- [ ] Regras de Storage revisadas, quando aplicável
- [ ] Autorização administrativa
- [ ] App Check
- [ ] Rate limiting

### Produção

- [ ] Build
- [ ] Lint
- [ ] Testes disponíveis
- [ ] Variáveis de ambiente
- [ ] Firebase
- [ ] Backend/Worker
- [ ] Domínio de produção

---

## 17. Diretrizes de manutenção

O projeto possui várias partes integradas. Alterações futuras devem ser pequenas e verificadas antes de serem incorporadas.

### Alterações de frontend

Quando a tarefa for visual ou relacionada aos planos, não modificar o funcionamento do Scan.

Depois da alteração:

1. testar Free;
2. testar Premium;
3. testar Admin;
4. testar desktop;
5. testar mobile;
6. executar o build.

### Alterações no Scan

Só alterar o Scan quando a tarefa for realmente relacionada ao reconhecimento.

Depois da alteração, verificar:

1. imagem real;
2. resposta estruturada;
3. parsing;
4. erros 401, 403, 429 e 503;
5. timeout;
6. inserção dos resultados no inventário.

### Regra geral

Não substituir uma proteção de backend por uma simples ocultação no frontend.

---

## 18. Entrega e transferência

Para transferir o projeto, a documentação principal é:

```text
README.md
DOCUMENTACAO_DO_SISTEMA.md
```

O código-fonte e os arquivos de configuração necessários devem acompanhar a entrega.

Tokens e credenciais devem ser configurados no novo ambiente por um canal seguro. Eles não devem ser incorporados ao repositório.

---

## 19. Fonte de verdade

A documentação deve acompanhar o código implantado.

Quando houver divergência:

1. conferir o código;
2. conferir a configuração do ambiente;
3. conferir as regras do Firebase;
4. confirmar o comportamento em execução;
5. atualizar a documentação.

Isso evita que uma descrição antiga seja tratada como comportamento atual do sistema.
