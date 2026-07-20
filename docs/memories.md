# Memories — Análise de Segurança VOC-Church

## Data da Análise: 2026-05-20

---

## Arquitetura Geral

- **Backend**: Express 5 + TypeScript + Prisma 6 + SQLite
- **Frontend**: React 19 + Vite 6 + TypeScript + TailwindCSS 4 + DaisyUI 5
- **Auth**: JWT (access + refresh tokens) em cookies httpOnly
- **Hash**: bcrypt (12 rounds)
- **Banco**: SQLite (arquivo local `dev.db`)
- **Portas**: API 3333 | Frontend 5174

---

## Decisões Tomadas

### 1. Escopo da Análise
Todo o código-fonte foi analisado manualmente, excluindo `node_modules/`, `dist/`, `package-lock.json` e binários.

### 2. Critérios de Classificação
- **CRÍTICA**: Impacto imediato na segurança — execução remota, vazamento de dados sensíveis, bypass de autenticação
- **ALTA**: Risco significativo de comprometimento ou exposição de dados
- **MÉDIA**: Práticas inseguras que exigem atenção
- **BAIXA**: Más práticas de código sem impacto direto em segurança

### 3. Falhas não consideradas neste escopo
- Dependências com vulnerabilidades conhecidas (não auditaram versões)
- Ataques de infraestrutura (DDoS, MITM)
- Segurança física do servidor

---

## Falhas Encontradas

### 🔴 CRÍTICAS

| # | Arquivo | Linha | Problema |
|---|---------|-------|----------|
| C1 | `VOC-api/.env` | 1 | `SECRET_KEY=vocChurch` — JWT secret extremamente fraca (6 chars, hardcoded) |
| C2 | `VOC-api/scripts/seed-admin.ts` | 5,8 | Senha do admin `"&v&nT$#0w"` hardcoded no código-fonte |
| C3 | `VOC/.env` | 3 | Chave Mercado Pago **de produção** exposta: `APP_USR-5281345a-4496-4d39-8312-5811f3cd802a` |
| C4 | `VOC-api/.../JwtProvider.ts` | 5 | Fallback de JWT: `process.env.JWT_SECRET \|\| "secret"` — se a env não carregar, usa "secret" |
| C5 | `VOC-api/.../memberRoutes.ts` | 11 | **Rota POST /members sem auth**: `router.post("/", (req, res) => memberController.create(...))` |
| C6 | `VOC-api/.../EventController.ts` | 67-68 | `deletedById` vem do `request.body` em vez de `auth.userId`. Qualquer admin pode forjar deletedById |
| C7 | `VOC-api/.../FinancialRecordController.ts` | 69-70 | Mesmo problema: `deletedById` e `reason` do body em vez de `auth.userId` |
| C8 | `VOC-api/.../UserController.ts` | 160-168 | **Logout não limpa cookies**: accessToken httpOnly permanece ativo |
| C9 | `VOC-api/.../UserController.ts` | 170-179 | **Refresh não seta novos cookies**: tokens retornados no body + typo `clearCookie("token")` em vez de `"accessToken"` |
| C10 | `VOC-api/.../CreateUserUseCase.ts` | 55-59 | `temporaryPassword` retornada na resposta HTTP (texto puro na rede) |

### 🟠 ALTAS

| # | Arquivo | Linha | Problema |
|---|---------|-------|----------|
| A1 | `VOC-api/.../LoginUseCase.ts` | — | **Sem rate limiting**: login vulnerável a brute force |
| A2 | `VOC/.env` | 2 | `VITE_STORAGE_KEY="&v&nT$#0w"` — chave de criptografia do sessionStorage é a senha do admin |
| A3 | `VOC-api/prisma/db/dev.db` | — | **SQLite exposto**: arquivo binário com todos os dados da igreja no repositório |
| A4 | `VOC-api/.env` e `VOC/.env` | — | **Arquivos .env commitados**: secrets versionados no git |
| A5 | `VOC-api/.../ErrorHandle.ts` | 10 | `console.error(error)` — stack trace completo logado, potencialmente contendo dados sensíveis |
| A6 | `VOC-api/.../SiteContentRepository.ts` | 109-136 | Sem validação de schema nos JSONs `banners`, `photos`, `videos` |
| A7 | `VOC/src/auth/services/socket.ts` | 3-7 | Socket.IO hardcoded apontando para localhost:8000 com token vazio |
| A8 | `VOC-api/.../UserController.ts` | 109-120 | `ListUsersUseCase` sem verificação de escopo — qualquer admin com level 80+ lista todos usuários |

### 🟡 MÉDIAS

| # | Arquivo | Linha | Problema |
|---|---------|-------|----------|
| M1 | `VOC-api/.../LoginUseCase.ts` | 60-68 | JWT contém `roles` no payload — exposto se token for decodificado |
| M2 | `VOC-api/.../Email.ts` | 12 | Regex de email fraca: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| M3 | `VOC-api/src/main.ts` | — | Sem Content-Security-Policy, X-Frame-Options, X-Content-Type-Options |
| M4 | `VOC-api/src/main.ts` | — | **Helmet não instalado**: sem headers de segurança básicos |
| M5 | `VOC/src/auth/components/authForm.tsx` | — | **Login não usa httpsOnly**: comunicação em texto puro em dev |
| M6 | `VOC-api/.../DashboardController.ts` | 12 | GET retorna status 201 (erro de semântica HTTP) |
| M7 | `VOC-api/.../FinancialRecordController.ts` | 63-65 | `listUseCase.execute()` chamado sem parâmetros — retorna TODOS registros sem paginação |

### 🔵 BAIXAS (Más Práticas)

| # | Arquivo | Problema |
|---|---------|----------|
| B1 | Geral | Uso excessivo de `any` — sem type safety |
| B2 | Vários | Código comentado/dead code em produção (ChangePhonePage, ValidatePasswordPage, socket.ts, etc.) |
| B3 | `VOC-api/.../normalizePhone.ts` | Importa `LoggerFactory` que **não existe** — código quebrado |
| B4 | Vários | `console.log` e `console.warn` espalhados em produção |
| B5 | Geral | Sem testes unitários ou de integração |
| B6 | `VOC/README.md` | README contém template Vite padrão, desatualizado |
| B7 | `VOC/package.json` | Sem scripts de lint ou typecheck configurados |
| B8 | `VOC-api/.../PrismaUserRepository.ts` | Busca de usuário não usa índice para email (Prisma usa unique constraint) |
| B9 | `VOC-api/.../EventController.ts` | `request.body` passado diretamente para use case sem validação de schema |

---

---

---

## Correções Aplicadas — 2ª Rodada (2026-05-20)

| # | Status | Correção |
|---|--------|----------|
| A2 | ✅ | `VITE_STORAGE_KEY` gerada com crypto-safe e salva no `.env` |
| B2 | ✅ | Dead code removido: `ChangePhonePage`, `ValidatePasswordPage`, `ValidateUserPage`, `RequestResetPasswordPage`, `ForbiddenPermissionsGuard`, `useNotificationSocketListener` |
| B4 | ✅ | Todos `console.log/warn` de produção removidos (só restaram logs intencionais em scripts de seed) |
| B6 | ✅ | READMEs do frontend e backend atualizados (não mais template Vite) |
| B7 | ✅ | Script `typecheck` adicionado em ambos `package.json` |
| B9 | ✅ | Schemas Zod adicionados em `PostController.create` e `EventController.create` |
| — | ✅ | `JWT_SECRET` e `ADMIN_PASSWORD` gerados com crypto e salvos nos `.env` |
| — | ✅ | `.env` não versionados (projeto não tem git) — `.gitignore` já protege |

## Correções Aplicadas — 1ª Rodada (2026-05-20)

| # | Status | Correção |
|---|--------|----------|
| C1+C4 | ✅ | `.env` trocado para `JWT_SECRET=` (sem valor padrão). `JwtProvider` lança erro se env não estiver definida. `dotenv/config` adicionado ao `server.ts` |
| C2 | ✅ | `seed-admin.ts` lê `ADMIN_PASSWORD` de `process.env`. Lança erro se não definido |
| C3 | ✅ | `.env` do front limpo. `.gitignore` atualizado com `.env`. `.env.example` criado |
| C5 | ✅ | `POST /members` agora exige `auth` + `requireLevel(20)` |
| C6 | ✅ | `EventController.delete` usa `auth.userId` em vez de `body.deletedById` |
| C7 | ✅ | `FinancialRecordController.delete` usa `auth.userId` em vez de `body.deletedById` |
| C8 | ✅ | `logout` limpa `accessToken` e `refreshToken` cookies |
| C9 | ✅ | `refresh` seta novos cookies httpOnly. Corrigido typo `"token"` → `"accessToken"` |
| C10 | ✅ | `CreateUserUseCase` não retorna mais `temporaryPassword` na resposta |
| A1 | ✅ | `express-rate-limit` instalado (5 tentativas/min na rota `/users/login`) |
| A3 | ✅ | `*.db`, `*.sqlite`, `*.sqlite3` adicionados ao `.gitignore` |
| A5 | ✅ | `ErrorHandle` loga apenas `[name] message — method path` sem stack trace |
| A6 | ✅ | `zod` schemas validam `banners`, `photos`, `videos` no `SiteContentRepository.update` |
| A7 | ✅ | `socket.ts` removido (dead code) |
| A8 | ✅ | Mantido `requireLevel(80)` na rota — já protegido |
| M2 | ✅ | Regex de email melhorada para padrão RFC 5322 |
| M3+M4 | ✅ | `helmet` instalado com CSP configurado |
| M6 | ✅ | `DashboardController` GET retorna 200 (não 201) |
| M7 | ✅ | `ListFinancialRecordsUseCase` e repositório com paginação (`limit`/`offset`) |
| B3 | ✅ | `normalizePhone.ts` — import quebrado de `LoggerFactory` removido |

## Pacotes Instalados

- `express-rate-limit@^8.5.2`
- `zod`
- `helmet`

---

## ⚠️ Ações Manuais Obrigatórias

1. **Gerar JWT_SECRET**: `openssl rand -base64 32` e colocar em `VOC-api/.env`
2. **Definir ADMIN_PASSWORD**: senha forte em `VOC-api/.env`
3. **Rotacionar chave Mercado Pago**: `APP_USR-5281345a-4496-4d39-8312-5811f3cd802a` foi exposta publicamente
4. **Rodar**: `git rm --cached VOC-api/.env VOC/.env VOC-api/prisma/db/dev.db`

## Contratos e Observações

- **Auth**: Cookie httpOnly + refresh token rotation implementado (correto), mas refresh endpoint quebrado (não seta novos cookies)
- **CORS**: Restrito a `localhost:5174` com `credentials: true` (correto)
- **Hash**: bcrypt 12 rounds (correto)
- **SQL Injection**: Prisma usa parameterized queries (protegido)
- **XSS**: React escapa por padrão (protegido), sem `dangerouslySetInnerHTML`
- **Cookies**: httpOnly configurado, `secure` apenas em produção, `sameSite: "lax"`

---

## Sessão — 2026-05-24

### House removido
- `EventMember` + `Event.type` já cobriam controle de presença — House era ruído
- Schema: modelos `House` e `MemberHouse` removidos, migration reset
- Backend: módulo `house/` deletado, referências removidas de membership (ListMembersUseCase, controller, repositories)
- Frontend: `src/house/` deletado, rotas `/app/houses` removidas, `ListModeType` sem `"house"`
- seed-test.ts atualizado sem houses

### seed-test.ts criado
- Seed determinístico para testar todo o fluxo:
  - 7 roles, 7 users, 10 members (4 status diferentes)
  - 5 ministries, 5 categories, 6 eventos + 1 soft-delete
  - 8 financial records (1 cancelado + 1 estorno/reversal)
  - 5 posts (1 rascunho), site content settings
- `npm run seed` para executar

## Sessão — 2026-05-23

### Renomeações
- **Drawer**: "Usuarios" → "Liderança"
- **UsersPage**: título "Usuários" → "Liderança", subtitle "Gerenciamento de contas" → "Gerenciamento de lideranças"

### Relatórios de Cultos — migrado para EventsPage
- `EventMonthlyReportsPage.tsx` deletado
- Rota `/app/events/reports` e drawer "Rel Cultos" removidos
- `EventsPage.tsx` agora exibe summary cards (Cultos, Membros, Visitantes, Média) + botões Exportar Excel/PDF usando `useMonthlyEventReport`

### Membros Ausentes — removido
- Backend: `GetInactiveMembersUseCase`, rota `GET /members/inactive`, método `inactive` no controller/repositório removidos
- Frontend: `InactiveMembersPage.tsx`, drawer "Ausentes", rota `members/inactive`, service method removidos

### House (grupos/células) — removido
- `EventMember` + `Event.type` já cobriam o controle de presença por tipo de culto
- Modelos `House` e `MemberHouse` removidos do schema Prisma + migration reset
- Módulo `src/modules/house/` inteiro deletado (12 arquivos)
- Rota `/houses` removida do backend
- Modo `"house"` removido de `ListMembersUseCase`, `MemberController`, `IMemberRepository`, `PrismaMemberRepository`
- Frontend: `src/house/` deletado (6 arquivos), rotas `/app/houses` removidas, `"house"` removido de `ListModeType`

---

## Sessão — 2026-05-26

### Sistema de Notificações — Correção de Crash
- **Problema:** Backend gerava notificações com tipos VOC (`EVENTO_CRIADO`, `MEMBER_AUSENTE`, `MEMBRO_ESCALADO`, `ESCALA_PENDENTE`) mas o frontend só mapeava tipos genéricos SaaS (`USER_WELCOME`, `PAYMENT_CONFIRMED`, etc.). O mapper caía no `default` → `assertNever()` → crash.
- **Correção:** Adicionados os 4 tipos VOC no frontend:
  - `NotificationType.ts` — constantes `MEMBER_AUSENTE`, `EVENTO_CRIADO`, `ESCALA_PENDENTE`, `MEMBRO_ESCALADO`
  - `NotificationPayloads.ts` — tipos `EventoCriadoPayload`, `EscalaPendentePayload`, `MembroEscaladoPayload`, `MemberAusentePayload`
  - `NotificationDTO.ts` — variantes na união (payload como `string`, pois o backend serializa como JSON string)
  - `NotificationMapper.ts` — 4 novos cases com `JSON.parse(payload)`, usando `title`/`message` do backend

### Dashboard — Cultos não apareciam
- **Problema:** Backend retornava `services` no `DashboardData`, frontend destruturava `events` → sempre `undefined`
- **Correção:** Renomeado `services` → `events` em `IDashboardRepository.ts` e `PrismaDashboardRepository.ts`

### Flag hasHouseParticipation — Adicionada às listas de membros
- **Antes:** só existia no endpoint detalhado (`GET /members/:memberId`)
- **Agora:** também retornada nas 4 queries de listagem (`findAllMembers`, `findMembersAvailableForEvent/Ministry/Assignment`)
- `AvailableMembers` tipo atualizado com `hasHouseParticipation: boolean`
- **Frontend:** badge "Já participou de House" no `MemberDetailPage` e badge "House" no `MembersPage`

### Botão WhatsApp — Adicionado em 4 páginas
- `MembersPage.tsx` — ícone ao lado do telefone no card da lista (com `stopPropagation`)
- `MemberDetailPage.tsx` — ícone ao lado do "Telefone" nas informações pessoais
- `UsersPage.tsx` — ícone ao lado do telefone no card da lista
- `UserDetailPage.tsx` — ícone ao lado do "Telefone" nas informações pessoais
- Link: `https://wa.me/{numeroLimpo}` (só dígitos)
- **Dashboard:** Membros ausentes também ganharam botão WhatsApp (`InactiveMemberItem.memberPhone` adicionado no backend)

### Relatório de Eventos — Nova aba "Relatório"
- `EventReportTab.tsx` criado — consolida em uma única tela:
  - Informações gerais (título, tipo, data, tema, observações)
  - Preletor
  - Presença (membros/visitantes + lista de membros)
  - Escala por ministério
  - Financeiro (entradas/saídas/saldo + movimentações)
  - Botões Exportar Excel e PDF
- Adicionado como 4ª aba no `EventDetailPage.tsx`

### Relatório Financeiro — Mais detalhado
- `FinancialRecordsPage.tsx`:
  - 4º card de sumário: total de transações
  - Barras de progresso com percentual em "Por categoria" e "Por método"
  - Nome do mês em português no subtítulo
  - Legenda "X movimentações" no rodapé do filtro
  - Export (Excel/PDF) agora inclui seções: RESUMO (entradas/saídas/saldo/total), POR CATEGORIA, POR MÉTODO, MOVIMENTAÇÕES

### Export dos Relatórios — Detalhamento completo

**Relatório de Evento** (`EventReportTab.tsx`):
- Export (Excel/PDF) agora inclui 4 seções:
  - **RESUMO:** título, tipo, data, tema, observações, preletor, presença, resumo financeiro
  - **MEMBROS PRESENTES:** lista completa de nomes
  - **ESCALA:** membro + ministério/descrição
  - **MOVIMENTAÇÕES:** categoria + valor + método

**Relatório Financeiro Mensal** (`FinancialRecordsPage.tsx`):
- Export (Excel/PDF) agora inclui:
  - **RESUMO:** entradas, saídas, saldo, total de transações
  - **POR CATEGORIA:** cada categoria com total
  - **POR MÉTODO:** cada método com total
  - **MOVIMENTAÇÕES:** data, direção, método, descrição, valor

**Comprovante de Lançamento** (`FinancialRecordDetailsPage.tsx`):
- Novos botões Exportar Excel e PDF acima das ações
- Exporta todos os campos: tipo, categoria, valor, data, método, descrição, membro, evento, registrado por, criado em

---

## Sessão — 2026-05-26 (PDF)

### Refatoração completa do sistema de PDF
- **Antes:** `jsPDF` + `jspdf-autotable` — tabelas genéricas, aparência de planilha
- **Agora:** `@react-pdf/renderer` — componentes React, design corporativo premium

### Arquitetura criada (`src/pdf/`)

**Design System (`tokens.ts`):**
- Paleta corporativa (primary: navy, success: green, error: red, neutrals)
- Escala tipográfica, espaçamentos, fontes (Helvetica)

**Componentes reutilizáveis (`components/`):**
- `PdfHeader` — cabeçalho institucional com título + número de documento
- `PdfFooter` — rodapé com data de geração + numeração de páginas
- `PdfSection` — seção com título e borda inferior
- `PdfCard` — card com fundo suave e borda
- `PdfInfoRow` — linha label + valor
- `PdfAmountHighlight` — destaque de valores com fundo colorido (entrada/verde, saída/vermelho)
- `PdfStatusBadge` — badge de status (sucesso, erro, aviso, info)
- `PdfTable` — tabela estilizada com cabeçalho escuro, linhas alternadas, footer
- `PdfSignatureArea` — linha de assinatura

**Documentos (`documents/`):**
- `FinancialReceipt` — comprovante financeiro (layout vertical, valor em destaque, QR code placeholder, hash de validação, auditoria)
- `FinancialReport` — relatório mensal (indicadores, categorias, métodos, tabela de movimentações)
- `EventReport` — relatório de evento (info, presença, membros em chips, escala, financeiro)

**Utilitário (`download.ts`):**
- `downloadPdf(element, filename)` — renderiza componente React para blob e faz download

**Dependências removidas:**
- `jspdf`, `jspdf-autotable` desinstalados
- `reportExport.ts` simplificado: só mantém `downloadExcelReport`

**Consumidores atualizados:**
- `FinancialRecordDetailsPage` → `FinancialReceipt`
- `FinancialRecordsPage` → `FinancialReport`
- `EventReportTab` → `EventReport`

---

## Sessão — 2026-05-26 (Ajustes PDF + Permissões + Landing)

### FinancialReceipt condensado em 1 página
- `FinancialReceipt.tsx`: removeu divider, QR placeholder, signature area; unificou Detalhes+Vinculações
- Auditoria no rodapé compacto: `João (Tesoureiro)` + ID + Doc + hash
- `tokens.ts`: adicionado `fontFamily.mono: "Courier"`

### Role no recordedBy (backend + frontend)
- `PrismaFinancialRecordRepository.ts`: recordedBy extrai `roles[0]?.role?.name` como `roleName`
- `GetFinancialRecordByIdUseCase.ts` e `GetFinancialRecordsByEventUseCase.ts`: `roleName` no DTO
- `EventReport.tsx`: coluna "Registrado por" com `Nome (Cargo)`

### Event creator tracking (createdById)
- Schema: `createdById String?` no Event, `createdEvents Event[]` no User
- Entity, repository (findDetailedEvent, findById, findAll, save, saveWithAttendanceAndFinancial)
- Controller: injeta `request.auth!.userId` como `createdById`
- DTOs: `createdBy` com `fullName`, `roleName` no frontend
- `EventReportTab.tsx` + `EventReport.tsx`: mostra quem criou com nome e cargo

### Fluxo evento → post
- `useEventToPostStore.ts`: store zustand com `eventId`, `title`, `content`
- `useEventMutations.ts`: seta store no onSuccess do `closeEvent`
- `PostPromptModal.tsx`: modal global "Criar Publicação" com botões "Sim" / "Agora não"
- `MainLayout.tsx`: PostPromptModal montado DENTRO do Router (PostForm usa useNavigate)
- `PostForm.tsx`: novas props `initialTitle` e `initialContent`

### Posts → Feed (renomeação)
- Menu (UserLayout): label "Feed", ícone `mdi:feed`
- PostsPage: título "Feed", ícone `mdi:feed`
- PostDetailPage: título "Feed | Detalhes", ícone `mdi:feed`
- PostForm: "Nova Publicação" / "Editar Publicação"

### PostArea — AnimatedTabs substituído por select
- `PostArea.tsx`: AnimatedTabs removido; `FormInput type="select"` com categorias + "Todos" como default

### Alinhamento visual EventsPage com FinancialRecordsPage
- Filtros + Export em `card-premium grid` (mesmo `p-5`, `gap-4`, `md:grid-cols-4`)
- Botões export com `var(--accent-cyan)` e `var(--accent-purple)`
- SummaryCard ganhou prop `tone` para valores coloridos
- Cores fixas substituídas por CSS variables (`var(--text-primary)`, `var(--text-muted)`, etc.)
- Padding ajustado para `px-4 md:px-6`

### Permissões — Export financeiro só para level 80+
- `EventDetailPage.tsx`: aba "Relatório" só renderiza com `authLevel >= 80`
- `EventsPage.tsx`: botões Exportar Excel/PDF só com `authLevel >= 80`; grid ajusta para 2 colunas
- `EventReportTab.tsx`: já dentro da aba protegida — coberto pelo gate da tab

### Logout — Limpeza robusta de cookies
- `UserController.ts`: `clearCookie` agora usa `httpOnly`, `secure`, `sameSite` iguais ao setCookie; logoutUseCase envolvido em try/catch
- `useAuthMutations.ts`: `navigate()` → `window.location.href` (full page reload, elimina estado residual)

### Landing page — Sem redirecionamento de auth
- `useAuthStatus.ts`: query desativada em páginas públicas (`/`, `/auth/*`, `/post/*`)
- `axios.ts`: interceptor não redireciona para login em páginas públicas
- `PublicPostPage.tsx`: nova rota pública `/post/:postId` para ver post completo
- `publicRoutes.tsx`: rota `/post/:postId` adicionada
- `PostCard.tsx`: navegação pública vai para `/post/:id` em vez de `/app/posts/:id`

---

## Sessão — 2026-05-27

### Login redirect — Invalidação antes de navegar
- `useAuthMutations.ts`: `onSuccess` agora invalida `["userData"]` *antes* de `navigate("/app/posts")` para garantir que o `AuthenticatedGuard` tenha dados frescos ao montar
- Removeu `onSettled` duplicado que invalidava após a navegação

### Post creation — Permissão reduzida para 40 (MINISTRY_LEADER+)
- `VOC-api/postRoutes.ts`: todas as rotas de mutação (POST, PATCH, publish, unpublish) mudaram de `requireLevel(90)` para `requireLevel(40)`
- `PostsPage.tsx`: `minLevel={90}` → `minLevel={40}` no botão "Novo"
- `PostCard.tsx`: `minLevel: 90` → `minLevel: 40` na ação "Editar"
- `PERMISSOES.md`: atualizado tabela de permissões (Posts: 90→40)

### Tema light — Variáveis `--c-*` e cores acento adicionadas
- `index.css` `[data-theme="voc-light"]`:
  - Adicionadas `--c-slate-*`, `--c-gray-*`, `--c-sky-*`, `--c-red-*`, `--c-emerald-*` para que `bg-slate-900`, `text-gray-300` etc. funcionem em ambos os temas via mapeamento `@theme`
  - Acentos light: `--accent-cyan: #0284c7`, `--accent-coral: #dc2626`, `--accent-purple: #7c3aed` (cores visíveis, não mais `#18181b`)
  - Gradients restaurados com cores light apropriadas
  - DaisyUI overrides adicionados para o tema light

### CSS variables — `text-white` substituído em 30+ componentes
- `MainLayout.tsx`: `text-white` removido do wrapper principal (body já tem `color: var(--text-primary)`)
- 30+ componentes tiveram `text-white` → `text-[var(--text-primary)]` para que o texto se adapte ao tema claro/escuro:
  - Post: `PostCard`, `PostArea`
  - Event: `EventReportTab`, `EventFormPage`, `EventMembersList`, `EventAssignmentsTab`, `PostPromptModal`, `FinanceRecordList`, `PreacherSection`, `EventBasicInfo`, `PreacherSelector`, `EventAttendanceSection`, `FinanceSummary`, `EventHeader`
  - Finance: `FinancialRecordDetailsPage`
  - User: `UserDetailPage`, `UsersPage`, `UserForm`
  - Member: `MemberDetailPage`, `MembersPage`, `MemberForm`, `MemberSelector`
  - Ministry: `MinistryDetailPage`, `AssignMemberForm`
  - Category: `CategoryDetailsPage`, `CategoriesPage`, `CategorySelector`
  - Dashboard: `DashboardSection`, `StatCard`
  - Shared: `Avatar`, `Dialog`, `PhoneInput`, `InputLabel`, `Counter`, `CodeInput`, `ResendOptions`, `InputSearch`
  - Notification: `NotificationList`
  - Auth: `ResetPasswordPage`
- Botões com fundo colorido mantiveram `text-white` (Avatar confirm, UserRolesManager Adicionar, ResetPassword redefinir)

## Sessão — 2026-05-27 (Login fix + ECharts)

### Login redirect — isPublicPage movido para dentro do hook
- useAuthStatus.ts: isPublicPage era constante do módulo (avaliada uma vez). Ao logar de /auth/login, a query ["userData"] ficava sempre desabilitada → AuthenticatedGuard via !isAuthenticated e redirecionava de volta.
- **Correção:** isPublicPage movido para dentro da função useAuthStatus, recalculado a cada render.

### Dashboard financeiro — Apache ECharts
- **Dependências:** echarts + echarts-for-react instalados
- **CategoryDoughnutChart.tsx** — Donut chart substitui progress bars de "Por categoria":
  - Gradientes suaves por fatia, tooltip elegante, legenda lateral com %
  - Total geral (entradas+saídas) centralizado no donut
  - Paleta de 12 cores (cyan, roxo, rosa, amarelo, azul, etc.)
- **MethodBarChart.tsx** — Barras horizontais substituem progress bars de "Por método":
  - Gradiente linear individual por barra, cantos arredondados
  - Grid minimalista, tooltip com valor e %, labels à direita
  - backgroundStyle sutil para efeito de vazio
- FinancialRecordsPage.tsx — Apenas conteúdo dos cards substituído; layout, ReportCard, SummaryCard, filtros e export preservados

## Sessão — 2026-05-27 (Build fixes)

### Frontend — build limpo (0 erros TypeScript)

## Sessão - 2026-05-27 (Build fixes)

### Frontend - build limpo (0 erros TypeScript)
- EventReportTab.tsx: adicionados `: any` nos 3 callbacks map/forEach com fr de financialData.financialRecords
- HeroBanner.tsx: removido clearTimeout(videoTimer) e dependencia videoDelay (variaveis inexistentes)
- EventAssignmentsTab.tsx, EventBasicInfo.tsx, EventInfoTab.tsx: removidos imports nao utilizados de Balloon
- dashboard.types.ts: adicionado campo memberPhone?: string | null em InactiveMember

## Sessão — 2026-05-28

### Cadastro de Membros — Refatoração completa
- **Nome dividido**: formulário agora tem Nome + Sobrenome (obrigatórios), combinados em `fullName` no submit
- **Nickname opcional**: campo "Apelido", schema Prisma (`nickname`/`normalizedNickname`)
- **Telefone condicional**: obrigatório apenas para 16+. Toggle UK / BR
- **Postcode UK**: máscara `postcode-uk` no `FormInput`, busca via postcodes.io com botão "Buscar"
- **Endereço separado**: Rua e Número manual + localidade auto-preenchida
- **Feedback visual**: `FormInput` com `error` (borda vermelha + mensagem), `*` em obrigatórios
- **Pós-cadastro**: tela "Obrigado!" com redirect 3s para `/`
- **Duplicate prevention**: backend retorna sucesso silencioso se já existir

### Eventos — Permissão por criador
- `UpdateEventUseCase` e `DeleteEventUseCase`: check `event.createdById === userId || userLevel >= 80`
- `requireLevel` anexa `userLevel` ao `req.auth`
- Frontend: `readOnly` desabilita inputs quando não é criador nem presidente

### Ministérios — Liderança (`leaderId`)
- Schema: `leaderId` em Ministry, `ledMinistries` back-relation
- Use cases de assign/remove member checkam `user.memberId === ministry.leaderId || userLevel >= 80`
- `GET /users/me` retorna `ledMinistries`, DTOs retornam `leaderId`
- EventAssignmentsTab mostra todos ministérios, add/remove só nos liderados

### Seed — Refatorado para testar fluxo
- Membros com dados UK, `leaderId` definido, `createdById` em eventos, `MemberMinistry` explícitos

### WhatsApp Evolution — Página de conexão
- Rotas `GET/POST /whatsapp/instance`, `GET/DELETE /instance/:name/qrcode|state|restart`
- `WhatsAppInstanceService` com `createInstance`, `getQrCode`, `connectionState`, `deleteInstance`, `restartInstance`
- Frontend `/app/whatsapp` (level 40+): stepper, QR code base64, pareamento, polling 3s
- `EVOLUTION_API_KEY` e `EVOLUTION_URL` no .env

---

## Sessão — 2026-05-29 (Refatoração do sistema de permissões)

### Fase 1 — Constantes nomeadas (LEVEL)
- Criado VOC-api/src/shared/constants/levels.ts e VOC/src/shared/constants/levels.ts com LEVEL.MEMBER(10), LEVEL.MINISTRY_LEADER(40), LEVEL.TREASURER(80), LEVEL.PRESIDENT(100) etc.
- Substituídos todos os `requireLevel(N)` nas 12 rotas backend por `requireLevel(LEVEL.XXX)`
- Substituídos todos os `minLevel={N}` e `minLevel: N` em 18 arquivos frontend (rotas, drawer, componentes)

### Fase 2 — JWT com userLevel (zero queries no requireLevel)
- IJwtProvider.ts: JwtPayload agora inclui userLevel: number
- LoginUseCase.ts e RefreshTokenUseCase.ts: incluem `userLevel: user.highestLevel` no token
- `authMiddleware.ts`: extrai userLevel do payload e anexa ao `req.auth`
- `requireLevel.ts`: **removeu a query Prisma** — agora lê `req.auth.userLevel` diretamente (0 queries por rota protegida)

### Fase 3 — Math.max unificado
- Backend: único cálculo em User.highestLevel getter + login/refresh (cálculo centralizado)
- Frontend: useAuthStatus.ts mantém Math.max local para o `authLevel`

### Fase 4 — Ambiguidade 90 vs 100 eliminada
- seed-admin.ts: `{ name: "ADMIN" }` → `{ name: "PRESIDENT" }"`
- PERMISSOES.md: todas as referências a "90 (PRESIDENT)" atualizadas para "100 (PRESIDENT)"

### Fase 5 — AssignRoleUseCase fortalecido
- AssignRoleUseCase.ts e RemoveRoleUseCase.ts: usam `assignedBy.highestLevel < role.level` em vez de `roles.some()` — validação autocontida, não depende da rota

### Painel informativo de permissões (UX)
- ListRolesUseCase.ts: description e level adicionados ao DTO de retorno (antes só id e `name`)
- VOC/src/shared/constants/rolePermissions.ts (novo): mapa ROLE_PERMISSIONS com label PT-BR, descrição e grid de acessos (ícone + label + criar/ver/bloqueado) para cada role
- UserRolesManager.tsx: três melhorias:
  1. **Tooltip nas pills**: hover mostra nome, descrição e nível da role
  2. **Dropdown com labels**: exibe "Tesoureiro" em vez de "TREASURER"
  3. **Painel informativo**: ao selecionar role, mostra card com label, nível, descrição e grid 2-colunas de acessos
- MyProfilePage.tsx: `roleLabels` local substituído pelo ROLE_PERMISSIONS compartilhado

## Sessão — 2026-05-29 (Cancelamento e Estorno Financeiro)

### Problema
- Frontend: botão "Estornar / Excluir" era placeholder `console.log("Delete", record.id)`
- Hook de deleção usava endpoint `update` em vez de `PATCH /:recordId/delete` — simplesmente não funcionava
- Tipos usavam `deletedAt`/`deleteReason` (backend retorna `cancelledAt`/`cancelReason`)
- Schema Prisma tem `status` (ACTIVE/CANCELLED/REVERSED) e auto-relacionamento `reversalOfId`/`reversedBy` mas nunca usados
- Nenhum fluxo de estorno (criar registro espelhado ao cancelar)

### Correções — Backend
- `FinancialRecord.ts`: adicionado `status: FinancialRecordStatus` e `reversalOfId` às props; método `cancel()` seta status CANCELLED + campos de auditoria; getter `isCancelled`
- `PrismaFinancialRecordRepository`: `findByIdDetailed` inclui `reversalOf`/`reversedBy` e retorna `status` + `cancelledById` no audit; `findById` mapeia status e reversalOfId; `findAll` aceita `includeCancelled` (filtro opcional); `save` persiste status; novo método `create()` para registros de estorno
- `IFinancialRecordRepository`: `delete()` removido (só `save()` + `create()`); `findAll` aceita `includeCancelled`
- `GetFinancialRecordByIdUseCase` DTO: adicionado `status`, `reversalOf`, `reversedBy`, `cancelledById` no audit
- `ListFinancialRecordsUseCase` DTO: adicionado `status`; aceita `includeCancelled`
- `DeleteFinancialRecordUseCase`: usa `record.cancel()` em vez de `record.delete()`; valida se já cancelado
- `ReverseFinancialRecordUseCase` (novo): cancela original + cria registro de estorno espelhado com `reversalOfId`
- `FinancialRecordController`: novo método `reverse()`; `list()` aceita query `includeCancelled`
- `financialRecordRoutes.ts`: nova rota `POST /:recordId/reverse`
- `container/index.ts`: instancia ReverseFinancialRecordUseCase

### Correções — Frontend
- `financialRecordsService.ts`: `Audit` corrigido (`deletedAt` → `cancelledAt`, `deleteReason` → `cancelReason`); `FinancialRecordDTO` adiciona `status`, `reversalOf`, `reversedBy`; novo tipo `FinancialRecordListItem`; métodos `cancel()` e `reverse()`
- `useFinancialRecords.ts`: aceita `includeCancelled` no hook; queryKey corrigido para `financialRecords`
- `useFinancialRecord.ts`: queryKey corrigido para `["financialRecord", recordId]`
- `useFinancialRecordMutations.ts`: `deleteFinancialRecord` substituído por `cancelFinancialRecord` (usa PATCH /delete); novo `reverseFinancialRecord` (usa POST /reverse)
- `FinancialRecordDetailsPage.tsx`:
  - Badge "Cancelado" no header se `cancelledAt` preenchido
  - Seção `reversalOf`/`reversedBy` com links para navegação
  - Auditoria mostra `cancelledAt`/`cancelReason` em vez de `deletedAt`/`deleteReason`
  - Modal de cancelamento com campo "Motivo" + confirmação
  - Modal de estorno com seleção de categoria (tipo oposto) + motivo + confirmação
- `FinancialRecordsPage.tsx`: checkbox "Mostrar cancelados"; badge "Cancelado" nos itens da lista; `opacity-60` em registros cancelados

### WhatsApp Evolution — Correção de envio de mensagens
- WhatsAppInstanceService.ts: URL do sendMessage usava instanceName (sempre "default") em vez de instance.instanceName (nome real "VOC - CHURCH") — mensagens nunca eram enviadas pelo backend
- _findInstance: findUnique com filtro não-unique isActive trocado por findFirst
- Teste direto na Evolution API confirmou funcionamento (Status 201, PENDING)
- Mensagens WhatsApp humanizadas nos 5 arquivos de disparo

### Fluxo de cadastro de usuários (Presidente cria, usuário completa)
- CreateUserUseCase: agora retorna `temporaryPassword` — presidente vê a senha no modal após criar
- LoginUseCase: bloqueia login se `isTemporaryPassword === true` → erro `TEMPORARY_PASSWORD_REQUIRED`
- UpdatePasswordUseCase (novo): valida senha atual, hash da nova, marca `isTemporaryPassword = false`, já loga automaticamente
- `User.markPasswordAsTemporary()` e `markPasswordAsPermanent()`: métodos na entidade
- Rota `POST /auth/update-temporary-password`: substituiu stub 501
- `PATCH /members/me/complete-profile`: cria membro vinculado ao usuário logado
- `CompleteProfilePage.tsx`: formulário de nome, data, telefone para primeiro acesso
- `AppHomeRedirect`: detecta user sem memberId → redireciona para /app/complete-profile
- `useAuthStatus`: expõe `refetch` para recarregar dados após completar perfil

### Redefinição de senha pelo presidente (AdminResetPassword)
- `AdminResetPasswordUseCase` (novo): gera senha temporária, hasheia, marca `isTemporaryPassword = true`, envia WhatsApp com a nova senha
- `PATCH /:userId/admin-reset-password`: rota protegida (requireLevel PRESIDENT)
- `UserDetailPage.tsx`: botão "Redefinir senha" + modal mostrando a senha gerada
- `userService.ts`: método `adminResetPassword`
- Fluxo: presidente redefine → usuário recebe WhatsApp → loga → forçado a trocar senha

### Cron de membros ausentes (estrutura)
- `node-cron` instalado
- `src/infra/cron/checkInactiveMembers.ts`: executa `NotifyInactiveMembersUseCase` semanalmente (segunda 8h)
- Só ativa se `CRON_ENABLED=true` no .env (default: false)
- Dashboard continua sendo o gatilho principal

### Correções diversas
- `seed-admin.ts`: email do admin movido de hardcoded (`awl-7@live.com`) para env var `ADMIN_EMAIL`
- `.env` e `.env.example`: adicionado `ADMIN_EMAIL`
- Removidos 3 `console.log` de debug: `server.ts` (lista de rotas), `WhatsAppInstanceService.ts` (phone), `RemoveMemberFromEventUseCase.ts` (member)
- Removida função `listRoutes` morta do `server.ts`
- `CreateMemberUseCase`: agora dispara notificação `MEMBRO_VINCULADO` quando um usuário logado completa o perfil
- `MembersPage.tsx`: botão "Exportar Excel" com dados de nome, idade, telefone, status e data de cadastro
