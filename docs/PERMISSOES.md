# Mapa de Permissões — VOC-Church

## Roles e Levels

| Role | Level | Descrição |
|---|---|---|
| PRESIDENT | 100 | Responsável legal e estatutário — acesso total |
| TREASURER | 80 | Gestão financeira e relatórios |
| PASTOR | 60 | Pastoreio e gestão de ministérios |
| HOUSE_LEADER | 50 | Gestão de células e grupos |
| MINISTRY_LEADER | 40 | Liderança de ministérios específicos |
| MEMBER | 10 | Usuário padrão/membro |

> **ADMIN removido.** O cargo de Administrador foi eliminado. Apenas PRESIDENT (100) tem acesso a operações restritas (criar/editar membros, usuários, posts, site content, ministérios).
>
> Regra: o `authLevel` de um usuário é o **maior level** entre todos os roles que ele possui (`Math.max`).

---

## Backend — Rotas da API (nível mínimo por método)

| Entidade | GET (visualizar) | POST/PATCH (criar/editar) |
|---|---|---|
| Members | 10 | **100** (PRESIDENT) |
| Users (Liderança) | 10 | **100** (PRESIDENT) |
| Events | 10 | **40** (MINISTRY_LEADER+) |
| Ministries | 10 | **100** (PRESIDENT) |
| Ministries — assignMember / removeMember | — | **40** (MINISTRY_LEADER+) |
| Financial Records | **80** (TREASURER+) | **80** (TREASURER+) |
| Posts | 10 | **40** (MINISTRY_LEADER+) |
| Categories | **80** (TREASURER+) | **80** (TREASURER+) |
| Site Content | **100** (PRESIDENT) | **100** (PRESIDENT) |
| WhatsApp | **100** (PRESIDENT) | **100** (PRESIDENT) |
| Roles | 10 | — (sem create/edit) |
| Dashboard | **100** (PRESIDENT) | — |

---

## Frontend — Rotas da SPA (nível mínimo para acessar)

| Rota | Página | minLevel |
|---|---|---|
| `/app/dashboard` | Dashboard | **100** |
| `/app/posts` | Lista de Posts | 10 |
| `/app/posts/:postId` | Detalhe do Post | 10 |
| `/app/users` | Liderança | 10 |
| `/app/users/:userId` | Detalhe do Usuário | 10 |
| `/app/members` | Membros | 10 |
| `/app/members/:memberId` | Detalhe do Membro | 10 |
| `/app/ministries` | Ministérios | 10 |
| `/app/ministries/:ministryId` | Detalhe do Ministério | 10 |
| `/app/events` | Cultos (lista) | 10 |
| `/app/events/new` | Criar Evento | **40** |
| `/app/events/:eventId` | Detalhe do Evento | 10 |
| `/app/form/events` | Formulário de Evento | 10 |
| `/app/categories` | Categorias | **80** |
| `/app/categories/:categoryId` | Detalhe da Categoria | **80** |
| `/app/financial-records` | Financeiro | **80** |
| `/app/financial-records/:recordId` | Detalhe Financeiro | **80** |
| `/app/site-content` | Landing Page Editor | **100** |
| `/app/whatsapp` | WhatsApp | **100** |
| `/app/my-profile` | Meu Perfil | (autenticado) |
| `/app/notifications` | Notificações | (autenticado) |

---

## Frontend — Drawer (itens visíveis no menu)

| Item | minLevel |
|---|---|
| Dashboard | **100** |
| Posts | 10 |
| Liderança | 10 |
| Membros | 10 |
| Ministérios | 10 |
| Cultos | 10 |
| Financeiro | **80** |
| Categorias | **80** |
| Landing | **100** |
| WhatsApp | **100** |

---

## Frontend — Botões de Criar/Editar (quem ENXERGA)

| Onde | Botão | minLevel |
|---|---|---|
| EventsPage | "Novo" | 40 |
| EventDetailPage | "Criar/Atualizar evento" | 40 |
| EventAssignmentsTab | "Adicionar designação" | 40 |
| EventMembersList | "Adicionar membro" | 40 |
| FinanceRecordList | "Adicionar registro" | 40 |
| MinistryDetailPage | "Adicionar membro" | 40 |
| FinancialRecordsPage | "Novo" | 80 |
| FinancialRecordDetailsPage | "Editar" / "Estornar" | 80 |
| CategoriesPage | "Novo" | 80 |
| CategoryDetailPage | "Editar" / "Excluir" | 80 |
| MembersPage | "Novo" | 100 |
| MemberDetailPage | "Editar membro" | 100 |
| UsersPage | "Novo" | 100 |
| UserDetailPage | "Editar usuário" | 100 |
| UserRolesManager | "Adicionar permissão" | 100 |

---

## Resumo por Role

### PRESIDENT (100)
- **Tudo:** lê, cria, edita, exclui qualquer entidade.
- Dashboard visível, financeiro visível, categorias visíveis.

### TREASURER (80)
- **Lê:** todas as páginas (incluindo financeiro e categorias).
- **Cria/Edita:** apenas **Eventos**, **Financeiro** e **Categorias**.
- **Bloqueado:** Dashboard (100), Site Content (100), WhatsApp (100), criar/editar Membros/Usuários/Ministérios (100).

### PASTOR (60)
- **Lê:** Membros, Usuários, Ministérios, Posts, Eventos.
- **Cria/Edita:** apenas **Eventos**.
- **Não vê no menu:** Financeiro, Categorias, Relatórios, Landing, WhatsApp (80+).
- **Bloqueado:** Financeiro (80), Categorias (80), Site Content (100), WhatsApp (100), criar/editar Usuários/Liderança (100).

### HOUSE_LEADER (50)
- **Mesmo que PASTOR:** Lê tudo exceto financeiro/categorias. Cria/edita apenas Eventos.
- **Não vê no menu:** Financeiro, Categorias, Relatórios, Landing, WhatsApp (80+).

### MINISTRY_LEADER (40)
- **Lê:** Membros, Usuários, Ministérios, Posts, Eventos.
- **Cria/Edita:** apenas **Eventos** (incluindo escalas) e **Adicionar membros a ministérios**.
- **Não vê no menu:** Financeiro, Categorias, Relatórios, Landing, WhatsApp (80+).
- **Bloqueado:** Financeiro (80), Categorias (80), Site Content (100), WhatsApp (100), criar/editar Membros/Usuários/Posts/Ministérios (100).

### MEMBER (10)
- **Lê:** Membros, Usuários, Ministérios, Posts, Eventos.
- **Não cria/edita nada:** nenhum botão de ação aparece (todos exigem no mínimo 40).
- **Não vê no menu:** Financeiro, Categorias, Relatórios, Dashboard, Landing, WhatsApp.

---

## Test Users (npm run seed)

| Email | Role | Level |
|---|---|---|
| presidente@test.com | PRESIDENT | 100 |
| admin@test.com | **PRESIDENT** *(migrado de ADMIN)* | 100 |
| tesoureiro@test.com | TREASURER | 80 |
| pastor@test.com | PASTOR | 60 |
| celula@test.com | HOUSE_LEADER | 50 |
| lider@test.com | MINISTRY_LEADER | 40 |
| membro@test.com | MEMBER | 10 |

> Todos com senha `Test@123456`.
