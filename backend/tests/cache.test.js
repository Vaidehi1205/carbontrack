import { clearCache, getCache, invalidateByPrefix, setCache } from "../services/cacheService.js";

describe("cache service", () => {
  beforeEach(() => clearCache());

  test("stores and reads cached values", () => {
    setCache("dashboard:user:full", { ok: true }, 1000);

    expect(getCache("dashboard:user:full")).toEqual({ ok: true });
  });

  test("invalidates entries by prefix", () => {
    setCache("dashboard:user:full", 1, 1000);
    setCache("other:user", 2, 1000);

    invalidateByPrefix("dashboard:user");

    expect(getCache("dashboard:user:full")).toBeUndefined();
    expect(getCache("other:user")).toBe(2);
  });
});
