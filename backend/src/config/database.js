// backend/src/config/database.js
import mongoose from "mongoose";

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/ai_quiz_platform";

let isConnected = false;

export async function connectDB({ uri, dbName, nodeEnv } = {}) {
  const resolvedUri = uri ?? process.env.MONGODB_URI ?? DEFAULT_MONGODB_URI;
  const resolvedDbName = dbName ?? (process.env.MONGODB_DB_NAME || undefined);
  const resolvedNodeEnv = nodeEnv ?? process.env.NODE_ENV ?? "development";

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    mongoose.set("strictQuery", true);
    if (resolvedNodeEnv !== "production") {
      // Helpful query logs during dev
      mongoose.set("debug", (collectionName, method, query, doc) => {
        console.log(
          `[Mongoose] ${collectionName}.${method} ${JSON.stringify(query)} ${
            doc ? JSON.stringify(doc) : ""
          }`
        );
      });
    }

    await mongoose.connect(resolvedUri, {
      dbName: resolvedDbName,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;

    const db = mongoose.connection;
    db.on("connected", () => console.log("[DB] MongoDB connected"));
    db.on("error", (err) => console.error("[DB] MongoDB error:", err));
    db.on("disconnected", () => {
      console.warn("[DB] MongoDB disconnected");
      isConnected = false;
    });

    if (!process.env.JEST_WORKER_ID) {
      // Graceful shutdown when running the real server
      const close = async () => {
        try {
          await mongoose.connection.close();
          isConnected = false;
          console.log("[DB] MongoDB connection closed");
          process.exit(0);
        } catch (e) {
          console.error("[DB] Error during shutdown:", e);
          process.exit(1);
        }
      };
      process.on("SIGINT", close);
      process.on("SIGTERM", close);
    }

    return db;
  } catch (err) {
    console.error("[DB] MongoDB connection failed:", err.message);
    throw err;
  }
}
