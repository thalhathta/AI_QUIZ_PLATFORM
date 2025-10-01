import { jest } from "@jest/globals";
let mockConnect;
let mockSet;
let mockConnection;
let processOnSpy;
let consoleErrorSpy;
let originalJestWorkerId;

describe("connectDB", () => {
  beforeEach(() => {
    jest.resetModules();
    originalJestWorkerId = process.env.JEST_WORKER_ID;
    delete process.env.JEST_WORKER_ID;
    mockConnection = {
      on: jest.fn(),
      close: jest.fn(),
      readyState: 1,
    };
    mockConnect = jest.fn().mockResolvedValue(mockConnection);
    mockSet = jest.fn();

    jest.unstable_mockModule("mongoose", () => ({
      default: {
        connect: mockConnect,
        connection: mockConnection,
        set: mockSet,
      },
    }));

    processOnSpy = jest
      .spyOn(process, "on")
      .mockImplementation(() => process);
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalJestWorkerId !== undefined) {
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    } else {
      delete process.env.JEST_WORKER_ID;
    }
    processOnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.resetModules();
  });

  it("connects once and reuses the connection", async () => {
    const { connectDB } = await import("../../../src/config/database.js");
    const mongoose = (await import("mongoose")).default;

    const dbInstance = await connectDB();

    expect(mockSet).toHaveBeenCalledWith("strictQuery", true);
    expect(mockSet).toHaveBeenCalledWith("debug", expect.any(Function));
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(dbInstance).toBe(mongoose.connection);

    await connectDB();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("propagates connection errors", async () => {
    const error = new Error("Mongo connection failed");
    mockConnect.mockRejectedValueOnce(error);

    const { connectDB } = await import("../../../src/config/database.js");

    await expect(connectDB()).rejects.toThrow(error);
  });
});
