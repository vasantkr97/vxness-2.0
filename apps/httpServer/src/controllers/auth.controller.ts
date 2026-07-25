import { type Request, type Response } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "@vxness/db"
import bcrypt from "bcryptjs"
import { SigninSchema, SignupSchema, type SigninType, type SignupType } from "../schemas/auth.zodType"
import {
    AUTH_COOKIE_NAME,
    AUTH_SESSION_SECONDS,
    authCookieClearOptions,
    authCookieOptions,
} from "../config/auth"
import { env } from "../config/env"

export async function signup(req: Request, res: Response): Promise<Response | void>  {
    try {
        const validatedBody = SignupSchema.safeParse(req.body)

        if (!validatedBody.success) {
            return res.status(400).json({
                msg: "Invalid Input"
            })
        }
        
        //Parsed.data is now fully typed, validated
        const query: SignupType = validatedBody.data
        
        const { email, username, password } = query;

        if (!email || !password || !username) {
            return res.status(400).json({msg: "All fields are requied."})
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
            select: {
                email: true,
                username: true,
            },
        })

        if (existingUser) {
            const emailTaken = existingUser.email === email
            return res.status(409).json({
                error: emailTaken
                    ? "An account already exists for this email."
                    : "This username is already taken.",
                code: emailTaken ? "EMAIL_TAKEN" : "USERNAME_TAKEN",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        })

        const token = jwt.sign(
            { id: user.id, email: user.email },
            env.jwtSecret,
            { expiresIn: AUTH_SESSION_SECONDS },
        )
        
        res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)

        return res.status(201).json({
            success: true,
            user: { id: user.id, email, username },
        })
    } catch (error) {
        console.error("Signup failed:", error)
        return res.status(500).json({
            error: "Vxness could not create your account right now. Please try again.",
            code: "SIGNUP_FAILED",
        })
    }
}

export async function signin(req: Request, res: Response): Promise<Response | void> {
    try {
        const validatedBody = SigninSchema.safeParse(req.body)

        if (!validatedBody.success) {
            return res.status(400).json({
                error: "Enter a valid email and a password with at least 6 characters.",
                code: "INVALID_INPUT"
            })
        }

        const query: SigninType = validatedBody.data

        const { email, password } = query

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required.",
                code: "MISSING_CREDENTIALS"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(404).json({
                error: "No account exists for this email. Create an account first.",
                code: "ACCOUNT_NOT_FOUND"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "The password you entered is incorrect.",
                code: "INVALID_PASSWORD"
            })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            env.jwtSecret,
            { expiresIn: AUTH_SESSION_SECONDS }
        )

        res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)

        return res.status(200).json({
            success: true,
            user: { id: user.id, email: user.email, username: user.username},
        })

    } catch (error) {
        console.log("Signin failed", error)
        return res.status(500).json({
            error: "Vxness could not sign you in right now. Please try again.",
            code: "SIGNIN_FAILED"
        })
    }
}

export function signout(_req: Request, res: Response) {
    try {
        res.clearCookie(AUTH_COOKIE_NAME, authCookieClearOptions)
        return res.status(200).json({ msg: "signed out successfully"})
    } catch (error) {
        console.log("signout error", error)
        res.status(500).json({ error: "Internal server error"})
    }
}

export async function me(req: Request, res: Response): Promise<Response | void> {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not Authenticated"})
        }

        const findUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, username: true}
        })

        if (!findUser) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        res.json({
            user: findUser
        })

    } catch (error) {
        console.log("Get user error:", error);
        res.status(500).json({ error: "internal server error"})
    }
}
