# TODO — Correções de Segurança VOC-Church

## ✅ Todos Concluídos (2026-05-20)

### 🔴 CRÍTICAS
- [x] **C1+C4**: JWT Secret — `.env` usa `JWT_SECRET`. `JwtProvider` lança erro se não definido. `dotenv` carregado em `server.ts`. Chave de 256+ bits gerada.
- [x] **C2**: Senha Admin — `seed-admin.ts` lê `ADMIN_PASSWORD` de env. Lança erro se ausente. Senha forte gerada.
- [x] **C3**: Mercado Pago Key — `.env` limpo. `.gitignore` atualizado. `.env.example` criado. **Rotacionar no painel MP.**
- [x] **C5**: POST /members — `auth` + `requireLevel(LEVEL.PRESIDENT)` adicionados
- [x] **C6**: EventController.delete — usa `auth.userId`
- [x] **C7**: FinancialRecordController.delete — usa `auth.userId`
- [x] **C8**: Logout — limpa `accessToken` + `refreshToken` cookies
- [x] **C9**: Refresh — seta novos cookies httpOnly. Corrigido typo `"token"` → `"accessToken"`
- [x] **C10**: CreateUser — não retorna `temporaryPassword` na resposta

### 🟠 ALTAS
- [x] **A1**: Rate limiting — `express-rate-limit` (5/min) na rota `/users/login`
- [x] **A2**: `VITE_STORAGE_KEY` — chave criptográfica gerada e salva
- [x] **A3**: SQLite — `*.db`, `*.sqlite`, `*.sqlite3` no `.gitignore`
- [x] **A5**: ErrorHandler — log estruturado sem stack trace
- [x] **A6**: SiteContent — schemas `zod` validam `banners`/`photos`/`videos`
- [x] **A7**: Socket.IO — arquivo `socket.ts` removido
- [x] **A8**: ListUsers — já protegido por `requireLevel(80)`. Mantido.

### 🟡 MÉDIAS
- [x] **M2**: Email regex — atualizada para padrão RFC 5322
- [x] **M3+M4**: Helmet — instalado com CSP configurado
- [x] **M6**: DashboardController — GET retorna 200
- [x] **M7**: FinancialRecord list — paginação adicionada (`limit`/`offset`)

### 🔵 BAIXAS
- [x] **B2**: Dead code removido (6 arquivos)
- [x] **B3**: normalizePhone.ts — import quebrado de `LoggerFactory` removido
- [x] **B4**: `console.log/warn` de produção removidos
- [x] **B6**: READMEs atualizados
- [x] **B7**: Script `typecheck` adicionado em ambos projetos
- [x] **B9**: Schemas Zod adicionados em `PostController.create` e `EventController.create`

### 🔵 PENDENTES (Ação Manual Necessária)
- [ ] **Rotacionar chave Mercado Pago** no painel do Mercado Pago
- [ ] **B1**: Refatorar `any` gradualmente (esforço contínuo)
- [ ] **B5**: Adicionar testes unitários/integração
- [ ] **M1**: JWT roles no payload — manter como está (assinado, não adulterável)
- [ ] **M5**: HTTPS em produção já cobre (cookie `secure: true` em prod)

---

## Checklist de Verificação Final

- [x] Nenhuma senha hardcoded no código
- [x] Nenhuma chave de API exposta no código-fonte
- [x] Nenhum fallback de JWT (lança erro se env ausente)
- [x] Todas as rotas protegidas por auth
- [x] JWT secret de 256+ bits gerado e salvo em `.env`
- [x] Rate limiting no login implementado (5/min)
- [x] Helmet instalado e configurado com CSP
- [x] Refresh token rotation funcionando (seta novos cookies)
- [x] Logout limpa cookies httpOnly
- [x] deletedById sempre usa `auth.userId`
- [x] .env.example criados (valores vazios)
- [x] .env não versionados (projeto sem git, `.gitignore` protege)
- [x] Dead code limpo
- [x] Schemas Zod em controllers críticos
- [x] READMEs atualizados
- [x] Script `typecheck` disponível
