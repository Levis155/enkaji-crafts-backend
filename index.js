import express, { json } from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import productsRouter from "./routes/products.routes.js";
import cartRouter from "./routes/cart.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://red-dune.vercel.app"],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(json());
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/cart", cartRouter);

export default app;
