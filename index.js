import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import productsRouter from "./routes/products.routes.js";
import cartRouter from "./routes/cart.routes.js";
import ordersRouter from "./routes/orders.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://red-dune.vercel.app"],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter)

export default app;
