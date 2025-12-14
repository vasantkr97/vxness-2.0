import { WebSocket } from "ws";
import { type PriceEvent, CONFIG } from "@vxness/types";
import { createRedisClient } from "@vxness/redis";



const redisClient = createRedisClient();


async function streamToRedis(payload: unknown): Promise<void> {
    try {

        const parsed = payload as any;

        const priceData = parsed.data;

        if (!priceData) {
            console.warn("No data field in message:", payload);
            return;
        }

        //console.log("[Poller] Sending priceData:", priceData); 

        const event: PriceEvent = {
            kind: "price-update",
            payload: priceData,
            receivedAt: Date.now()
        }

        await redisClient.xadd(
            CONFIG.streamKey,
            "*",
            "data",
            JSON.stringify(event)
        );
    } catch (error) {
        console.error("Failed to push to stream:", error);
    }
}


function parseMessage(data: any) {
    try {
        return JSON.parse(data.toString());
    } catch (err) {
        console.warn("Received non-JSON message:", data.toString())
    }
}


function connectToExchange() {
    console.log(`Connecting to ${CONFIG.wsUrl}...`);

    const ws = new WebSocket(CONFIG.wsUrl);

    ws.on('open', () => {
        console.log("Web Socket Connected...");

        const payload = {
            method: "SUBSCRIBE",
            params: CONFIG.markets.map((m) => `bookTicker.${m}`),
            id: Date.now(),
        }

        ws.send(JSON.stringify(payload));
        console.log(`WebSocket subscribed to: ${CONFIG.markets.join(", ")}`);
    })

    ws.on("message", async (data) => {
        const parsed = parseMessage(data);

        if (parsed) {
            //console.log("REceived:", JSON.stringify(parsed))
            await streamToRedis(parsed);
        }
    })

    ws.on("error", (err) => {
        console.error("WebSocket observed:", err.message);
    })

    ws.on("close", () => {
        console.warn(`WebSocket Connection closed. Retrying in ${CONFIG.reconnectIntervalMs / 1000}s...`)

        setTimeout(connectToExchange, CONFIG.reconnectIntervalMs)
    })

    return ws
}

async function startService() {
    console.log("Starting Price Poller Service...");

    redisClient.on("error", (err) => console.error("Redis client Error:", err));

    redisClient.on("ready", () => {
        console.log("Redis connected. Starting WebSocket listener...")
        connectToExchange();
    })

    const shutdown = async () => {
        console.log("Shutting down service...")
        try {
            await redisClient.quit();
        } finally {
            process.exit(0);
        }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

startService();
