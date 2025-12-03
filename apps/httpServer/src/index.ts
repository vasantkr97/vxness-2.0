import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes"
import balanceRoutes from "./routes/balance.routes"
import candlesRoutes from "./routes/candles.routes"

dotenv.config();

const app = express()

app.use(cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}))

const PORT = process.env.PORT || 3000;

app.use(express.json())

app.use(cookieParser())

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString()
    })
})


app.use("/api/candles", candlesRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/balance", balanceRoutes)
// app.use("/api/trade", tradeRoutes)
//app.use("/api/positions", positions)

app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`)
    console.log(`Health check available at http://localhost:${PORT}/health `)
})