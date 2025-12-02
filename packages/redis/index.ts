import Redis from "ioredis"

export function createdRedisClient() {

    const host = process.env.REDIS_HOST || "redis";
    const port = Number(process.env.REDIS_PORT || 6379)

    const client = new Redis({ host, port })

    client.on("error", (error) => {
        console.error("Redis error:", error)
    })

    client.on("connect", () => {
        console.log(`Redis connected at ${host}:${port}`)
    })

    return client
}

export const redis = createdRedisClient()