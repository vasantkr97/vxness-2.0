import express from "express"
import { depositToWallet, getBalance, getBalanceBySymbol } from "../controllers/balance.controller"

const route = express.Router()

route.get("/", getBalance)

route.get("/:symbol", getBalanceBySymbol)

route.post("/deposit", depositToWallet)


export default route;
