# Vxness Trading Platform

**Vxness** is a high-performance, full-stack cryptocurrency trading platform designed for scalability and real-time order matching. It features a modern microservices-based architecture managed within a monorepo, utilizing advanced technologies like **Bun**, **Turbo**, **Redis**, and **Docker** to ensure low latency and high reliability.

## 🚀 Features

- **Real-time Trading Engine**: High-performance, in-memory order matching engine.
- **Live Market Data**: WebSocket-based real-time price updates and order book streaming.
- **Interactive UI**: A modern, responsive web interface built with React and Vite, featuring advanced charting with `lightweight-charts`.
- **Secure Authentication**: Robust JWT-based authentication system.
- **Scalable Architecture**: Microservices design with Redis for messaging and Postgres for persistence.
- **Monorepo Management**: Efficient development workflow powered by Turborepo and Bun.

## 🏗 Architecture

The platform consists of several interconnected services:

```mermaid
graph TD
    Client[Web Client] <-->|HTTP/WS| HTTPServer[HTTP Server]
    Client <-->|WS| Proxy[Reverse Proxy / LB]
    Proxy <--> HTTPServer
    HTTPServer <-->|Pub/Sub| Redis[(Redis)]
    HTTPServer <-->|SQL| DB[(PostgreSQL)]
    
    PricePoller[Price Poller] -->|Push Prices| Redis
    TradingEngine[Trading Engine] <-->|Order Events| Redis
    TradingEngine <-->|Persist| DB
```

### Components

#### Apps (`/apps`)
- **`web`**: The frontend application. Built with **React**, **Vite**, and **TypeScript**. Features real-time charts and order management.
- **`httpServer`**: The core API gateway. Built with **Node.js/Express**. Handles user authentication, API requests, and WebSocket connections.
- **`tradingEngine`**: The heart of the platform. A dedicated service for matching buy/sell orders and managing order books in real-time.
- **`pricePoller`**: A specialized service that polls or streams external market prices and publishes them to the system.

#### Packages (`/packages`)
- **`@vxness/db`**: Shared database schema and client (Prisma).
- **`@vxness/redis`**: Shared Redis configuration and client factory.
- **`@vxness/ui`**: Shared UI component library.
- **`@vxness/types`**: Shared TypeScript definitions and interfaces (DTOs, Events).
- **`@vxness/eslint-config`** & **`@vxness/typescript-config`**: Shared configuration for code quality and consistency.

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh) (Package Manager & Runtime)
- **Monorepo**: [Turborepo](https://turbo.build)
- **Frontend**: React, Vite, TailwindCSS (assumed), Lightweight Charts
- **Backend**: Node.js, Express, WebSocket (`ws`)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io)
- **Messaging/Caching**: [Redis](https://redis.io)
- **DevOps**: Docker, Docker Compose

## ⚡ Getting Started

### Prerequisites

Ensure you have the following installed:
- **Bun** (v1.2.23 or later)
- **Docker** & **Docker Compose**
- **Node.js** (v18 or later)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd vxness
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Environment Setup:**
    Ensure you have a `.env` file in the root or relevant app directories. A typical `.env` might look like:
    ```env
    DATABASE_URL="postgresql://postgres:password123@localhost:5432/vxness?schema=public"
    REDIS_URL="redis://localhost:6379"
    ```

### Running Locally (Development)

To start the entire stack in development mode (hot-reloading):

1.  **Start Infrastructure (DB & Redis):**
    ```bash
    docker-compose up -d postgres redis
    ```

2.  **Start Applications:**
    ```bash
    bun run dev
    ```
    This command uses Turbo to run the `dev` script in all applications simultaneously.

### Running in Production (Docker)

To build and run the entire platform using Docker Compose:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

This will spin up:
- Postgres Database
- Redis
- HTTP Server (Port 3001)
- Trading Engine
- Price Poller
- Web Client (Port 80/443)

## 📜 Scripts

Run these commands from the root directory:

- `bun run build`: Build all applications and packages.
- `bun run dev`: Start all applications in development mode.
- `bun run lint`: Lint all codebases.
- `bun run check-types`: Run Type checking across the monorepo.
- `bun run format`: Format code using Prettier.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

Built with ❤️ by the Vxness Team.
