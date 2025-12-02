import express from "express"
import { signin, signup, signout, me } from "../controllers/auth.controller"
import { auth } from "../middleware/auth"

const router = express.Router()

router.post("/signup", signup)

router.post("/signin", signin)

router.post("/signout", signout)


router.get("/me", auth, me)

export default router