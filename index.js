import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import productsRouter from "./routes/products.routes.js";
import cartRouter from "./routes/cart.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import usersRouter from "./routes/user.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import reviewsRouter from "./routes/reviews.routes.js";
import orderItemsRouter from "./routes/orderItems.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://www.enkajicrafts.co.ke",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://enkaji-crafts-admin-panel.vercel.app"
    ],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/cart", cartRouter);
app.use("/wishlist", wishlistRouter);
app.use("/orders", ordersRouter);
app.use("/order-items", orderItemsRouter);
app.use("/users", usersRouter);
app.use("/reviews", reviewsRouter);
app.use("/admin", adminRouter);

export default app;
