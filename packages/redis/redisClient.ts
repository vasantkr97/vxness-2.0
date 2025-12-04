import Redis from "ioredis"

export function createRedisClient() {

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

//main redis (non-blocking, singleton, single global client)
export const redis = createRedisClient()

//main redis connection (blocking)
//export const redisBlocking = createdRedisClient()

export default createRedisClient