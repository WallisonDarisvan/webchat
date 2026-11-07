# Webchat de Vendas Humanizado com IA & Painel Administrativo

Aplicação web completa e pronta para produção, construída com **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL** e **Server-Sent Events (SSE)**.

Projetada com foco em **alta conversão de vendas diretas**, simulando um atendente humano real no estilo WhatsApp Web, com geração de PIX interativo e liberação segura do produto via Webhook de pagamento.

---

## 🚀 Principais Funcionalidades

### 1. Interface de Chat Humanizada (`/` ou `/chat`)
- **Identificação Inicial com Persistência:** Modal de boas-vindas solicitando apenas o nome do visitante no primeiro acesso. Gera um `device_id` (UUIDv4) salvo em `localStorage` e cookies. Ao revisitar, recupera histórico e nome instantaneamente.
- **Rastreabilidade e Auditoria:** Extração automática de IP do cliente (compatível com proxies reversos, Cloudflare `CF-Connecting-IP`, `X-Forwarded-For`) e `User-Agent`.
- **Experiência Visual WhatsApp / Telegram:**
  - Header com foto/avatar do consultor, selo de verificado e indicador "Online agora".
  - Balões com formatação de links, horários e dupla marcação de envio/leitura.
  - Indicador de digitação animado ("*Gabriel está digitando...*") com 3 pontinhos pulsantes.
- **Mecanismos de Humanização Realistas:**
  - **Tempo de leitura e digitação composto:** Base de 2 a 3.5 segundos + `caracteres * 35ms` por mensagem.
  - **Multi-bubble (Múltiplos Balões):** Divide pensamentos longos ou parágrafos em 2 ou 3 balões enviados com intervalo natural de digitação.
  - **Respostas de Contingência:** Se a API de IA oscilar ou demorar mais de 10s, o atendente envia uma resposta humana de contingência sem travar a interface.

### 2. Fluxo de Venda & Checkout PIX
- **Gatilho de Compra:** A IA conduz o atendimento quebrando objeções. Ao detectar intenção de compra, emite internamente a tag `[GERAR_PAGAMENTO]`.
- **Card Interativo de Pagamento:**
  - Renderiza QR Code PIX em alta resolução gerado via biblioteca `qrcode`.
  - Botão de 1 clique para "Copiar Código PIX Copia e Cola" com feedback imediato.
  - Badge de status dinâmico (*Aguardando pagamento...*).
  - Botão de simulação Sandbox para testes imediatos no navegador.
- **🛡️ Regra de Segurança Estrita de Entrega:**
  - O link de entrega do produto **NUNCA** é exposto à IA e nem ao chat antes da confirmação do pagamento.
  - Apenas após a recepção do webhook com status aprovado (`status = paid`), o backend registra o pagamento e injeta uma mensagem do atendente no chat liberando o link oficial do produto em tempo real.

### 3. Painel Administrativo Completo (`/admin`)
- **Proteção de Acesso:** Autenticação via senha mestra (`ADMIN_PASSWORD`).
- **Cards de Configurações Dinâmicas (Persistidas no PostgreSQL):**
  1. **Provedor de IA:** Base URL (compatível com DeepSeek `https://api.deepseek.com`, OpenRouter, OpenAI), API Key com exibição alternável, Modelo e Slider de Temperatura (0.0 a 1.0). Inclui botão de **Testar Conexão com a IA**.
  2. **Prompt de Sistema:** Editor completo com instruções anti-robô (proibição de listas, bullets e cordialidades artificiais de SAC) e controle da tag `[GERAR_PAGAMENTO]`.
  3. **Produto & Pagamento:** Nome do produto, Preço (BRL), URL do Link de Entrega Protegido, Gateway de Pagamento e campo com botão de 1 clique para copiar a URL do Webhook: `/api/webhooks/payment`.
  4. **Auditoria & Vendas:** Métricas de conversas, mensagens trocadas, faturamento aprovado, histórico de pedidos PIX e sessões de visitantes.

---

## 🛠️ Pilha Tecnológica

- **Framework:** Next.js 15 (App Router, Server Actions, Standalone Output)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS & Lucide React
- **Banco de Dados & ORM:** PostgreSQL com Prisma ORM
- **Tempo Real:** Server-Sent Events (SSE) nativo com `ReadableStream`
- **QR Code & Pagamentos:** `qrcode`, PIX EMV Copia e Cola com cálculo CRC16
- **Containerização:** Docker Multi-stage & Docker Compose

---

## 📦 Estrutura de Diretórios

```
webchat/
├── prisma/
│   └── schema.prisma          # Modelagem PostgreSQL (ChatSession, ChatMessage, Order, AppConfig)
├── public/                    # Assets estáticos
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx       # Painel Administrativo Seguro com Abas
│   │   ├── api/
│   │   │   ├── admin/         # Rotas de Auth, Config, Testes e Estatísticas
│   │   │   ├── chat/          # Init, Messages e SSE Events (/api/chat/events)
│   │   │   └── webhooks/      # Receptor de Webhooks de Pagamento (/api/webhooks/payment)
│   │   ├── chat/              # Rota alternativa de chat
│   │   ├── globals.css        # Tailwind e estilos de mensageiro
│   │   ├── layout.tsx         # Layout base da aplicação
│   │   └── page.tsx           # Interface principal do Chat
│   ├── components/
│   │   └── chat/              # ChatHeader, ChatFeed, ChatBubble, ChatInput, PaymentCard, VisitorModal, TypingIndicator
│   └── lib/
│       ├── ai.ts              # Integração OpenAI / DeepSeek / Contingência
│       ├── config.ts          # Leitura e persistência de AppConfig
│       ├── events.ts          # Gerenciador SSE de eventos em tempo real
│       ├── humanizer.ts       # Cálculos de delay de leitura/digitação e Multi-bubble
│       ├── payment.ts         # Geração de PIX, pedidos e injeção do link de entrega
│       └── prisma.ts          # Instância singleton do Prisma Client
├── Dockerfile                 # Multi-stage otimizado para produção
├── docker-compose.yml         # Orquestração de App + PostgreSQL
├── .env.example               # Modelo de variáveis de ambiente
└── package.json
```

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie seu arquivo `.env` baseado no `.env.example`:

```env
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webchat?schema=public"

# Senha de Acesso ao Painel Admin (/admin)
ADMIN_PASSWORD="sua_senha_segura"

# URL Pública da Aplicação (Para geração de Webhooks)
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"

# Provedor de IA (Padrão: DeepSeek)
AI_BASE_URL="https://api.deepseek.com"
AI_API_KEY="sua_chave_deepseek_ou_openai"
AI_MODEL="deepseek-chat"
```

---

## 🚀 Como Executar Localmente

### 1. Instalar Dependências
```bash
npm install
```

### 2. Gerar Prisma Client & Sincronizar Banco
```bash
npx prisma generate
npx prisma db push
```

### 3. Iniciar em Desenvolvimento
```bash
npm run dev
```
Acesse:
- **Chat:** [http://localhost:3000](http://localhost:3000)
- **Painel Administrativo:** [http://localhost:3000/admin](http://localhost:3000/admin) (Senha padrão: `admin`)

---

## 🐳 Deploy com Docker & Docker Compose

Para subir a aplicação completa com PostgreSQL em container:

```bash
docker compose up -d --build
```

O container executa a aplicação em modo standalone do Next.js com usuário seguro não-root, healthcheck e persistência no volume do banco `pgdata`.

---

## ☁️ Deploy no Easypanel

1. Crie um novo projeto no Easypanel.
2. Adicione um serviço **PostgreSQL** para o banco de dados.
3. Adicione um serviço **App**:
   - **Source:** Seu repositório GitHub.
   - **Build Type:** Dockerfile.
   - **Port:** `3000`.
   - **Environment Variables:**
     - `DATABASE_URL`: URL de conexão fornecida pelo serviço PostgreSQL do Easypanel.
     - `ADMIN_PASSWORD`: Senha que você deseja para o painel `/admin`.
     - `NEXT_PUBLIC_APP_URL`: O domínio público configurado no Traefik/Easypanel (ex: `https://chat.seusite.com`).
     - `AI_API_KEY`: Sua chave de API da DeepSeek ou OpenAI.
4. Execute o deploy. O Easypanel cuidará do build multi-stage e do roteamento SSL automático via Traefik.

---

## 💳 Integração de Webhook de Pagamento

A URL do webhook para cadastrar no Mercado Pago, Asaas ou Gateway próprio é:
```
https://seu-dominio.com/api/webhooks/payment
```

### Payload Suportado para Aprovação:
O webhook aceita requisições POST nos seguintes formatos comuns:

```json
{
  "orderId": "UUID_DO_PEDIDO",
  "status": "paid"
}
```

Ou formato Asaas:
```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "externalReference": "UUID_DO_PEDIDO"
  }
}
```

Ao receber a confirmação:
1. O pedido é atualizado para `status: "paid"`.
2. O evento SSE `order_paid` é emitido instantaneamente para o navegador do cliente.
3. O atendente envia a mensagem de parabéns com o **Link Exclusivo de Entrega**.
