FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS runner-base

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable pnpm && pnpm add prisma @prisma/client

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN AUTH_SECRET=pic-impact export NODE_OPTIONS=--openssl-legacy-provider && corepack enable pnpm && pnpm run prisma:generate && pnpm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=runner-base /app/node_modules ./node_modules
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

ENV AUTH_TRUST_HOST true

EXPOSE 3000

ENV PORT 3000

CMD ./script.sh
