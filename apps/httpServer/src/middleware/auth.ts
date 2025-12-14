import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "@vxness/db"

const JWT_SECRET = process.env.JWT_SECRET || "vasanth"

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
        const token = req.cookies?.jwt;

        if (!token) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized user"
            })
            return
        }

        let payload: AuthTokenPayload;

        payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true }
        });

        if (!user) {
            res.status(401).json({ status: "error", message: "User not found" })
            return
        }

        //req.user = user
        req.user = { id: user.id, email: user.email }
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            error: "invalid or expired token"
        })
        return
    }
}