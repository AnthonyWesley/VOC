# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*


FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci


FROM dependencies AS build

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npx tsc scripts/smoke.ts --outDir dist/smoke --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck


FROM base AS production-dependencies

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force


FROM base AS runner

ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json package-lock.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3333/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]