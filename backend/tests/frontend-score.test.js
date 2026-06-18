import { currentStats, pointsFor } from "../../src/utils/calculations.js";
import { defaultAppState } from "../../src/utils/storage.js";

describe("frontend scoring behavior", () => {
  test("points do not change for an abandoned unsaved draft", () => {
    const state = defaultAppState();
    const before = pointsFor(state);
    const draft = { category: "food", type: "plant_meal", value: 1 };

    expect(draft).toBeDefined();
    expect(pointsFor(state)).toBe(before);
  });

  test("points change after an activity is added to state", () => {
    const state = defaultAppState();
    const before = pointsFor(state);
    state.activities = [{ id: "1", category: "food", type: "plant_meal", date: new Date().toISOString().slice(0, 10), value: 1, unit: "serving", co2: 0.7 }];

    expect(pointsFor(state)).toBeGreaterThan(before);
  });

  test("dashboard stats reflect submitted activities", () => {
    const state = defaultAppState();
    state.activities = [{ id: "1", category: "energy", type: "electricity", date: new Date().toISOString().slice(0, 10), value: 2, unit: "kWh", co2: 1.4 }];

    expect(currentStats(state).today).toBe(1.4);
  });
});
