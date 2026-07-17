FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN SKIP_ENV_VALIDATION=1 bun run build \
	&& rm -f .next/standalone/.env .next/standalone/.env.*

FROM node:22-alpine AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S nextjs \
	&& adduser -S nextjs -G nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
