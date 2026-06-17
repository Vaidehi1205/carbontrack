import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("health and public config", () => {
  test("GET /api/health returns ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeDefined();
  });

  test("GET /api/auth/config exposes public config shape", async () => {
    const response = await request(app).get("/api/auth/config");

    expect(response.status).toBe(200);
    expect(response.body.firebase).toEqual(expect.objectContaining({
      apiKey: expect.any(String),
      authDomain: expect.any(String),
      projectId: expect.any(String)
    }));
  });

  test("unknown API routes return JSON 404", async () => {
    const response = await request(app).get("/api/missing");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("API route not found");
  });
});
