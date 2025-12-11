import express from "express"
import { depositToWallet, getBalance, getBalanceBySymbol } from "../controllers/balance.controller"
import { auth } from "../middleware/auth"

const route = express.Router()

route.use(auth)

route.get("/", getBalance)

route.get("/:symbol", getBalanceBySymbol)

route.post("/deposit", depositToWallet)


export default route;
