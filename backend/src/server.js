// backend/src/server.js
import "dotenv/config"; // Loads .env
import { app } from "./app.js";
import { connectDB } from "./config/database.js";

const { PORT = "4000", NODE_ENV = "development" } = process.env;

async function start() {
  try {
    await connectDB();
    const server = app.listen(Number(PORT), () => {
      console.log(`[Server] Listening on http://localhost:${PORT} (${NODE_ENV})`);
    });

    const shutdown = (signal) => async () => {
      console.log(`[Server] Received ${signal}, shutting down...`);
      server.close(() => {
        console.log("[Server] Closed HTTP server");
        process.exit(0);
      });
      // If not closed in 10s, force exit
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on("SIGINT", shutdown("SIGINT"));
    process.on("SIGTERM", shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
      console.error("[Server] Unhandled Rejection:", reason);
    });
    process.on("uncaughtException", (err) => {
      console.error("[Server] Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
  }
}

start();
