import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}))

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
app.use("/api/orders", orderRoutes)
app.use("/api/trade", tradeRoutes)


app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`)
    console.log(`Health check available `)
})