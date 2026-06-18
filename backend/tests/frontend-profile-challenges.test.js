import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { challenges } from "../../src/data/challenges.js";
import { getChallengeProgress } from "../../src/components/challenges.js";
import { profileView } from "../../src/components/profile.js";
import { defaultAppState } from "../../src/utils/storage.js";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));

describe("profile and challenge UI regressions", () => {
  test("activity modal cancel buttons do not submit the form", () => {
    const html = readFileSync(join(root, "index.html"), "utf8");

    expect(html).toContain('data-close-modal');
    expect(html).toContain('<button class="ghost-button" type="button" value="cancel" data-close-modal>Cancel</button>');
    expect(html).toContain('<button class="primary-button" id="saveActivityBtn" type="submit" value="default">Save activity</button>');
  });

  test("profile no longer renders export JSON action", () => {
    const state = defaultAppState();
    state.user.name = "Ada";

    expect(profileView(state)).not.toContain("Export JSON");
    expect(profileView(state)).toContain("Export CSV");
  });

  test("logged activities update challenge progress", () => {
    const state = defaultAppState();
    const challenge = challenges.find((item) => item.category === "food");
    state.activities = [{
      id: "food-1",
      category: "food",
      type: "plant_meal",
      date: new Date().toISOString().slice(0, 10),
      value: 10,
      unit: "serving",
      co2: challenge.target
    }];

    expect(getChallengeProgress(state, challenge).percent).toBe(100);
  });
});
