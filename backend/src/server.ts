import dotenv from "dotenv";
dotenv.config();
import { logger } from "./utils/logger";
import http from "http";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import sequelize from "./config/sequelize";
import { ServerSocket } from "./socket";
import path from "path";
import { initAssociations } from "./models";

import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import divisionRoutes from "./routes/divisionRoutes";
import { AppError } from "./utils/errorHandling";
import donorRoutes from "./routes/donorRoutes";
import eventRoutes from "./routes/eventRoutes";
import fighterRoutes from "./routes/fighterRoutes";
import globeRoutes from "./routes/globeRoutes";
import sponsorRoutes from "./routes/sponsorRoutes";
import messageRoutes from "./routes/messageRoutes";
import userActions from "./routes/userActions";
import newsletterRoutes from "./routes/newsletterRoutes";
import fightRoutes from "./routes/fightRoutes";
import commentRoutes from "./routes/commentRoutes";
import { initCronJobs } from "./services/cronService";
import { updateFighterRanks } from "./services/rankingService";
import "./services/emailQueue"; // Initialize email worker

const application: Express = express();
const httpServer = http.createServer(application);
new ServerSocket(httpServer);
initAssociations();
initCronJobs();

application.use(
  cors({
    origin: [
      "https://fighter-league-1.onrender.com",
      "https://fighter-league.onrender.com",
      "http://localhost:8080",
      "http://localhost:3000",
      process.env.FRONTEND_URL || "https://fighter-league-1.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

application.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

application.use(express.json());
application.use(express.urlencoded({ extended: true }));

application.use("/uploads", express.static(path.join(__dirname, "../uploads")));

application.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(
    `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
  );
  res.on("finish", () => {
    logger.info(
      `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`
    );
  });
  next();
});

application.get("/ping", (_, res) => {
  res.json({ hello: "world" });
});

application.get("/status", (_, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (ServerSocket.instance as any)?.users ?? [];
  return res.status(200).json({
    server: "running",
    online_users: users.length,
  });
});

application.use("/api/v1/globe", globeRoutes);
application.use("/api/v1/fighters", fighterRoutes);
application.use("/api/v1/sponsors", sponsorRoutes);
application.use("/api/v1/auth", authRoutes);
application.use("/api/v1/divisions", divisionRoutes);
application.use("/api/v1/events", eventRoutes);
application.use("/api/v1/donor", donorRoutes);
application.use("/api/v1/messages", messageRoutes);
application.use("/api/v1/dashboard/sponsor", sponsorRoutes);
application.use("/api/v1/dashboard/admin", adminRoutes);
application.use("/api/v1/users", userActions);
application.use("/api/v1/newsletter", newsletterRoutes);
application.use("/api/v1/fights", fightRoutes);
application.use("/api/v1/comments", commentRoutes);

application.use("/api", (req: Request, res: Response) => {
  res.status(404).json({
    message: `API Route ${req.url} not found`,
  });
});

// Global Error Handling Middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error caught by global handler: ${err.message}`, { error: err });

  // If it's a known operational error, send its specific status and message
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Fallback for unexpected errors
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(async () => {
    logger.info("✅ Database connected successfully.");
    try {
      await sequelize.query(
        "SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))"
      );

      await sequelize.query(
        "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))"
      );

      await sequelize.query(
        'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_military" BOOLEAN DEFAULT false;'
      );
    } catch (seqErr: any) {
      logger.warn(
        `⚠️ Could not sync sequence (This is normal if tables are empty): ${seqErr.message}`
      );
    }
    return sequelize.sync({ alter: false });
  })
  .then(async () => {
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server + Socket running on port ${PORT}`);
    });
    logger.info("Startup: Recalculating all ranks...");
    await updateFighterRanks();
  })
  .catch((err: any) => {
    logger.error(`❌ Database connection failed: ${err.message}`);
  });

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  httpServer.close();
  await sequelize.close();
  process.exit(0);
});
