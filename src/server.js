import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import { router as apiRoutes } from "./routes/index.js";
import { connectDB } from "./config/mongodb.js";
import { Limiter } from "./middlewares/rateLimit.js";
import { startAutoCancelJob } from "./config/cron-jobs.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://creative-market-front-end-sprint-2-mu.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(Limiter);
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Creative Market API Server 🚀",
    status: "Healthy",
  });
});

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  });
});

const PORT = 7777;

await connectDB();

// Start background job for auto-canceling expired orders
startAutoCancelJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ❤️`);
});
