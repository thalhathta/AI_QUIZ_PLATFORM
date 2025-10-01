import mongoose from "mongoose";
import { connectDB } from "../../src/config/database.js";

beforeAll(async () => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/ai_quiz_integration_test";
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clean test DB
  await mongoose.connection.close();
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
