import express, { json } from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(json());
app.use("/auth", authRouter);

export default app;
