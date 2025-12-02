import { z } from "zod"

export const SigninSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
})

export const SignupSchema = z.object({
    username: z.string(),
    email: z.email(),
    password: z.string().min(6)
})