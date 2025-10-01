import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB } from "../../src/config/database.js";

let mongoServer;

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { ip: "127.0.0.1" },
  });
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDB();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Database Integration", () => {
  it("should connect to MongoDB and report connected", async () => {
    const state = mongoose.connection.readyState;
    // 1 = connected
    expect(state).toBe(1);
  });

  it("should allow creating and reading a test document", async () => {
    // temporary schema for test
    const TestSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model("TestModel", TestSchema);

    const doc = await TestModel.create({ name: "IntegrationTest" });
    expect(doc.name).toBe("IntegrationTest");

    const found = await TestModel.findOne({ name: "IntegrationTest" });
    expect(found).not.toBeNull();
    expect(found.name).toBe("IntegrationTest");
  });
});
