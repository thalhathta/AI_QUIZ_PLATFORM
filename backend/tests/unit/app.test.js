import { describe, it, expect } from "@jest/globals";
import { app } from "../../src/app.js";
import { dispatch } from "../utils/dispatch.js";

describe("App Initialization", () => {
  it("returns health check", async () => {
    const res = await dispatch(app, { path: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });

  it("returns API health check", async () => {
    const res = await dispatch(app, { path: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, api: "v1" });
  });

  it("returns 404 for unknown routes", async () => {
    const res = await dispatch(app, { path: "/unknown" });
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: "Not Found" });
  });
});
