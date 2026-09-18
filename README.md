# Geladeira Inteligente

Sistema web para organizar alimentos, acompanhar o estoque da geladeira e reunir, em um só lugar, inventário, compras e receitas.

A aplicação possui três níveis de acesso:

- **Free** — gestão completa da Minha Geladeira e cadastro manual.
- **Premium** — recursos avançados, incluindo Scan com IA, Lista de Compras e Receitas.
- **Admin** — todos os recursos do Premium, além do Painel Administrativo.

## O que o produto oferece

A Geladeira Inteligente foi construída para resolver uma tarefa simples: saber o que há em casa e usar essa informação para organizar a alimentação.

### Minha Geladeira

Disponível para todos os planos:

- cadastro manual de alimentos;
- edição e remoção de itens;
- quantidade e unidade de medida;
- data de validade;
- estado do alimento, como fresco ou congelado;
- categorias;
- localização na geladeira, freezer, despensa e demais áreas disponíveis;
- busca e filtros.

A **Minha Geladeira é o núcleo do plano Free**. O usuário pode manter seu inventário completo sem precisar contratar o Premium.

### Scan com IA

Disponível no Premium e no Admin.

O usuário pode fotografar um alimento ou selecionar uma imagem. O sistema envia a imagem para o backend, que utiliza o modelo **Google Gemma** por meio do Hugging Face Router.

A resposta é estruturada para alimentar o inventário, com informações como:

- nome;
- categoria;
- quantidade;
- unidade;
- estado;
- localização;
- confiança;
- validade, quando identificável.

O Scanner funciona em dispositivos móveis e em computadores. A câmera, a preparação da imagem e o fluxo atual do Scan são componentes estabilizados do produto.

### Lista de Compras

Disponível no Premium e no Admin.

A lista permite:

- adicionar produtos;
- definir quantidade e unidade;
- informar preço unitário;
- acompanhar o valor total;
- filtrar itens pendentes e concluídos;
- marcar compras como concluídas;
- copiar a lista para a área de transferência;
- finalizar a compra e transferir os itens para a geladeira.

### Receitas

Disponível no Premium e no Admin.

O catálogo permite consultar receitas e utilizar os recursos de busca e filtros existentes. O sistema também relaciona ingredientes das receitas com os alimentos disponíveis no inventário.

### Painel Administrativo

Disponível somente para Admin.

O painel permite administrar usuários e conteúdos do sistema, incluindo:

- consultar e pesquisar usuários;
- liberar Premium para uma conta Free;
- revogar Premium e retornar a conta para Free;
- pré-cadastrar e-mails de clientes pagos;
- administrar o catálogo de receitas;
- gerenciar fotos oficiais das receitas;
- controlar o acesso ao Scan quando essa opção estiver disponível no painel.

---

## Planos

| Recurso | Free | Premium | Admin |
|---|:---:|:---:|:---:|
| Minha Geladeira | ✓ | ✓ | ✓ |
| Cadastro manual | ✓ | ✓ | ✓ |
| Quantidades e validade | ✓ | ✓ | ✓ |
| Busca e organização | ✓ | ✓ | ✓ |
| Scan com IA | — | ✓ | ✓ |
| Lista de Compras | — | ✓ | ✓ |
| Receitas | — | ✓ | ✓ |
| Painel Administrativo | — | — | ✓ |

No plano Free, os recursos Premium continuam visíveis na interface, mas são identificados como bloqueados. Ao selecionar um deles, o usuário recebe uma explicação sobre o Premium.

O modal de planos também muda de acordo com o nível da conta. Para Free, são exibidas as abas **Meu plano** e **Plano Premium**. Para Admin, existe ainda a aba **Admin**.

---

## Experiência em celular e computador

A interface é responsiva.

No celular, o aplicativo utiliza navegação inferior, controles adequados para toque e suporte à câmera para o Scan.

No computador, o usuário pode selecionar imagens dos arquivos e utilizar a interface de inventário, compras, receitas e administração em telas maiores.

O controle de acesso também é aplicado nas telas internas: uma conta Free não deve conseguir utilizar uma funcionalidade Premium apenas acessando sua tela diretamente.

---

## Arquitetura

Em linhas gerais:

```text
Usuário
   │
   ▼
Frontend React
   │
   ├── Minha Geladeira
   ├── Scan
   ├── Lista de Compras
   ├── Receitas
   ├── Perfil
   └── Painel Admin
   │
   ▼
Firebase / serviços da aplicação
   │
   ├── Authentication
   ├── Firestore
   ├── Storage
   └── App Check
   │
   ▼
Backend / Worker
   │
   ▼
Hugging Face Router
   │
   ▼
Google Gemma
```

## Tecnologias

A aplicação utiliza, entre outras, as seguintes tecnologias:

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase App Check
- Firebase Storage, quando utilizado pelo recurso
- Cloudflare Workers
- Hugging Face Router
- Google Gemma

Tokens, chaves privadas e credenciais de infraestrutura devem permanecer nas variáveis de ambiente e nunca no código do cliente.

## Reconhecimento de alimentos

O Scanner utiliza o modelo:

```text
google/gemma-3-4b-it:fastest
```

A saída do modelo é restringida por um schema estruturado. As categorias utilizadas pelo sistema são:

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

Depois da resposta da IA, o frontend ainda valida e normaliza os dados antes de colocá-los no inventário. Isso inclui validação de categoria, quantidade, estado, nomes genéricos e itens que não sejam alimentos.

## Segurança

O fluxo do Scan passa por:

1. Firebase Authentication;
2. Firebase App Check;
3. rate limiting;
4. verificação da permissão `scanEnabled`;
5. validação do payload;
6. chamada ao backend de IA.

O backend também trata respostas transitórias do provedor, como limites de requisição e indisponibilidade temporária do modelo.

---

## Desenvolvimento

### Requisitos

O projeto deve ser executado em um ambiente Node.js compatível com a configuração atual do repositório.

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

Antes de uma publicação, execute também os scripts de lint e testes disponíveis no projeto.

---

## Documentação

A documentação técnica detalhada está em:

- [`DOCUMENTACAO_DO_SISTEMA.md`](./DOCUMENTACAO_DO_SISTEMA.md)

O README foi mantido como documento de entrada. A documentação técnica concentra os detalhes de arquitetura, integrações, permissões, segurança e manutenção.

## Manutenção

Alguns componentes do produto estão estabilizados e não devem ser alterados sem uma tarefa específica.

Em especial, mudanças puramente visuais ou relacionadas aos planos não devem modificar:

- câmera;
- preparação da imagem;
- payload do Scan;
- Worker do Scan;
- modelo Gemma;
- schema de reconhecimento.

Sempre que uma mudança afetar permissões, testar os três níveis de conta. Para alterações de interface, testar também desktop e mobile.

## Checklist de entrega

### Produto

- [ ] Login e cadastro
- [ ] Minha Geladeira
- [ ] Cadastro manual
- [ ] Quantidades e validade
- [ ] Busca e filtros
- [ ] Planos Free, Premium e Admin
- [ ] Scan
- [ ] Lista de Compras
- [ ] Receitas
- [ ] Painel Administrativo
- [ ] Responsividade

### Produção

- [ ] Build concluído
- [ ] Lint/testes disponíveis executados
- [ ] Firebase configurado
- [ ] App Check configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Backend/Worker configurado
- [ ] Token de IA configurado no ambiente
- [ ] Regras de segurança revisadas

## Estrutura de documentação

```text
README.md
DOCUMENTACAO_DO_SISTEMA.md
```

O README apresenta o produto. A documentação técnica explica como ele funciona e como deve ser mantido.
