FROM oven/bun:1.3.3 AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN bun install --frozen-lockfile
RUN bun run build --filter=pricepoller

FROM oven/bun:1.3.3 AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/bun.lock /app/turbo.json ./
COPY --from=builder /app/apps/pricePoller/dist ./apps/pricePoller/dist

WORKDIR /app/apps/pricePoller

CMD ["bun", "dist/index.js"]
