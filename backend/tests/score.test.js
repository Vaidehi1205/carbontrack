import { calculateScores } from "../services/scoreService.js";
import { gradeForScore } from "../utils/calculateScore.js";

const today = new Date().toISOString().slice(0, 10);

describe("score service", () => {
  test("calculates sustainability score and monthly emission", () => {
    const scores = calculateScores(
      { annualTarget: 7800, renewable: 40 },
      [
        { date: today, category: "transportation", carbonEmission: 4 },
        { date: today, category: "food", carbonEmission: 2 }
      ]
    );

    expect(scores.carbonScore).toBeGreaterThan(0);
    expect(scores.sustainabilityScore).toBeGreaterThan(0);
    expect(scores.monthlyEmission).toBe(6);
  });

  test("assigns A+ grade for excellent scores", () => {
    expect(gradeForScore(95)).toBe("A+");
  });

  test("assigns D grade for low scores", () => {
    expect(gradeForScore(20)).toBe("D");
  });
});
