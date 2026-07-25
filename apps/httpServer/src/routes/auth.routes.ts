import express from "express"
import { signin, signup, signout, me } from "../controllers/auth.controller"
import { auth } from "../middleware/auth"
import { createRateLimiter } from "../middleware/rateLimit"

const router = express.Router()

const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: "Too many authentication attempts. Please try again later.",
})

router.post("/signup", authRateLimiter, signup)

router.post("/signin", authRateLimiter, signin)

router.post("/signout", signout)

router.get("/me", auth, me)

export default router
