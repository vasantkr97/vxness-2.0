FROM oven/bun:1

WORKDIR /app

# Copy root files
COPY package.json bun.lock turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN bun install

# Run the price-poller
WORKDIR /app/apps/pricePoller

# Similar to tradingEngine, run directly with Bun
CMD ["bun", "src/index.ts"]
