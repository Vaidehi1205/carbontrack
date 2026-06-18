import { calculateCurrentStreak } from "../services/streakService.js";
import { formatDate } from "../utils/formatDate.js";

describe("streak service", () => {
  test("counts consecutive activity days from today", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(calculateCurrentStreak([
      { date: formatDate(new Date()) },
      { date: formatDate(yesterday) }
    ])).toBe(2);
  });

  test("returns zero when today is missing", () => {
    const old = new Date();
    old.setDate(old.getDate() - 3);

    expect(calculateCurrentStreak([{ date: formatDate(old) }])).toBe(0);
  });
});
