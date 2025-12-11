import { Router } from "express"
import { createOrder, CloseOrder, getOrders } from "../controllers/orders.controller"
import { auth } from "../middleware/auth"

const router = Router()

router.use(auth);

router.get("/", getOrders)

router.post("/", createOrder)

router.post("/:orderId/close", CloseOrder)

export default router