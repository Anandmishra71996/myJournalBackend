import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { connectDatabase } from "./config/database";
import routes from "./routes";
import { logger } from "./utils/logger";
import { initializeCronJobs, stopCronJobs } from "./crons";

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 5000;
const HOSTNAME: string = process.env.HOSTNAME || "localhost";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1", routes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    // Initialize cron jobs after database connection
    initializeCronJobs();

    app.listen(PORT, HOSTNAME, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing server gracefully");
  stopCronJobs();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing server gracefully");
  stopCronJobs();
  process.exit(0);
});

startServer();

export default app;
