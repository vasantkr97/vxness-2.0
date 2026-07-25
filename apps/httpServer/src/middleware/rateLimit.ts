import type { NextFunction, Request, Response } from "express"

interface RateLimitOptions {
    windowMs: number
    maxRequests: number
    message: string
}

interface ClientWindow {
    count: number
    resetAt: number
}

export function createRateLimiter({ windowMs, maxRequests, message }: RateLimitOptions) {
    const clients = new Map<string, ClientWindow>()

    const cleanup = setInterval(() => {
        const now = Date.now()

        for (const [key, clientWindow] of clients) {
            if (clientWindow.resetAt <= now) {
                clients.delete(key)
            }
        }
    }, windowMs)

    cleanup.unref()

    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now()
        const key = req.ip || req.socket.remoteAddress || "unknown"
        const existingWindow = clients.get(key)
        const clientWindow = !existingWindow || existingWindow.resetAt <= now
            ? { count: 0, resetAt: now + windowMs }
            : existingWindow

        clientWindow.count += 1
        clients.set(key, clientWindow)

        res.setHeader("RateLimit-Limit", maxRequests)
        res.setHeader("RateLimit-Remaining", Math.max(0, maxRequests - clientWindow.count))
        res.setHeader("RateLimit-Reset", Math.ceil(clientWindow.resetAt / 1000))

        if (clientWindow.count > maxRequests) {
            res.status(429).json({
                error: message,
                code: "RATE_LIMITED",
            })
            return
        }

        next()
    }
}
