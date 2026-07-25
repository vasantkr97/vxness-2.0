FROM oven/bun:1.3.3 AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN bun install --frozen-lockfile

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd packages/db && bunx prisma generate
RUN bun run build --filter=tradingengine

FROM oven/bun:1.3.3 AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/bun.lock /app/turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN bun install --frozen-lockfile --production --filter "./apps/tradingEngine"
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/tradingEngine/dist ./apps/tradingEngine/dist

WORKDIR /app/apps/tradingEngine

CMD ["bun", "dist/index.js"]
