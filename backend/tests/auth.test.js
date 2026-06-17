import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("authentication guard", () => {
  test("GET /api/auth/me requires a bearer token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required");
  });

  test("protected activities endpoint requires auth", async () => {
    const response = await request(app).get("/api/activities");

    expect(response.status).toBe(401);
  });

  test("protected dashboard endpoint requires auth", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
  });
});
