import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "@vxness/db"
import { AUTH_COOKIE_NAME } from "../config/auth"
import { env } from "../config/env"

interface AuthTokenPayload {
    id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.cookies?.[AUTH_COOKIE_NAME];

        if (!token) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized user"
            })
            return
        }

        let payload: AuthTokenPayload;

        payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true }
        });

        if (!user) {
            res.status(401).json({ status: "error", message: "User not found" })
            return
        }

        req.user = { id: user.id, email: user.email }
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({
            error: "Your session is invalid or has expired.",
            code: "INVALID_SESSION",
        })
        return
    }
}
