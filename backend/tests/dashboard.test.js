import { buildEmissionContext, dailyTotals } from "../services/dashboardService.js";

const today = new Date().toISOString().slice(0, 10);

describe("dashboard service", () => {
  test("builds breakdown and trend context", () => {
    const context = buildEmissionContext(
      { name: "Ada", country: "US", annualTarget: 5000, goal: "climate" },
      [
        { date: today, category: "energy", carbonEmission: 3 },
        { date: today, category: "food", carbonEmission: 1 }
      ]
    );

    expect(context.userName).toBe("Ada");
    expect(context.breakdown.energy).toBe(75);
    expect(context.topSources[0]).toContain("energy");
  });

  test("daily totals includes requested number of days", () => {
    const totals = dailyTotals([{ date: today, carbonEmission: 2 }], 7);

    expect(totals).toHaveLength(7);
    expect(totals[6].value).toBe(2);
  });
});
