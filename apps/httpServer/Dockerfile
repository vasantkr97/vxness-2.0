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
WORKDIR /app/packages/db
RUN bun run db:generate

# Build the http-server (if needed, or just run ts)
# But since we are using bun, we can run TS directly or build.
# For simplicity and speed with Bun, we can run src/index.ts directly or build.
# Let's try to build to ensure types are checked, or just run.
# The package.json says "start": "bun dist/index.js". Let's build.

WORKDIR /app
RUN bun run build --filter=backend-server

WORKDIR /app/apps/httpServer

# Expose the API port (usually 3000 or defined in ENV)
EXPOSE 3001

CMD ["bun", "dist/index.js"]
