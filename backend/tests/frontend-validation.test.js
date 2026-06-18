import { sanitizeActivityInput, validateActivity, validateProfile } from "../../src/utils/validation.js";
import { escapeHtml, sanitizePlainText } from "../../src/utils/helpers.js";

describe("frontend validation and escaping", () => {
  test("rejects unknown activity category and type", () => {
    expect(validateActivity({ category: "bad", type: "car_petrol", date: "2026-01-01", value: 1 })).toContain("Choose a category.");
  });

  test("sanitizes activity notes before submission", () => {
    expect(sanitizeActivityInput({ category: "food", type: "plant_meal", date: "2026-01-01", value: "2", notes: " hi\u0000  there " }).notes).toBe("hi there");
  });

  test("escapes HTML before rendering", () => {
    expect(escapeHtml("<img src=x onerror=alert(1)>")).toBe("&lt;img src=x onerror=alert(1)&gt;");
  });

  test("normalizes plain text", () => {
    expect(sanitizePlainText(" A\n\nB ", 10)).toBe("A B");
  });

  test("validates profile edge cases", () => {
    const errors = validateProfile({
      name: "A",
      country: "ZZ",
      household: 0,
      motivation: "climate",
      commute: "car_petrol",
      renewable: 120,
      target: 500,
      theme: "light"
    }, { requireTarget: true });

    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
