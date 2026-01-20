FROM oven/bun:1

WORKDIR /app

# Copy root files
COPY package.json bun.lock turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN bun install

# Generate Prisma Client
# Prisma 7 requires DATABASE_URL to be set (even though generate doesn't connect to DB)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
WORKDIR /app/packages/db
RUN bunx prisma generate

# Run the trading-engine
WORKDIR /app/apps/tradingEngine

# No build script by default in package.json, it runs 'bun run src/index.ts'
# We can create a build script or run directly.
# Let's run directly for now as per "dev" script, but "start" should ideally be "bun src/index.ts" or compiled.
# If we want a production build, we should add a build step.
# For now, let's run typescript directly with bun which is efficient.

CMD ["bun", "src/index.ts"]
