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


export type SigninType = z.infer<typeof SigninSchema>

export type SignupType = z.infer<typeof SignupSchema> 