# Plano de Melhoria — Sistema de Permissões (Levels)

> Mantendo o modelo hierárquico de níveis, eliminando fragilidades e a query extra por requisição.

---

## Problemas Identificados

| # | Problema | Localização | Impacto |
|---|----------|-------------|---------|
| P1 | `requireLevel(40)`, `requireLevel(80)` — números mágicos espalhados | 13 arquivos de rota backend | Dificulta manutenção; errar o número passa despercebido |
| P2 | `requireLevel` busca user + roles no DB **a cada requisição protegida** | `middlewares/requireLevel.ts:13` | +1 query por rota; latência desnecessária |
| P3 | `Math.max(...roles.map(r => r.level))` duplicado em 4 lugares | `requireLevel.ts`, `User.ts`, `useAuthStatus.ts`, `AssignRoleUseCase` | Risco de divergência |
| P4 | `requireLevel(90)` usado como "só PRESIDENTE" mas PRESIDENT é level 100 | `memberRoutes`, `userRoutes`, `ministryRoutes` | Confusão semântica; ADMIN não existe mais |
| P5 | `AssignRoleUseCase` confia na rota para proteção — isoladamente é frágil | `AssignRoleUseCase.ts:55` vs `userRoutes.ts:63` | Se alguém chamar o use case sem a rota certa, bypass |

---

## Plano de Migração

### Fase 1 — Constantes Nomeadas (elimina P1)

**Onde alterar:** `VOC-api/src/shared/constants/levels.ts` (novo arquivo)

```ts
// shared/constants/levels.ts
export const LEVEL = {
  MEMBER: 10,
  MINISTRY_LEADER: 40,
  HOUSE_LEADER: 50,
  PASTOR: 60,
  TREASURER: 80,
  PRESIDENT: 100,
} as const;
```

**Arquivos a alterar** (13 rotas + requireLevel):

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `memberRoutes.ts` | `requireLevel(90)` | `requireLevel(LEVEL.PRESIDENT)` |
| `userRoutes.ts` | `requireLevel(90)` | `requireLevel(LEVEL.PRESIDENT)` |
| `eventRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |
| `eventRoutes.ts` | `requireLevel(40)` | `requireLevel(LEVEL.MINISTRY_LEADER)` |
| `eventRoutes.ts` | `requireLevel(80)` | `requireLevel(LEVEL.TREASURER)` |
| `financialRecordRoutes.ts` | `requireLevel(80)` | `requireLevel(LEVEL.TREASURER)` |
| `ministryRoutes.ts` | `requireLevel(90)` | `requireLevel(LEVEL.PRESIDENT)` |
| `ministryRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |
| `ministryRoutes.ts` | `requireLevel(40)` | `requireLevel(LEVEL.MINISTRY_LEADER)` |
| `postRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |
| `postRoutes.ts` | `requireLevel(40)` | `requireLevel(LEVEL.MINISTRY_LEADER)` |
| `categoryRoute.ts` | `requireLevel(80)` | `requireLevel(LEVEL.TREASURER)` |
| `dashboardRoutes.ts` | `requireLevel(90)` | `requireLevel(LEVEL.PRESIDENT)` |
| `siteContentRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |
| `siteContentRoutes.ts` | `requireLevel(90)` | `requireLevel(LEVEL.PRESIDENT)` |
| `notificationRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |
| `whatsappRoutes.ts` | `requireLevel(40)` | `requireLevel(LEVEL.MINISTRY_LEADER)` |
| `roleRoutes.ts` | `requireLevel(10)` | `requireLevel(LEVEL.MEMBER)` |

**Frontend** — criar `VOC/src/shared/constants/levels.ts`:

```ts
export const LEVEL = {
  MEMBER: 10,
  MINISTRY_LEADER: 40,
  HOUSE_LEADER: 50,
  PASTOR: 60,
  TREASURER: 80,
  PRESIDENT: 100,
} as const;
```

Substituir todos os `minLevel={10}`, `minLevel={40}`, `minLevel={80}` etc. nos componentes:
- `userRoutes.tsx` — `<RequireLevel minLevel={LEVEL.MEMBER}>`
- `drawerItems.ts` — `minLevel: LEVEL.TREASURER`
- `PostsPage.tsx` — `minLevel={LEVEL.MINISTRY_LEADER}`
- `MembersPage.tsx` — `minLevel={LEVEL.PRESIDENT}`
- e todos os demais componentes com `minLevel` hardcoded

---

### Fase 2 — JWT com `userLevel` (elimina P2)

**Problema:** `requireLevel` faz uma `findUnique` no Prisma **em toda requisição protegida** para obter as roles e calcular `highestLevel`.

**Solução:** Incluir `userLevel` no payload do access token no momento do login/refresh.

**Onde alterar:**

1. `LoginUseCase.ts` — adicionar `userLevel: user.highestLevel` no payload do JWT
2. `RefreshTokenUseCase.ts` — idem
3. `JwtProvider.ts` — tipo do payload aceitar `userLevel: number`
4. `authMiddleware.ts` — extrair `userLevel` do token: `req.auth = { userId: payload.userId, userLevel: payload.userLevel }`
5. `requireLevel.ts` — **remover a query Prisma**, usar `req.auth.userLevel` diretamente

**Antes:**
```ts
// requireLevel.ts
const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
const highestLevel = Math.max(...user.roles.map(r => r.role.level));
if (highestLevel < minLevel) throw ...;
req.auth = { userId, userLevel: highestLevel };
```

**Depois:**
```ts
// requireLevel.ts — 0 queries
const userLevel = req.auth?.userLevel ?? 0;
if (userLevel < minLevel) throw new ForbiddenError("INSUFFICIENT_PERMISSION_LEVEL");
next();
```

**Checklist:**
- [ ] LoginUseCase — incluir `userLevel` no token
- [ ] RefreshTokenUseCase — incluir `userLevel` no novo token
- [ ] JwtProvider — atualizar tipo do payload
- [ ] authMiddleware — extrair `userLevel` do token
- [ ] requireLevel — remover query, usar `req.auth.userLevel`
- [ ] Remover `import { prisma }` de `requireLevel.ts`
- [ ] Verificar se `express.d.ts` já tem `userLevel` (sim, `express.d.ts:5` já declara)

---

### Fase 3 — Unificar `Math.max` (elimina P3)

Com o `userLevel` vindo do JWT, o `Math.max` só precisará existir em:
1. `JwtProvider.verify()` — não usa
2. `LoginUseCase` - onde monta o token
3. `RefreshTokenUseCase` — onde monta o novo token
4. `User.highestLevel` getter — usado pelos use cases de domínio

Na prática, a rota de **login/refresh** será o único lugar que calcula `Math.max(...roles.map(...))` — o resultado vai direto pro JWT. O `requireLevel` apenas lê.

**Frontend:** `useAuthStatus.ts` continua com o `Math.max` para o nível local — ok.

---

### Fase 4 — Remover ambiguidade 90 vs 100 (elimina P4)

**Onde:** seed, rotas, PERMISSOES.md

- [ ] `seed-roles.ts`: remover comentário "ADMIN removido" duplicado, garantir que não há role com level 90
- [ ] `seed-test.ts`: ver se `admin@test.com` tem role PRESIDENT (100) — se sim, ok; só atualizar comentário
- [ ] Rotas: já resolvido na Fase 1 com `LEVEL.PRESIDENT` em vez de `requireLevel(90)`
- [ ] `PERMISSOES.md`: atualizar menções de "90 (PRESIDENT)" para "100 (PRESIDENT)"
- [ ] `TASKS.md` / `todo.md`: menção a `requireLevel(20)` (C5) — verificar se virou 90/100

---

### Fase 5 — Fortalecer AssignRoleUseCase (elimina P5)

**Problema:** `AssignRoleUseCase.ts:55` verifica `assignedBy.roles.some(r => r.level >= role.level)`, mas a rota já tem `requireLevel(90)`. Se o use case for chamado sem a rota, a proteção é insuficiente.

**Solução:** Usar `assignedBy.highestLevel` (já existe o getter) para comparar:

```ts
// AssignRoleUseCase.ts
if (assignedBy.highestLevel < role.level) {
  throw new ForbiddenError("INSUFFICIENT_PERMISSION_TO_ASSIGN_ROLE");
}
```

Assim a validação é **autocontida** — não depende da rota. Mesmo que o use case seja chamado de outro lugar, a regra vale.

**Onde:**
- [ ] `AssignRoleUseCase.ts` — usar `highestLevel` em vez de `roles.some`
- [ ] `RemoveRoleUseCase.ts` — idem

---

## Resumo das alterações

| Fase | Arquivos modificados | Complexidade | Risco |
|------|----------------------|-------------|-------|
| 1 — Constantes | 13 rotas backend + 1 novo arquivo + ~15 componentes frontend | Baixa | Baixo (mecânico) |
| 2 — JWT userLevel | LoginUseCase, RefreshUseCase, JwtProvider, authMiddleware, requireLevel | Média | Médio (mexe no auth) |
| 3 — Unificar Math.max | LoginUseCase, RefreshUseCase (+ limpeza) | Baixa | Baixo |
| 4 — 90 vs 100 | seed-roles, PERMISSOES.md, TASKS.md | Baixa | Baixo |
| 5 — AssignRole | AssignRoleUseCase, RemoveRoleUseCase | Baixa | Baixo |

**Ordem:** 1 → 4 → 5 → 2 → 3 (deixar o JWT por último para testar bem).

---

## Checklist de Verificação Final

- [ ] `npm run typecheck` passa no backend e frontend
- [ ] `npm run build` no frontend sem erros
- [ ] Nenhum `requireLevel(N)` com número literal nos arquivos de rota
- [ ] Nenhum `minLevel={N}` com número literal nos componentes (fora do `levels.ts`)
- [ ] `requireLevel.ts` não faz mais query no banco
- [ ] `LoginUseCase` inclui `userLevel` no JWT
- [ ] `RefreshTokenUseCase` inclui `userLevel` no novo JWT
- [ ] `AssignRoleUseCase` usa `assignedBy.highestLevel`
- [ ] `RemoveRoleUseCase` usa `removedBy.highestLevel`
- [ ] Seed não tem role com level 90
- [ ] PERMISSOES.md reflete PRESIDENT(100), não mais "90 (PRESIDENT)"
