import { calculateEmission } from "../utils/calculateEmission.js";
import { factors } from "../config/emissionFactors.js";

describe("activity emissions", () => {
  test("calculates emissions from configured factors", () => {
    expect(calculateEmission("transportation", "car_petrol", 10)).toBe(1.92);
  });

  test("throws on unknown activity type", () => {
    expect(() => calculateEmission("transportation", "spaceship", 1)).toThrow("Unknown activity type");
  });

  test("exposes configured categories", () => {
    expect(Object.keys(factors)).toContain("energy");
  });
});
