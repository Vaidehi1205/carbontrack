import { factors } from "../data/factors.js";
import { calculateActivityCo2 } from "./calculations.js";
import { createId, daysAgoKey } from "./helpers.js";

const key = "carbontrack-state-v2";
const legacyKey = "carbontrack-state";

function sampleActivity(category, type, daysAgo, value, notes = "") {
  const item = factors[category][type];
  return {
    id: createId(),
    category,
    type,
    date: daysAgoKey(daysAgo),
    value,
    unit: item.unit,
    co2: calculateActivityCo2(category, type, value),
    notes
  };
}

export function defaultState() {
  return {
    user: {
      name: "Alex",
      location: "Seattle, WA",
      country: "US",
      household: 2,
      motivation: "climate",
      commute: "car_petrol",
      beef: "1-2x/week",
      renewable: 18,
      target: 7800,
      consent: false,
      avatar: "A"
    },
    activities: [
      sampleActivity("transportation", "car_petrol", -6, 22, "Commute"),
      sampleActivity("food", "plant_meal", -6, 2, "Lunch"),
      sampleActivity("energy", "electricity", -5, 18, "Home use"),
      sampleActivity("transportation", "bus", -4, 14, "Office day"),
      sampleActivity("food", "beef_meal", -3, 1, "Dinner"),
      sampleActivity("waste", "recycled", -2, 2, "Recycling"),
      sampleActivity("shopping", "clothing", -1, 1, "Work shirt"),
      sampleActivity("transportation", "bike_walk", 0, 5, "Errands")
    ],
    started: [],
    dismissed: [],
    joinedChallenges: [],
    completedChallenges: [],
    theme: "light",
    onboarded: false,
    ui: {
      activeView: "dashboard",
      activityFilter: "all",
      activitySearch: "",
      activitySort: "newest"
    }
  };
}

export function loadState() {
  const saved = localStorage.getItem(key);
  if (saved) return normalize(JSON.parse(saved));
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) return normalize({ ...defaultState(), ...JSON.parse(legacy) });
  return defaultState();
}

export function saveState(state) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(key);
  localStorage.removeItem(legacyKey);
}

function normalize(state) {
  const base = defaultState();
  return {
    ...base,
    ...state,
    user: { ...base.user, ...(state.user || {}) },
    ui: { ...base.ui, ...(state.ui || {}) },
    activities: (state.activities || []).map((activity) => ({
      ...activity,
      id: activity.id || createId(),
      unit: activity.unit || factors[activity.category]?.[activity.type]?.unit || "",
      co2: Number.isFinite(activity.co2) ? activity.co2 : calculateActivityCo2(activity.category, activity.type, activity.value)
    })),
    started: state.started || [],
    dismissed: state.dismissed || [],
    joinedChallenges: state.joinedChallenges || [],
    completedChallenges: state.completedChallenges || []
  };
}
