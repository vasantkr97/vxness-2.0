import { Router } from "express"
import { createOrder, CloseOrder, getOrders, getOrderById } from "../controllers/orders.controller"
import { auth } from "../middleware/auth"

const router = Router()

router.use(auth);

router.get("/", getOrders)

router.post("/", createOrder)

router.get("/:orderId", getOrderById)

router.post("/:orderId/close", CloseOrder)

export default router