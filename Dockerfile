FROM node:24-alpine3.23 AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN npm install -g corepack@latest && corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS runner-base

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Write a minimal package.json before installing so:
# - corepack picks up the pinned `packageManager` version (avoids drifting to
#   whatever pnpm corepack@latest defaults to)
# - pnpm reads `onlyBuiltDependencies`, which pnpm 10+ requires in order to
#   run prisma's postinstall (otherwise [ERR_PNPM_IGNORED_BUILDS] aborts the
#   install before the query engine is fetched)
RUN cat > package.json <<'EOF'
{
  "name": "picimpact-runner-base",
  "private": true,
  "packageManager": "pnpm@9.15.9",
  "pnpm": {
    "onlyBuiltDependencies": ["@prisma/client", "@prisma/engines", "prisma"]
  }
}
EOF

RUN npm install -g corepack@latest && corepack enable pnpm && pnpm add prisma@6.19.3 @prisma/client@6.19.3 && pnpm add -D tsx

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN AUTH_SECRET=pic-impact export NODE_OPTIONS=--openssl-legacy-provider && npm install -g corepack@latest && corepack enable pnpm && pnpm run prisma:generate && pnpm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=runner-base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY ./prisma ./prisma
COPY ./script.sh ./script.sh

RUN chmod +x script.sh
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV AUTH_TRUST_HOST=true
ENV NODEJS_HELPERS=0

EXPOSE 3000

ENV PORT=3000

CMD ["./script.sh"]
