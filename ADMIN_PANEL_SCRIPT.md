# 🎛️ SCRIPT PARA PAINEL ADMINISTRATIVO

Cole este prompt em um novo projeto Lovable para criar o painel admin:

---

## PROMPT INICIAL PARA NOVO PROJETO LOVABLE:

```
Crie um painel administrativo completo para gerenciar usuários de um app de loteria.

## Configurações de Conexão (IMPORTANTES!)

O painel deve conectar ao mesmo backend do app principal:
- Supabase URL: https://rjoqsudeogwcrvkekkhy.supabase.co
- Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb3FzdWRlb2d3Y3J2a2Vra2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODg1ODIsImV4cCI6MjA4Mjg2NDU4Mn0.2oCySr0AseAU8yppEPEo5bTmsoYG3_xz4jKqslpL0bQ

## Estrutura do Banco (já existente)

### Tabela: user_roles
- id: uuid
- user_id: uuid (referência auth.users)
- role: app_role ('admin' | 'user')
- created_at: timestamp

### Tabela: subscriptions
- id: uuid
- user_id: uuid (único)
- status: subscription_status ('active' | 'expired' | 'cancelled' | 'pending')
- platform: text ('hotmart' | 'kiwify' | 'manual')
- external_id: text
- plan_name: text
- started_at: timestamp
- expires_at: timestamp
- cancelled_at: timestamp

### Tabela: user_sessions
- id: uuid
- user_id: uuid
- session_token: text
- device_info: text
- ip_address: text
- created_at: timestamp
- last_seen_at: timestamp
- is_active: boolean

### Tabela: profiles
- id: uuid
- user_id: uuid
- full_name: text
- avatar_url: text

## Edge Functions Disponíveis

Base URL: https://rjoqsudeogwcrvkekkhy.supabase.co/functions/v1

### GET /admin-api/users
Lista todos os usuários com perfis, assinaturas e sessões.
Requer: Authorization Bearer token de admin

### GET /admin-api/stats
Estatísticas do dashboard (total usuários, assinaturas ativas, etc.)

### POST /admin-api/subscription
Atualizar assinatura de um usuário.
Body: { target_user_id, status, expires_at?, plan_name? }

### POST /admin-api/block-user
Bloqueia usuário (cancela assinatura e sessões).
Body: { target_user_id }

### POST /admin-api/force-logout
Força logout de todas as sessões do usuário.
Body: { target_user_id }

## Funcionalidades do Painel

1. **Login Admin**
   - Tela de login que verifica se usuário tem role 'admin'
   - Redireciona para dashboard se autenticado

2. **Dashboard Principal**
   - Cards com estatísticas: Total usuários, Assinaturas ativas, Sessões ativas, Expiradas
   - Gráfico de novos usuários por dia/mês

3. **Lista de Usuários**
   - Tabela com: Email, Nome, Status assinatura, Sessões ativas, Último acesso
   - Filtros: Todos, Ativos, Expirados, Pendentes
   - Busca por email/nome
   - Ordenação por data

4. **Ações por Usuário**
   - 🟢 Liberar acesso (ativar assinatura por 30 dias)
   - 🔴 Bloquear acesso (cancelar assinatura)
   - 🔄 Renovar assinatura
   - 📅 Definir data de expiração
   - 🚪 Forçar logout de todos os dispositivos
   - 👁️ Ver detalhes (sessões, histórico)

5. **Sessões em Tempo Real**
   - Lista de quem está online agora
   - Dispositivo e IP
   - Tempo de última atividade

## Design

- Tema escuro profissional
- Sidebar com navegação
- Cores: Azul para ações, Vermelho para bloqueio, Verde para ativo
- Tabelas responsivas
- Modais para confirmação de ações

## Autenticação

Na inicialização, verificar se o usuário logado tem role 'admin' na tabela user_roles.
Se não for admin, mostrar mensagem de acesso negado.

## Importante

- Todas as chamadas à API devem incluir o token de autenticação
- Usar realtime para atualizar lista de sessões
- Confirmar antes de ações destrutivas (bloquear, logout)
```

---

## CONFIGURAR ADMIN

Depois de criar o projeto admin, você precisa se definir como admin.

### Passo 1: Descubra seu user_id
Faça login no app principal e veja no console do navegador ou use este SQL:

```sql
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
```

### Passo 2: Adicione seu role de admin
Execute este SQL no backend (Cloud View > Run SQL):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin');
```

---

## URLs DOS WEBHOOKS

Configure estas URLs na Hotmart/Kiwify:

**Hotmart:**
https://rjoqsudeogwcrvkekkhy.supabase.co/functions/v1/hotmart-webhook

**Kiwify:**
https://rjoqsudeogwcrvkekkhy.supabase.co/functions/v1/kiwify-webhook

---

## FLUXO COMPLETO

1. Cliente compra na Hotmart/Kiwify
2. Webhook ativa assinatura automaticamente (se email já cadastrado)
3. Cliente faz login no app → tem acesso
4. Admin pode ver tudo no painel
5. Se assinatura expira/cancela → cliente perde acesso
6. Se compartilhar login → segunda sessão desconecta a primeira
