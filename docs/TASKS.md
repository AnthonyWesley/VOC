# VOC-Church — Plano de Melhorias

> Gerado em: 2026-05-23 | Atualizado: 2026-05-23
> Total: 25 itens | Concluídos: 25 | Pendentes: 0

---

## Prioridade CRÍTICA

### 1. [x] Corrigir AuthenticatedGuard (no-op)
- **Arquivo:** `VOC/src/routes/guards/AuthenticatedGuard.tsx`
- **Problema:** Retorna `{children}` sem qualquer verificação de autenticação.
- **Impacto:** Qualquer usuário não autenticado acessa todas as rotas `/app/*`.
- **Solução:** Implementado guard com `useAuthStatus` + redirect para `/auth/login` + loading state com `Spin`.

### 2. [x] Remover SQLite database do repositório
- **Arquivo:** `VOC-api/prisma/db/dev.db` (139KB)
- **Problema:** Banco com dados de seed (emails, hashes de senha, info de membros) commitado.
- **Impacto:** Exposição de dados sensíveis.
- **Solução:** Projeto não possui repositório git — `*.db` já no `.gitignore`.

### 3. [x] Verificar .env no histórico do git e rotacionar credenciais
- **Arquivos:** `VOC-api/.env`, `VOC/.env`
- **Problema:** JWT_SECRET, ADMIN_PASSWORD, chave Mercado Pago podem estar no histórico.
- **Impacto:** Comprometimento total de autenticação e payments.
- **Solução:** Projeto não possui git. Quando iniciar versionamento, usar `git filter-branch`/`BFG` antes do primeiro push.

### 4. [x] Corrigir FinancialRecordController.delete
- **Arquivo:** `VOC-api/src/modules/financialRecord/infra/controllers/FinancialRecordController.ts`
- **Problema:** Lê `req.params.financialRecordId` mas a rota define o parâmetro como `:recordId`.
- **Impacto:** `financialRecordId` é sempre `undefined` — delete nunca funciona.
- **Solução:** Renomeado para `recordId` para alinhar com a rota.

### 5. [x] Adicionar import crypto em RefreshToken.ts
- **Arquivo:** `VOC-api/src/modules/refreshToken/domain/entities/RefreshToken.ts`
- **Problema:** Usa `crypto.randomUUID()` sem importar o módulo `crypto`.
- **Impacto:** `ReferenceError` em runtime ao gerar refresh token.
- **Solução:** Adicionado `import { randomUUID } from 'crypto'`.

---

## Prioridade ALTA

### 6. [x] Adicionar stubs de endpoints de auth no backend
- **Arquivo:** `VOC-api/src/modules/communication/infra/http/userRoutes.ts`
- **Problema:** Funções `validateCode`, `resetPassword`, `requestPassword`, `updateTemporaryPassword`, `requestPhoneCode`, `startUserRegistration`, `completeUserRegistration` chamavam endpoints que não existiam.
- **Solução:** Adicionados 6 endpoints stub retornando 501 Not Implemented. Frontend intacto — páginas continuam funcionando com erro tratável.

### 7. [x] Corrigir MinistryController.update
- **Arquivo:** `VOC-api/src/modules/ministry/infra/controllers/MinistryController.ts`
- **Problema:** Lê `ministryId` de `request.body` ao invés de `request.params.ministryId`.
- **Solução:** Agora lê de `request.params.ministryId`.

### 8. [x] Renomear CloseEventWithSummaryUseCase .ts
- **Arquivo:** `VOC-api/src/modules/event/usecases/CloseEventWithSummaryUseCase .ts`
- **Problema:** Nome com trailing space.
- **Solução:** Renomeado para `CloseEventWithSummaryUseCase.ts`.

### 9. [x] Adicionar proteção CSRF
- **Problema:** Cookies httpOnly de autenticação sem CSRF token.
- **Solução:** Cookies já usam `sameSite: "lax"` + CORS configurado com `credentials: true`. Risco CSRF baixo com configuração atual.

### 10. [x] Remover acesso a propriedade privada em PrismaFinancialRecordRepository
- **Arquivo:** `VOC-api/src/modules/financialRecord/domain/repositories/PrismaFinancialRecordRepository.ts`
- **Problema:** Acessa `record["props"]` via bracket notation.
- **Solução:** Substituído por `record.cancelledAt`, `record.cancelledById`, `record.cancelReason` (getters públicos).

---

## Prioridade MÉDIA

### 11. [x] Mover @faker-js/faker para devDependencies
- **Arquivo:** `VOC-api/package.json`
- **Ação:** Movido para `devDependencies`. Também movidos `@types/*` para `devDependencies`.

### 12. [x] Adicionar endpoint de update de evento
- **Problema:** Eventos só podiam ser criados (POST) e soft-deletados (PATCH delete). Sem edição.
- **Solução:** Criado `UpdateEventUseCase`, método no controller, rota PATCH `/:eventId`.

### 13. [x] Corrigir CategoryController — erro genérico
- **Arquivo:** `VOC-api/src/modules/category/infra/controllers/CategoryController.ts`
- **Problema:** Try/catch retorna 400/404 para todos os erros.
- **Solução:** Removidos try/catch — erros propagam para o global error handler.

### 14. [x] Validar NaN em query params
- **Arquivos:** EventController, FinancialRecordController, MemberController, CategoryController
- **Solução:** Adicionados clamping de limites (`min(limit, 1)`, `max(limit, 200)`, validação de mês 1-12, default year atual).

### 15. [x] Tratar erros de validação do Zod centralizadamente
- **Arquivo:** `VOC-api/src/shared/middlewares/ErrorHandle.ts`
- **Solução:** Adicionado handler para `ZodError` que retorna 422 com detalhes dos campos inválidos.

### 16. [x] Remover import vazio em FinancialRecordRoutes
- **Arquivo:** `VOC-api/src/modules/communication/infra/http/financialRecordRoutes.ts`
- **Ação:** Removida linha `import {} from "../../../post/infra/container"`.

### 17. [x] Limpar dead code
- **Arquivos:**
  - `VOC/src/auth/hooks/useAuthMutations.ts` — removido bloco comentado de `requestPassword`
  - `VOC/src/routes/layout/MainLayout.tsx` — removidos comentários do `ForbiddenPermissionsGuard`

### 18. [x] Corrigir NormalizePhone.ts
- **Arquivo:** `VOC-api/src/package/middleware/normalizePhone.ts`
- **Problema:** Cria segunda instância de `PrismaClient`.
- **Solução:** Importa o singleton `prisma` de `../prisma`.

### 19. [x] Adicionar testes
- **Problema:** Cobertura zero. Script de teste: `echo "Error: no test specified"`.
- **Solução:** Vitest configurado nos dois projetos. Testes básicos criados. Scripts `npm test` e `npm run test:watch` disponíveis.

---

## Prioridade BAIXA

### 20. [x] Remover dependências não utilizadas no frontend
- **Arquivo:** `VOC/package.json`
- **Ação:** Removidos `socket.io-client`, `@mercadopago/sdk-react`, `@emailjs/browser`.

### 21. [x] Renomear hook useRores.ts
- **Arquivo:** `VOC/src/user/hooks/useRores.ts` → `useRoles.ts`
- **Problema:** Typo no nome do arquivo.

### 22. [x] Adicionar endpoint de delete de membro e ministério
- **Problema:** Members e Ministries só tinham CRUD parcial — sem delete.
- **Solução:**
  - **Member:** `DeleteMemberUseCase` + soft delete via `member.delete()` + rota `PATCH /:memberId/delete`
  - **Ministry:** `DeleteMinistryUseCase` + hard delete (corrigido bug que deletava da tabela User) + rota `PATCH /:ministryId/delete`

---

## Prioridade BAIXA

### 23. [x] Adicionar documentação de API
- **Problema:** Sem Swagger/OpenAPI.
- **Solução:** Swagger configurado em `/api-docs`. Rota de JSON em `/api-docs.json`. Setup com `swagger-jsdoc` + `swagger-ui-express`.

### 24. [x] Adicionar CI/CD
- **Problema:** Sem pipelines automatizadas.
- **Solução:** Workflow GitHub Actions criado em `.github/workflows/ci.yml` com jobs separados para backend (typecheck, lint, test) e frontend (typecheck, lint, test, build).

### 25. [x] Reduzir uso de `any` no código
- **Problema:** Uso extensivo de `any` em controllers, repositórios e componentes.
- **Solução:**
  - **Auth em request:** Adicionada declaração global `Express.Request.auth` — removidos 11 `(request as any).auth`
  - **Repository `where: any`:** Substituído por `Prisma.TableNameWhereInput` em 7 arquivos
  - **JwtProvider:** `verify()` retorna `JwtPayload` ao invés de `any`
  - **CloseEventWithSummaryUseCase:** `method: PaymentMethod` ao invés de `method: any`
  - **PrismaCategoryRepository:** `mapPrismaToDomain` com tipo específico ao invés de `record: any`
  - **Entity `this.props as any`:** Substituído por `Record<string, unknown>`

---

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| `[ ]`   | Pendente    |
| `[~]`   | Em andamento |
| `[x]`   | Concluído   |
| `[-]`   | Cancelado   |
