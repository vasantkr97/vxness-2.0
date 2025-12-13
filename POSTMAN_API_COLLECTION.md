# VXNESS API - Postman Testing Guide

This document provides all API endpoints with their request bodies and URLs for testing in Postman.

**Base URL:** `http://localhost:3000`

---

## 📋 Table of Contents
1. [Health Check](#health-check)
2. [Authentication APIs](#authentication-apis)
3. [Balance APIs](#balance-apis)
4. [Candles APIs](#candles-apis)
5. [Orders APIs](#orders-apis)

---

## Health Check

### GET /health
Check if the server is running.

**URL:** `http://localhost:3000/health`

**Method:** GET

**Headers:** None required

**Body:** None

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-13T09:14:59.000Z"
}
```

---

## Authentication APIs

### 1. Sign Up (Create New User)

**URL:** `http://localhost:3000/api/auth/signup`

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Request Body Example 1:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Request Body Example 2:**
```json
{
  "username": "alicetrader",
  "email": "alice.trader@example.com",
  "password": "securePass456"
}
```

**Request Body Example 3:**
```json
{
  "username": "cryptoking",
  "email": "cryptoking@trading.com",
  "password": "myStrongPassword789"
}
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token-here"
}
```

---

### 2. Sign In (Login)

**URL:** `http://localhost:3000/api/auth/signin`

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Request Body Example 1:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Request Body Example 2:**
```json
{
  "email": "alice.trader@example.com",
  "password": "securePass456"
}
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token-here"
}
```

---

### 3. Sign Out (Logout)

**URL:** `http://localhost:3000/api/auth/signout`

**Method:** POST

**Headers:** None required

**Body:** None

**Expected Success Response (200):**
```json
{
  "msg": "signed out successfully"
}
```

---

### 4. Get Current User (Me)

**URL:** `http://localhost:3000/api/auth/me`

**Method:** GET

**Headers:**
```
Cookie: jwt=<your-jwt-token>
```

**Body:** None

**Expected Success Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

---

## Balance APIs

> **⚠️ All Balance APIs require authentication. Include the JWT token in cookies.**

### 1. Get All Balances

**URL:** `http://localhost:3000/api/balance`

**Method:** GET

**Headers:**
```
Cookie: jwt=<your-jwt-token>
```

**Body:** None

**Expected Success Response (200):**
```json
{
  "userId": "user-uuid",
  "balances": [
    {
      "symbol": "BTC",
      "balanceRaw": "100000000",
      "balanceDecimals": 8
    },
    {
      "symbol": "ETH",
      "balanceRaw": "1000000000000000000",
      "balanceDecimals": 18
    },
    {
      "symbol": "SOL",
      "balanceRaw": "1000000000",
      "balanceDecimals": 9
    },
    {
      "symbol": "USDC",
      "balanceRaw": "1000000",
      "balanceDecimals": 6
    }
  ]
}
```

---

### 2. Get Balance by Symbol

**URL:** `http://localhost:3000/api/balance/:symbol`

**Example URLs:**
- `http://localhost:3000/api/balance/BTC`
- `http://localhost:3000/api/balance/ETH`
- `http://localhost:3000/api/balance/SOL`
- `http://localhost:3000/api/balance/USDC`

**Method:** GET

**Headers:**
```
Cookie: jwt=<your-jwt-token>
```

**URL Parameters:**
- `symbol` (required): One of: `BTC`, `ETH`, `SOL`, `USDC`

**Body:** None

**Expected Success Response (200):**
```json
{
  "symbol": "BTC",
  "balanceRaw": "100000000",
  "balanceDecimals": 8
}
```

---

### 3. Deposit to Wallet

**URL:** `http://localhost:3000/api/balance/deposit`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Cookie: jwt=<your-jwt-token>
```

**Valid Symbols:**
- `BTC` (8 decimals)
- `ETH` (18 decimals)
- `SOL` (9 decimals)
- `USDC` (6 decimals)

#### Request Body Examples:

**Example 1: Deposit 1 BTC**
```json
{
  "symbol": "BTC",
  "amount": 1
}
```

**Example 2: Deposit 0.5 BTC**
```json
{
  "symbol": "BTC",
  "amount": 0.5
}
```

**Example 3: Deposit 10 ETH**
```json
{
  "symbol": "ETH",
  "amount": 10
}
```

**Example 4: Deposit 2.75 ETH**
```json
{
  "symbol": "ETH",
  "amount": 2.75
}
```

**Example 5: Deposit 500 SOL**
```json
{
  "symbol": "SOL",
  "amount": 500
}
```

**Example 6: Deposit 100.5 SOL**
```json
{
  "symbol": "SOL",
  "amount": 100.5
}
```

**Example 7: Deposit 1000 USDC**
```json
{
  "symbol": "USDC",
  "amount": 1000
}
```

**Example 8: Deposit 5000 USDC**
```json
{
  "symbol": "USDC",
  "amount": 5000
}
```

**Example 9: Deposit with explicit decimals (optional)**
```json
{
  "symbol": "BTC",
  "amount": 1.5,
  "decimals": 8
}
```

**Expected Success Response (200):**
```json
{
  "symbol": "BTC",
  "balanceRaw": "150000000",
  "balanceDecimals": 8
}
```

---

## Candles APIs

### Get Candles (OHLCV Data)

**URL:** `http://localhost:3000/api/candles`

**Method:** GET

**Headers:** None required (public endpoint)

**Query Parameters:**
- `asset` (required): Asset symbol
- `timeFrame` (required): Time interval

**Valid Assets:**
- `BTCUSDT` / `BTCUSDC`
- `ETHUSDT` / `ETHUSDC`
- `SOLUSDT` / `SOLUSDC`

**Valid TimeFrames:**
- `1m`, `3m`, `5m`, `15m`, `30m`
- `1h`, `2h`, `4h`, `6h`, `8h`, `12h`
- `1d`, `3d`, `1w`, `1M`

#### Example URLs:

**Example 1: BTC 1-hour candles**
```
http://localhost:3000/api/candles?asset=BTCUSDT&timeFrame=1h
```

**Example 2: ETH 15-minute candles**
```
http://localhost:3000/api/candles?asset=ETHUSDT&timeFrame=15m
```

**Example 3: SOL daily candles**
```
http://localhost:3000/api/candles?asset=SOLUSDT&timeFrame=1d
```

**Example 4: BTC 4-hour candles**
```
http://localhost:3000/api/candles?asset=BTCUSDC&timeFrame=4h
```

**Example 5: ETH 5-minute candles**
```
http://localhost:3000/api/candles?asset=ETHUSDC&timeFrame=5m
```

**Example 6: SOL 1-hour candles**
```
http://localhost:3000/api/candles?asset=SOLUSDC&timeFrame=1h
```

**Expected Success Response (200):**
```json
{
  "data": [
    {
      "bucket": 1702468800,
      "symbol": "BTCUSDT",
      "open": 43250.5,
      "high": 43500.75,
      "low": 43100.25,
      "close": 43300.0,
      "volume": 125.5,
      "time": 1702468800
    }
  ]
}
```

---

## Orders APIs

> **⚠️ All Order APIs require authentication. Include the JWT token in cookies.**

### 1. Create Order (Long/Short)

**URL:** `http://localhost:3000/api/orders`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Cookie: jwt=<your-jwt-token>
```

**Field Details:**
- `asset` (required): Asset symbol - `BTC`, `ETH`, `SOL`
- `side` (required): Order direction - `long` or `short`
- `qty` (required): Quantity to trade (number)
- `leverage` (required): Leverage multiplier (number, e.g., 1-100)
- `takeProfit` (optional): Take profit price (number)
- `stopLoss` (optional): Stop loss price (number)

#### Request Body Examples:

**Example 1: Long BTC with 10x leverage (basic)**
```json
{
  "asset": "BTC",
  "side": "long",
  "qty": 0.5,
  "leverage": 10
}
```

**Example 2: Long BTC with 20x leverage + TP/SL**
```json
{
  "asset": "BTC",
  "side": "long",
  "qty": 0.1,
  "leverage": 20,
  "takeProfit": 50000,
  "stopLoss": 40000
}
```

**Example 3: Short BTC with 5x leverage + TP/SL**
```json
{
  "asset": "BTC",
  "side": "short",
  "qty": 0.25,
  "leverage": 5,
  "takeProfit": 42000,
  "stopLoss": 45000
}
```

**Example 4: Long ETH with 15x leverage (basic)**
```json
{
  "asset": "ETH",
  "side": "long",
  "qty": 5,
  "leverage": 15
}
```

**Example 5: Short ETH with 5x leverage + TP/SL**
```json
{
  "asset": "ETH",
  "side": "short",
  "qty": 2.5,
  "leverage": 5,
  "takeProfit": 2500,
  "stopLoss": 2800
}
```

**Example 6: Long ETH with 10x leverage + TP/SL**
```json
{
  "asset": "ETH",
  "side": "long",
  "qty": 3.0,
  "leverage": 10,
  "takeProfit": 3000,
  "stopLoss": 2400
}
```

**Example 7: Long SOL with 20x leverage (basic)**
```json
{
  "asset": "SOL",
  "side": "long",
  "qty": 100,
  "leverage": 20
}
```

**Example 8: Short SOL with 3x leverage + TP/SL**
```json
{
  "asset": "SOL",
  "side": "short",
  "qty": 100,
  "leverage": 3,
  "takeProfit": 90,
  "stopLoss": 110
}
```

**Example 9: Long SOL with 10x leverage + TP/SL**
```json
{
  "asset": "SOL",
  "side": "long",
  "qty": 50,
  "leverage": 10,
  "takeProfit": 120,
  "stopLoss": 95
}
```

**Example 10: Conservative long BTC with 2x leverage**
```json
{
  "asset": "BTC",
  "side": "long",
  "qty": 1.0,
  "leverage": 2,
  "takeProfit": 46000,
  "stopLoss": 43000
}
```

**Expected Success Response (201):**
```json
{
  "message": "Order created Successfully",
  "orderId": "uuid-order-id"
}
```

**Possible Error Responses:**
- 400: Insufficient balance
- 400: Price not available
- 400: Invalid size
- 504: Gateway timeout

---

### 2. Get All Orders

**URL:** `http://localhost:3000/api/orders`

**Method:** GET

**Headers:**
```
Cookie: jwt=<your-jwt-token>
```

**Body:** None

**Expected Success Response (200):**
```json
{
  "orders": [
    {
      "id": "order-uuid-1",
      "symbol": "BTC",
      "orderType": "long",
      "quantity": 0.5,
      "price": 43500.0,
      "status": "open",
      "pnl": null,
      "createdAt": "2025-12-13T09:00:00.000Z",
      "closedAt": null,
      "exitPrice": null,
      "leverage": 10,
      "takeProfit": 50000,
      "stopLoss": 40000,
      "closeReason": null
    },
    {
      "id": "order-uuid-2",
      "symbol": "ETH",
      "orderType": "short",
      "quantity": 2.5,
      "price": 2650.0,
      "status": "closed",
      "pnl": 125.50,
      "createdAt": "2025-12-12T14:30:00.000Z",
      "closedAt": "2025-12-13T08:30:00.000Z",
      "exitPrice": 2600.0,
      "leverage": 5,
      "takeProfit": 2500,
      "stopLoss": 2800,
      "closeReason": "TakeProfit"
    }
  ]
}
```

---

### 3. Get Order by ID

**URL:** `http://localhost:3000/api/orders/:orderId`

**Example:** `http://localhost:3000/api/orders/abc123-order-uuid`

**Method:** GET

**Headers:**
```
Cookie: jwt=<your-jwt-token>
```

**URL Parameters:**
- `orderId` (required): The UUID of the order

**Body:** None

**Expected Success Response (200):**
```json
{
  "msg": "order fetched successfully",
  "order": {
    "id": "abc123-order-uuid",
    "symbol": "BTC",
    "orderType": "long",
    "quantity": 0.5,
    "price": 43500.0,
    "status": "open",
    "pnl": null,
    "createdAt": "2025-12-13T09:00:00.000Z",
    "closedAt": null,
    "exitPrice": null,
    "leverage": 10,
    "takeProfit": 50000,
    "stopLoss": 40000,
    "closeReason": null
  }
}
```

---

### 4. Close Order

**URL:** `http://localhost:3000/api/orders/:orderId/close`

**Example:** `http://localhost:3000/api/orders/abc123-order-uuid/close`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Cookie: jwt=<your-jwt-token>
```

**URL Parameters:**
- `orderId` (required): The UUID of the order to close

**Valid Close Reasons:**
- `TakeProfit`
- `StopLoss`
- `Manual`
- `Liquidation`

#### Request Body Examples:

**Example 1: Close manually (default)**
```json
{
  "closeReason": "Manual"
}
```

**Example 2: Close at take profit**
```json
{
  "closeReason": "TakeProfit"
}
```

**Example 3: Close at stop loss**
```json
{
  "closeReason": "StopLoss"
}
```

**Example 4: Close due to liquidation**
```json
{
  "closeReason": "Liquidation"
}
```

**Example 5: Close without reason (defaults to Manual)**
```json
{}
```

**Expected Success Response (200):**
```json
{
  "message": "Order closed successfully",
  "orderId": "abc123-order-uuid",
  "finalPnl": 150.25
}
```

**Possible Error Responses:**
- 404: Order not found or already closed
- 504: Gateway timeout

---

## 🔐 Authentication Notes

### Setting up Authentication in Postman:

1. **After Sign In/Sign Up:**
   - The server sends a JWT token in the response
   - It's also set as an HTTP-only cookie named "jwt"

2. **For Protected Endpoints:**
   - Postman should automatically include cookies
   - If not, manually add the cookie header:
     ```
     Cookie: jwt=<your-token-here>
     ```

3. **Testing Flow:**
   ```
   1. POST /api/auth/signup (create account)
   2. Copy the token from response
   3. Use that token/cookie for all subsequent requests
   ```

---

## 📝 Quick Test Scenarios

### Scenario 1: New User Registration & Initial Deposit
```
1. POST /api/auth/signup
   Body: {"username": "trader1", "email": "trader1@example.com", "password": "pass123"}

2. POST /api/balance/deposit
   Body: {"symbol": "USDC", "amount": 10000}

3. POST /api/balance/deposit
   Body: {"symbol": "BTC", "amount": 0.5}

4. POST /api/balance/deposit
   Body: {"symbol": "ETH", "amount": 5}

5. GET /api/balance (verify all balances)
```

### Scenario 2: Place Multiple Orders
```
1. POST /api/auth/signin
   Body: {"email": "trader1@example.com", "password": "pass123"}

2. GET /api/balance (check initial balance)

3. POST /api/orders
   Body: {"asset": "BTC", "side": "long", "qty": 0.1, "leverage": 10, "takeProfit": 50000, "stopLoss": 40000}

4. POST /api/orders
   Body: {"asset": "ETH", "side": "long", "qty": 2, "leverage": 5, "takeProfit": 3000, "stopLoss": 2400}

5. GET /api/orders (verify both orders created)
```

### Scenario 3: Close and Check PnL
```
1. GET /api/orders (get list of open orders)

2. POST /api/orders/{orderId}/close
   Body: {"closeReason": "Manual"}

3. GET /api/orders (check PnL on closed order)

4. GET /api/balance (verify balance updated)
```

### Scenario 4: Market Data Analysis
```
1. GET /api/candles?asset=BTCUSDT&timeFrame=1h

2. GET /api/candles?asset=ETHUSDT&timeFrame=15m

3. GET /api/candles?asset=SOLUSDT&timeFrame=1d
```

---

## 🐛 Common Error Codes

- **400 Bad Request:** Invalid input or validation error
- **401 Unauthorized:** Missing or invalid JWT token
- **404 Not Found:** Resource doesn't exist
- **500 Internal Server Error:** Server-side error
- **504 Gateway Timeout:** Trading engine timeout (usually 10s)

---

## 💡 Tips for Postman

1. **Create Environment Variables:**
   - `baseUrl`: `http://localhost:3000`
   - `jwtToken`: (set after login)
   - `userId`: (set after login)
   - `orderId`: (save after creating order)

2. **Use Collections:**
   - Group APIs by category (Auth, Balance, Orders, Candles)
   - Set up pre-request scripts to auto-include auth headers

3. **Save Test Scripts:**
   ```javascript
   // Auto-save JWT token after login
   pm.test("Save JWT token", function () {
       var jsonData = pm.response.json();
       pm.environment.set("jwtToken", jsonData.token);
   });

   // Auto-save orderId after creating order
   pm.test("Save order ID", function () {
       var jsonData = pm.response.json();
       pm.environment.set("orderId", jsonData.orderId);
   });
   ```

---

**Document Last Updated:** December 13, 2025  
**API Version:** 1.0  
**Server:** http://localhost:3000
