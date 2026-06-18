import { sanitizeText } from "../utils/sanitize.js";

describe("server sanitization", () => {
  test("trims control characters and limits length", () => {
    expect(sanitizeText(" hello\u0000   world ", 8)).toBe("hello wo");
  });
});
