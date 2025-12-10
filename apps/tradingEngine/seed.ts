
// import { redis } from "@vxness/redis"; 
// import { v4 as uuidv4 } from 'uuid';

// // CONFIG
// const STREAM_KEY = "trading-engine";
// const UPDATE_INTERVAL_MS = 200; // Fast updates for high energy demo
// const ORDER_CHANCE = 0.05; // 5% chance per tick to create an order

// const SYMBOLS = [
//     { name: "BTC", price: 65000, volatility: 20 },
//     { name: "ETH", price: 3500, volatility: 5 },
//     { name: "SOL", price: 145, volatility: 0.5 }
// ];

// // Fake users for the demo
// const USERS = ["demo_user_1", "whale_account", "market_maker_01"];

// console.log("⚡ Starting Market Maker Simulation...");

// function randomWalk(currentPrice: number, volatility: number) {
//     const change = (Math.random() - 0.5) * volatility;
//     return Number((currentPrice + change).toFixed(2));
// }

// async function run() {
//     const client = redis.duplicate();
//     // await client.connect(); // Ensure connection if your lib requires it

//     setInterval(async () => {
//         for (const sym of SYMBOLS) {
//             // 1. Update Price (Random Walk)
//             sym.price = randomWalk(sym.price, sym.volatility);
            
//             // Spread calculation (Bid is slightly lower, Ask slightly higher)
//             const bid = sym.price - (sym.volatility * 0.1);
//             const ask = sym.price + (sym.volatility * 0.1);

//             const pricePayload = {
//                 type: "check_price",
//                 data: {
//                     s: `${sym.name}_USDC`,
//                     b: bid.toFixed(2),
//                     a: ask.toFixed(2)
//                 }
//             };

//             await client.xadd(STREAM_KEY, "*", "data", JSON.stringify(pricePayload));

//             // 2. Randomly Create Orders
//             if (Math.random() < ORDER_CHANCE) {
//                 const side = Math.random() > 0.5 ? "long" : "short";
//                 const user = USERS[Math.floor(Math.random() * USERS.length)];
                
//                 const orderPayload = {
//                     type: "create_order",
//                     data: {
//                         id: uuidv4().slice(0, 8), // Short ID for readability
//                         userId: user,
//                         asset: sym.name,
//                         side: side,
//                         qty: (Math.random() * 2).toFixed(4), // Random small size
//                         leverage: Math.floor(Math.random() * 10) + 1, // 1x to 10x
//                         // Optional: Add TP/SL sometimes
//                         takeProfit: Math.random() > 0.7 ? (sym.price * 1.05).toFixed(2) : undefined,
//                         stopLoss: Math.random() > 0.7 ? (sym.price * 0.95).toFixed(2) : undefined
//                     }
//                 };

//                 await client.xadd(STREAM_KEY, "*", "data", JSON.stringify(orderPayload));
//                 process.stdout.write(`+`); // Visual feedback that an order was placed
//             }
//         }
//         process.stdout.write(`.`); // Visual feedback for heartbeats
//     }, UPDATE_INTERVAL_MS);
// }

// run().catch(console.error);