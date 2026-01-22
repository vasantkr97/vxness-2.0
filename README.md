# Vxness 2.0 - High-Performance Cryptocurrency Trading Platform

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Bun](https://img.shields.io/badge/bun-1.2.23-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

**A production-ready, scalable cryptocurrency trading platform with real-time order matching, live market data streaming, and institutional-grade performance.**

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Vxness 2.0** is a full-stack, high-performance cryptocurrency trading platform engineered for scalability, low latency, and reliability. Built with a modern microservices architecture, it leverages cutting-edge technologies to deliver institutional-grade trading capabilities.

The platform features:
- **Real-time order matching** with sub-millisecond latency
- **Live market data streaming** via WebSocket connections
- **Scalable microservices** architecture with event-driven communication
- **Production-ready** Docker deployment with health checks and auto-restart
- **Modern UI/UX** with interactive charts and responsive design

---

## ✨ Features

### Trading Engine
- ⚡ **High-Performance Order Matching**: In-memory order book with optimized matching algorithms
- 📊 **Real-Time P&L Calculation**: Instant profit/loss tracking for open positions
- 🎯 **Advanced Order Types**: Market orders with take-profit and stop-loss support
- 💰 **Leverage Trading**: Configurable leverage up to customizable limits
- 🔄 **Automatic Risk Management**: Position liquidation and stop-loss execution
- 📈 **Multi-Asset Support**: BTC, ETH, SOL, and USDC trading pairs

### Market Data
- 🔴 **Live Price Feeds**: Real-time price updates from major exchanges (Binance integration)
- 📉 **Interactive Charts**: Advanced candlestick charts with TradingView-like experience
- 🌊 **WebSocket Streaming**: Low-latency market data delivery
- 📊 **Historical Data**: OHLCV candle data for technical analysis

### User Experience
- 🎨 **Modern UI**: Clean, responsive interface built with React 19
- 🔐 **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- 💼 **Portfolio Management**: Real-time balance tracking and position monitoring
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- ⚡ **Real-Time Updates**: Instant order status and balance updates

### Infrastructure
- 🏗️ **Microservices Architecture**: Independently scalable services
- 🐳 **Docker-Ready**: Complete containerization with Docker Compose
- 📦 **Monorepo Structure**: Efficient code sharing with Turborepo
- 🔄 **Event-Driven**: Redis Streams for reliable inter-service communication
- 💾 **Data Persistence**: PostgreSQL with Prisma ORM
- 🚀 **Production-Ready**: Health checks, graceful shutdowns, and auto-restart

---

## 🏗 Architecture

### System Overview

![Architecture](./apps/web/public/image.png)

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>React + Vite]
    end
    
    subgraph "API Gateway"
        HTTP[HTTP Server<br/>Express + WebSocket]
    end
    
    subgraph "Core Services"
        ENGINE[Trading Engine<br/>Order Matching]
        POLLER[Price Poller<br/>Market Data]
    end
    
    subgraph "Data Layer"
        REDIS[(Redis<br/>Streams + Cache)]
        POSTGRES[(PostgreSQL<br/>Persistent Storage)]
    end
    
    WEB <-->|HTTP/WS| HTTP
    HTTP <-->|REST API| POSTGRES
    HTTP <-->|Pub/Sub| REDIS
    ENGINE <-->|Order Events| REDIS
    ENGINE <-->|Batch Writes| POSTGRES
    POLLER -->|Price Updates| REDIS
    POLLER -.->|External API| BINANCE[Binance WebSocket]
    
    style WEB fill:#61dafb,stroke:#333,stroke-width:2px
    style ENGINE fill:#ff6b6b,stroke:#333,stroke-width:2px
    style REDIS fill:#dc382d,stroke:#333,stroke-width:2px
    style POSTGRES fill:#336791,stroke:#333,stroke-width:2px
```

### Data Flow

#### Order Placement Flow
```
User → Web UI → HTTP Server → Redis Stream → Trading Engine → Database
                     ↓                              ↓
                  WebSocket ← ← ← ← ← ← ← ← ← ← Callback
```

#### Price Update Flow
```
Binance → Price Poller → Redis Stream → Trading Engine → Risk Check
                              ↓
                         HTTP Server → WebSocket → User
```

### Component Details

#### 🌐 **Web Application** (`apps/web`)
- **Technology**: React 19, TypeScript, Vite
- **Features**: 
  - Real-time trading interface with lightweight-charts
  - Secure authentication flow with JWT
  - WebSocket integration for live updates
  - Responsive design with modern CSS
- **Key Pages**: Landing, Login, Signup, Trade, Wallet

#### 🔌 **HTTP Server** (`apps/httpServer`)
- **Technology**: Express.js, WebSocket (ws), Bun runtime
- **Responsibilities**:
  - RESTful API endpoints for authentication and trading
  - WebSocket server for real-time client updates
  - Request validation with Zod schemas
  - JWT token management with HTTP-only cookies
- **Endpoints**:
  - `/api/auth` - Authentication (login, signup, logout)
  - `/api/balance` - Wallet and balance management
  - `/api/orders` - Order creation and management
  - `/api/candles` - Historical price data

#### ⚙️ **Trading Engine** (`apps/tradingEngine`)
- **Technology**: Bun runtime, WebSocket, Redis Streams
- **Core Features**:
  - In-memory order book with O(1) order matching
  - Real-time P&L calculation with integer arithmetic
  - Automatic stop-loss and take-profit execution
  - Position liquidation on margin calls
  - Batch database writes for performance (configurable interval)
- **Key Algorithms**:
  - Integer-based price/quantity handling (avoids floating-point errors)
  - Event-driven architecture with Redis Streams
  - Optimistic balance management with rollback support

#### 📡 **Price Poller** (`apps/pricePoller`)
- **Technology**: WebSocket client, Redis Streams
- **Responsibilities**:
  - Connects to Binance WebSocket API
  - Subscribes to real-time price feeds (bookTicker)
  - Publishes price updates to Redis Streams
  - Automatic reconnection on connection loss
- **Supported Markets**: BTC/USDC, ETH/USDC, SOL/USDC

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with latest features |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **TanStack Query** | Server state management |
| **Lightweight Charts** | Professional trading charts |
| **Axios** | HTTP client with interceptors |
| **React Router** | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| **Bun** | Fast JavaScript runtime and package manager |
| **Express.js** | Web framework for HTTP server |
| **WebSocket (ws)** | Real-time bidirectional communication |
| **Prisma** | Type-safe ORM for database access |
| **Zod** | Runtime schema validation |
| **JWT** | Secure authentication tokens |
| **bcryptjs** | Password hashing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |
| **Redis** | In-memory data store and message broker |
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Turborepo** | Monorepo build system |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **TypeScript** | Static type checking |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Git** | Version control |

---

## 📁 Project Structure

```
vxness/
├── apps/                          # Application services
│   ├── web/                       # React frontend application
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── pages/             # Page components (Landing, Trade, etc.)
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── services/          # API service layer
│   │   │   ├── context/           # React context providers
│   │   │   └── lib/               # Utility functions
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── httpServer/                # Express API server
│   │   ├── src/
│   │   │   ├── controllers/       # Request handlers
│   │   │   ├── routes/            # API route definitions
│   │   │   ├── middleware/        # Auth and validation middleware
│   │   │   ├── schemas/           # Zod validation schemas
│   │   │   └── index.ts           # Server entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── tradingEngine/             # Order matching engine
│   │   ├── src/
│   │   │   └── index.ts           # Engine implementation
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── pricePoller/               # Market data service
│       ├── src/
│       │   └── index.ts           # WebSocket price feed
│       ├── Dockerfile
│       └── package.json
│
├── packages/                      # Shared packages
│   ├── db/                        # Database package
│   │   ├── prisma/
│   │   │   └── schema.prisma      # Database schema
│   │   ├── index.ts               # Prisma client export
│   │   └── package.json
│   │
│   ├── redis/                     # Redis client package
│   │   ├── index.ts               # Redis configuration
│   │   └── package.json
│   │
│   ├── types/                     # Shared TypeScript types
│   │   ├── index.ts               # Type definitions and constants
│   │   └── package.json
│   │
│   ├── ui/                        # Shared UI components
│   ├── eslint-config/             # Shared ESLint configuration
│   └── typescript-config/         # Shared TypeScript configuration
│
├── docker-compose.yml             # Development Docker setup
├── turbo.json                     # Turborepo configuration
├── package.json                   # Root package configuration
├── bun.lock                       # Dependency lock file
├── DEPLOY.md                      # Deployment guide
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Bun** >= 1.2.23 ([Installation Guide](https://bun.sh/docs/installation))
- **Node.js** >= 18 (for compatibility)
- **Docker** and **Docker Compose** ([Installation Guide](https://docs.docker.com/get-docker/))
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vasantkr97/vxness-2.0.git
   cd vxness
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```
   This will install all dependencies for the monorepo using Bun's fast package manager.

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://postgres:password123@localhost:5433/vxness?schema=public"
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password123
   POSTGRES_DB=vxness
   
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # API Configuration
   PORT=3000
   VITE_API_URL=http://localhost:3000
   ```

4. **Start Infrastructure Services**
   
   Start PostgreSQL and Redis using Docker:
   ```bash
   docker compose up -d postgres redis
   ```

5. **Initialize Database**
   
   Generate Prisma client and push schema to database:
   ```bash
   cd packages/db
   bun run db:generate
   bun run db:push
   cd ../..
   ```

6. **Start Development Servers**
   
   Run all services in development mode with hot-reloading:
   ```bash
   bun run dev
   ```

   This command uses Turborepo to start:
   - Web application on `http://localhost:5173`
   - HTTP server on `http://localhost:3000`
   - Trading engine (background service)
   - Price poller (background service)

7. **Access the Application**
   
   Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 💻 Development

### Available Scripts

Run these commands from the **root directory**:

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all services in development mode |
| `bun run build` | Build all applications and packages |
| `bun run start` | Start all services in production mode |
| `bun run lint` | Lint all codebases |
| `bun run check-types` | Run TypeScript type checking |
| `bun run format` | Format code with Prettier |

### Service-Specific Commands

Navigate to individual app directories to run service-specific commands:

```bash
# Web application
cd apps/web
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build

# HTTP Server
cd apps/httpServer
bun run dev          # Start with hot-reload
bun run build        # Build TypeScript
bun run start        # Start production server

# Trading Engine
cd apps/tradingEngine
bun run dev          # Start engine in dev mode
bun run build        # Build for production

# Price Poller
cd apps/pricePoller
bun run dev          # Start poller in dev mode
```

### Database Management

```bash
cd packages/db

# Generate Prisma client
bun run db:generate

# Push schema changes to database
bun run db:push

# Open Prisma Studio (database GUI)
bunx prisma studio
```

### Code Quality

```bash
# Lint all packages
bun run lint

# Type check all packages
bun run check-types

# Format all files
bun run format
```

### Debugging

#### View Service Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f http-server
docker compose logs -f trading-engine
docker compose logs -f price-poller
```

#### Redis Monitoring
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Monitor real-time commands
MONITOR

# View stream data
XREAD COUNT 10 STREAMS engine-stream 0
```

#### Database Inspection
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d vxness

# View tables
\dt

# Query orders
SELECT * FROM orders LIMIT 10;
```

---

## 🚢 Deployment

### Production Deployment with Docker

The platform is fully containerized and production-ready. Follow the [DEPLOY.md](./DEPLOY.md) guide for detailed deployment instructions.

#### Quick Start

1. **Configure Environment**
   
   Create a `.env` file with production values:
   ```env
   POSTGRES_PASSWORD=your-secure-password
   JWT_SECRET=your-production-jwt-secret
   VITE_API_URL=http://your-server-ip:3000
   ```

2. **Build and Start Services**
   ```bash
   docker compose up -d --build
   ```

3. **Verify Deployment**
   ```bash
   # Check service health
   curl http://localhost:3000/health
   
   # View running containers
   docker compose ps
   ```

#### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Web Application | 5173 | Frontend UI |
| HTTP Server | 3000 | REST API and WebSocket |
| PostgreSQL | 5433 | Database (mapped from 5432) |
| Redis | 6379 | Cache and message broker |

### Scaling Considerations

- **Trading Engine**: Currently runs as a single instance to avoid race conditions. For horizontal scaling, implement distributed locking or sharding by symbol.
- **HTTP Server**: Can be scaled horizontally behind a load balancer (Nginx, HAProxy).
- **Price Poller**: Single instance recommended to avoid duplicate price feeds.
- **Database**: Use PostgreSQL replication for read scaling.
- **Redis**: Consider Redis Cluster for high availability.

### Health Checks

All services include health check endpoints:
- HTTP Server: `GET /health`
- Docker health checks configured in `docker-compose.yml`

---

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "trader1"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Logout
```http
POST /api/auth/logout
Cookie: token=<jwt-token>
```

### Trading

#### Get Balance
```http
GET /api/balance
Cookie: token=<jwt-token>
```

#### Create Order
```http
POST /api/orders
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "symbol": "BTC",
  "side": "long",
  "quantity": "0.1",
  "leverage": 10,
  "takeProfitPrice": "105000",
  "stopLossPrice": "95000"
}
```

#### Get Orders
```http
GET /api/orders
Cookie: token=<jwt-token>
```

#### Close Order
```http
POST /api/orders/:orderId/close
Cookie: token=<jwt-token>
```

### Market Data

#### Get Candles
```http
GET /api/candles/:symbol?interval=1m&limit=100
```

### WebSocket Events

Connect to `ws://localhost:3000` with authentication cookie.

**Server → Client Events:**
```javascript
// Order status update
{
  "type": "order-update",
  "data": {
    "orderId": "uuid",
    "status": "closed",
    "closePrice": 100000,
    "pnl": 500
  }
}

// Balance update
{
  "type": "balance-update",
  "data": {
    "symbol": "USDC",
    "balance": "10500.00"
  }
}

// Price update
{
  "type": "price-update",
  "data": {
    "symbol": "BTC",
    "bid": 99500,
    "ask": 99550
  }
}
```

---

## 🏛️ Database Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Wallets (Assets)
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol ENUM('USDC', 'BTC', 'SOL', 'ETH'),
  balance_raw BIGINT NOT NULL,
  balance_decimals INT DEFAULT 8,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);
```

### Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol ENUM('USDC', 'BTC', 'SOL', 'ETH'),
  side ENUM('long', 'short'),
  status ENUM('open', 'closed') DEFAULT 'open',
  quantity BIGINT NOT NULL,
  quantity_decimals INT DEFAULT 2,
  open_price INT NOT NULL,
  close_price INT,
  price_decimals INT DEFAULT 2,
  leverage INT DEFAULT 1,
  margin_required INT NOT NULL,
  take_profit_price INT,
  stop_loss_price INT,
  realized_pnl INT,
  close_reason ENUM('take_profit', 'stop_loss', 'manual', 'liquidation'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);
```

---

## 🔧 Configuration

### Trading Engine Constants

Edit `packages/types/index.ts` to configure:

```typescript
export const ENGINE_CONSTANTS = {
  DB_FLUSH_INTERVAL_MS: 5000,        // Database write interval
  PRICE_DECIMALS: 2,                 // Price precision (cents)
  ORDER_PRECISION: 4,                // Order quantity precision
};

export const SYMBOL_DECIMALS = {
  BTC: 4,   // 0.0001 BTC minimum
  ETH: 3,   // 0.001 ETH minimum
  SOL: 2,   // 0.01 SOL minimum
  USDC: 2,  // 0.01 USDC minimum
};
```

### Redis Streams

```typescript
export const REDIS_ENGINE_CONSTANTS = {
  STREAM_KEY: "engine-stream",
  CONSUMER_GROUP: "engine-group",
  CONSUMER_NAME: "engine-1",
};
```

---

## 🧪 Testing

### Manual Testing

1. **Start the platform** in development mode
2. **Create an account** via the signup page
3. **Deposit funds** (automatically credited on signup)
4. **Place orders** with different parameters
5. **Monitor real-time updates** via WebSocket
6. **Test risk management** with stop-loss and take-profit

### Integration Testing

```bash
# Test database connection
cd packages/db
bunx prisma db push

# Test Redis connection
docker compose exec redis redis-cli ping

# Test API endpoints
curl http://localhost:3000/health
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/vxness-2.0.git
   cd vxness
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**
   ```bash
   bun run lint
   bun run check-types
   bun run build
   ```

5. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** rules
- Format with **Prettier**
- Write **descriptive variable names**
- Add **JSDoc comments** for public APIs

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or tooling changes

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Binance** for providing WebSocket market data API
- **TradingView** for charting inspiration
- **Prisma** for excellent ORM tooling
- **Bun** team for the blazing-fast runtime
- **Turborepo** for monorepo management

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/vasantkr97/vxness-2.0/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vasantkr97/vxness-2.0/discussions)
- **Email**: support@vxness.com

---

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core trading engine
- [x] Real-time price feeds
- [x] Basic order types
- [x] WebSocket integration
- [x] Docker deployment

### Phase 2 (Planned)
- [ ] Advanced order types (limit, stop-limit)
- [ ] Order book visualization
- [ ] Trading history and analytics
- [ ] Mobile application
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Algorithmic trading API
- [ ] Social trading features
- [ ] Advanced charting tools
- [ ] Risk management dashboard
- [ ] Institutional features

---

<div align="center">

**Built with ❤️ by the Vxness Team**

⭐ **Star this repo** if you find it useful!

[Report Bug](https://github.com/vasantkr97/vxness-2.0/issues) · [Request Feature](https://github.com/vasantkr97/vxness-2.0/issues) · [Documentation](https://github.com/vasantkr97/vxness-2.0/wiki)

</div>
