import { describe, it, expect } from "@jest/globals";
import { app } from "../../src/app.js";
import { dispatch } from "../utils/dispatch.js";

describe("API Integration", () => {
  it("responds with health payload on /health", async () => {
    const res = await dispatch(app, { path: "/health" });

    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        env: expect.any(String),
        ts: expect.any(String),
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it("responds with API health payload on /api/health", async () => {
    const res = await dispatch(app, { path: "/api/health" });

    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        api: "v1",
        ts: expect.any(String),
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it("returns API root message", async () => {
    const res = await dispatch(app, { path: "/api" });

    expect(res.body).toEqual(
      expect.objectContaining({
        message: "AI Quiz API root",
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it("returns 404 with error payload for unknown endpoints", async () => {
    const res = await dispatch(app, { path: "/does-not-exist" });

    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Not Found",
        path: "/does-not-exist",
      })
    );
    expect(res.statusCode).toBe(404);
  });
});
