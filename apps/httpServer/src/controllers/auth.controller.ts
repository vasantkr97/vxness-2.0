import {type Request,type Response } from "express"
import jwt  from "jsonwebtoken"
import { prisma } from "@vxness/db"
import bcrypt from "bcryptjs"
import { SigninSchema, SignupSchema, type SigninType, type SignupType } from "../schemas/auth.zodType"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vasnth"

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

        const existingUser = await prisma.user.findUnique({where: {email}})

        if (existingUser) {
            return res.status(400).json({msg: "Email already exists, Please use a different one"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        })

        const token = jwt.sign({ id: user.id, email: user.email}, JWT_SECRET, { expiresIn: "7d"})
        
        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60*60*1000
        })

        return res.status(201).json({
            success: true,
            user: { id: user.id, email, username },
            token
        })
    } catch (error: any) {
        console.log("Signup failed:", error)
        return res.status(500).json({
            error: error.message
        })
    }
}

export async function signin(req: Request, res: Response): Promise<Response | void> {
    try {
        const validatedBody = SigninSchema.safeParse(req.body)

        if (!validatedBody.success) {
            return res.status(404).json({
                msg: "Invalid inputs"
            })
        }

        const query: SigninType = validatedBody.data

        const { email, password } = query

        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required"});
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(404).json({ error: "User not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "Invalid credentials-password not correct"
            })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60*60*1000,
        })

        return res.status(200).json({
            success: true,
            user: { id: user.id, email: user.email, username: user.username},
            token
        })

    } catch (error: any) {
        console.log("Signin failed", error)
        return res.status(500).json({
            error: error.message
        })
    }
}

export  function signout(req: Request, res: Response) {
    try {
        res.clearCookie("token")
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