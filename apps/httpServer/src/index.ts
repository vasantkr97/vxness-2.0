import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes"
import balanceRoutes from "./routes/balance.routes"
import candlesRoutes from "./routes/candles.routes"
import orderRoutes from "./routes/orders.routes"
import { env } from "./config/env"
import { createRateLimiter } from "./middleware/rateLimit"
import { securityHeaders } from "./middleware/security"

const app = express()

if (env.isProduction) {
    app.set("trust proxy", 1)
}

app.use(cors({
    origin: env.isProduction
        ? env.frontendUrl
        : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}))

const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 300,
    message: "Too many requests. Please slow down.",
})

app.use(securityHeaders)
app.use(express.json({ limit: "32kb" }))

app.use(cookieParser())
app.use("/api", apiRateLimiter)

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString()
    })
})


app.use("/api/candles", candlesRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/balance", balanceRoutes)
app.use("/api/orders", orderRoutes)

app.listen(env.port, () => {
    console.log(`API Service running on port ${env.port}`)
    console.log(`Health check available at http://localhost:${env.port}/health `)
})
