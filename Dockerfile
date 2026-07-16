FROM oven/bun:1.2-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN SKIP_ENV_VALIDATION=1 bun run build

RUN addgroup -S nextjs \
	&& adduser -S nextjs -G nextjs \
	&& chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "bun ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
