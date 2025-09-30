// backend/src/config/database.js
import mongoose from "mongoose";

const {
  MONGODB_URI = "mongodb://127.0.0.1:27017/ai_quiz_platform",
  MONGODB_DB_NAME,
  NODE_ENV = "development",
} = process.env;

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    mongoose.set("strictQuery", true);
    if (NODE_ENV !== "production") {
      // Helpful query logs during dev
      mongoose.set("debug", (collectionName, method, query, doc) => {
        // eslint-disable-next-line no-console
        console.log(
          `[Mongoose] ${collectionName}.${method} ${JSON.stringify(query)} ${
            doc ? JSON.stringify(doc) : ""
          }`
        );
      });
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME || undefined,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;

    const db = mongoose.connection;
    db.on("connected", () => console.log("[DB] MongoDB connected"));
    db.on("error", (err) => console.error("[DB] MongoDB error:", err));
    db.on("disconnected", () => console.warn("[DB] MongoDB disconnected"));

    // Graceful shutdown
    const close = async () => {
      try {
        await mongoose.connection.close();
        console.log("[DB] MongoDB connection closed");
        process.exit(0);
      } catch (e) {
        console.error("[DB] Error during shutdown:", e);
        process.exit(1);
      }
    };
    process.on("SIGINT", close);
    process.on("SIGTERM", close);

    return db;
  } catch (err) {
    console.error("[DB] MongoDB connection failed:", err.message);
    throw err;
  }
}
