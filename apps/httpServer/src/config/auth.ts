import type { CookieOptions } from "express"
import { env } from "./env"

export const AUTH_COOKIE_NAME = "jwt"
export const AUTH_SESSION_SECONDS = 60 * 60 * 24 * 7

export const authCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: AUTH_SESSION_SECONDS * 1000,
    path: "/",
}

export const authCookieClearOptions: CookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
}
