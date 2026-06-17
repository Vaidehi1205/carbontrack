import { getRecommendations } from "../services/recommendationService.js";

describe("recommendation service", () => {
  test("prioritizes the highest-emission category", () => {
    const recommendations = getRecommendations({ breakdown: { food: 30, energy: 70 } });

    expect(recommendations[0].category).toBe("energy");
    expect(recommendations[0].score).toBeGreaterThan(0.8);
  });

  test("falls back to transportation when no breakdown exists", () => {
    const recommendations = getRecommendations({ breakdown: {} });

    expect(recommendations[0].category).toBe("transportation");
  });
});
