import "dotenv/config"

const nodeEnv = process.env.NODE_ENV ?? "development"
const isProduction = nodeEnv === "production"

const jwtSecret = process.env.JWT_SECRET?.trim()
const frontendUrl = process.env.FRONTEND_URL?.trim()

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error("JWT_SECRET must be at least 32 characters in production")
}

if (isProduction && !frontendUrl) {
    throw new Error("FRONTEND_URL is required in production")
}

export const env = {
    nodeEnv,
    isProduction,
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: jwtSecret || "vxness-local-development-secret",
    frontendUrl,
}
