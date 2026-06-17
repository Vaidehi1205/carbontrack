import { toClientUser } from "../services/userService.js";
import { calculateBadges } from "../services/badgeService.js";

describe("user service", () => {
  test("maps gamification fields to client user", () => {
    const user = toClientUser({
      name: "Ada",
      email: "ada@example.com",
      country: "US",
      annualTarget: 5000,
      badges: ["Green Beginner"],
      points: 100,
      currentStreak: 3,
      longestStreak: 5
    });

    expect(user.points).toBe(100);
    expect(user.badges).toContain("Green Beginner");
  });

  test("calculates badges from points", () => {
    expect(calculateBadges({ points: 800, badges: [] })).toContain("Carbon Hero");
  });
});
