// import dotenv from "dotenv";
// import http from "http";
// import express, { Express, Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import sequelize from "./config/sequelize";
// import { ServerSocket } from "./socket";

// import adminRoutes from "./routes/adminRoutes";
// import authRoutes from "./routes/authRoutes";
// import divisionRoutes from "./routes/divisionRoutes";
// import donorRoutes from "./routes/donorRoutes";
// import eventRoutes from "./routes/eventRoutes";
// import fighterRoutes from "./routes/fighterRoutes";
// import globeRoutes from "./routes/globeRoutes";
// import sponsorRoutes from "./routes/sponsorRoutes";
// import messageRoutes from "./routes/messageRoutes";

// import userActions from "./routes/userActions";
// import path from "path";
// import newsletterRoutes from "./routes/newsletterRoutes";
// import fightRoutes from "./routes/fightRoutes";

// dotenv.config();

// const application: Express = express();
// const httpServer = http.createServer(application);
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const socketService = new ServerSocket(httpServer);

// application.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// application.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );

// application.use(express.json());
// application.use(express.urlencoded({ extended: true }));

// application.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// application.use((req: Request, res: Response, next: NextFunction) => {
//   console.info(
//     `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
//   );

//   res.on("finish", () => {
//     console.info(
//       `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`
//     );
//   });

//   next();
// });

// application.get("/ping", (_, res) => {
//   res.json({ hello: "world" });
// });

// application.get("/status", (_, res) => {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const users = (ServerSocket.instance as any)?.users ?? [];
//   return res.status(200).json({
//     server: "running",
//     online_users: users.length,
//     users_ids: users,
//   });
// });

// application.use("/api/v1/globe", globeRoutes);
// application.use("/api/v1/fighters", fighterRoutes);
// application.use("/api/v1/sponsors", sponsorRoutes);
// application.use("/api/v1/auth", authRoutes);
// application.use("/api/v1/divisions", divisionRoutes);
// application.use("/api/v1/events", eventRoutes);
// application.use("/api/v1/donor", donorRoutes);
// application.use("/api/v1/messages", messageRoutes);

// application.use("/api/v1/dashboard/sponsor", sponsorRoutes);
// application.use("/api/v1/dashboard/admin", adminRoutes);

// application.use("/api/v1/users", userActions);

// application.use("/api/v1/newsletter", newsletterRoutes);

// application.use("/api/v1/fights", fightRoutes);

// application.use((req: Request, res: Response) => {
//   res.status(404).json({
//     message: `Route ${req.url} not found`,
//   });
// });

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// application.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.error("Internal error:", err);
//   res
//     .status(500)
//     .json({ message: "Internal server error", error: err.message });
// });

// const PORT = process.env.PORT || 3000;

// sequelize
//   .authenticate()
//   .then(async () => {
//     console.log("✅ Database connected successfully.");

//     try {
//       await sequelize.query(
//         "SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))"
//       );
//       await sequelize.query(
//         'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_military" BOOLEAN DEFAULT false;'
//       );
//     } catch (seqErr) {
//       console.warn(
//         "⚠️ Could not sync sequence (table might be empty or sequence name differs):",
//         seqErr
//       );
//     }

//     return sequelize.sync({ alter: false });
//   })
//   .then(() => {
//     httpServer.listen(PORT, () => {
//       console.info(`🚀 Server + Socket running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err);
//   });

// process.on("SIGINT", async () => {
//   console.log("Shutting down...");
//   httpServer.close();
//   await sequelize.close();
//   process.exit(0);
// });
import dotenv from "dotenv";
import http from "http";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import sequelize from "./config/sequelize";
import { ServerSocket } from "./socket";
import path from "path";

import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import divisionRoutes from "./routes/divisionRoutes";
import donorRoutes from "./routes/donorRoutes";
import eventRoutes from "./routes/eventRoutes";
import fighterRoutes from "./routes/fighterRoutes";
import globeRoutes from "./routes/globeRoutes";
import sponsorRoutes from "./routes/sponsorRoutes";
import messageRoutes from "./routes/messageRoutes";
import userActions from "./routes/userActions";
import newsletterRoutes from "./routes/newsletterRoutes";
import fightRoutes from "./routes/fightRoutes";

dotenv.config();

const application: Express = express();
const httpServer = http.createServer(application);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const socketService = new ServerSocket(httpServer);

application.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

application.use(
  helmet({
    contentSecurityPolicy: false, // Disable strictly for testing if assets break, or configure specifically
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

application.use(express.json());
application.use(express.urlencoded({ extended: true }));

application.use("/uploads", express.static(path.join(__dirname, "../uploads")));

application.use((req: Request, res: Response, next: NextFunction) => {
  console.info(
    `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
  );
  res.on("finish", () => {
    console.info(
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
    users_ids: users,
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

// --- 3. THE FIX: Handle 404s & Serve Frontend ---

// A. Handle API 404s specifically
// app.use matches the PREFIX, so this catches anything starting with /api that wasn't handled above.
application.use("/api", (req: Request, res: Response) => {
  res.status(404).json({
    message: `API Route ${req.url} not found`,
  });
});

// B. Serve React Static Files
const frontendPath = path.resolve(__dirname, "../../frontend/dist");
application.use(express.static(frontendPath));

// C. Catch-All Route (SPA Support)
// FIX: Use Regex /.*/ instead of "*" to avoid PathError in newer Express versions
application.get(/.*/, (req: Request, res: Response) => {
  const indexPath = path.join(frontendPath, "index.html");

  // Send the file
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("❌ Error sending index.html:", err);
      // If index.html is missing, we must send a JSON error or the browser hangs
      res
        .status(500)
        .send(
          "Frontend build not found. Please run 'npm run build' in frontend."
        );
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Internal error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ Database connected successfully.");
    try {
      await sequelize.query(
        "SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))"
      );
      await sequelize.query(
        'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_military" BOOLEAN DEFAULT false;'
      );
    } catch (seqErr) {
      console.warn("⚠️ Could not sync sequence:", seqErr);
    }
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.info(`🚀 Server + Socket running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  httpServer.close();
  await sequelize.close();
  process.exit(0);
});
