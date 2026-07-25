import Redis from "ioredis"

export function createRedisClient() {
    const host = process.env.REDIS_HOST || "127.0.0.1"
    const port = Number(process.env.REDIS_PORT || 6379)
    const password = process.env.REDIS_PASSWORD || undefined
    const tls = process.env.REDIS_TLS === "true" ? {} : undefined

    const client = new Redis({
        host,
        port,
        password,
        tls,
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    })

    client.on("error", (error) => {
        console.error("Redis error:", error)
    })

    client.on("connect", () => {
        console.log(`Redis connected at ${host}:${port}`)
    })

    return client
}

//main redis (non-blocking, singleton, single global client)
export const redis = createRedisClient()

//main redis connection (blocking)
//export const redisBlocking = createdRedisClient()

export default createRedisClient
