import { createId, daysAgoKey } from "./helpers.js";

const key = "carbontrack-ui-v3";

/**
 * Default UI-only state stored in localStorage.
 * User data and activities are persisted in MongoDB via the API.
 */
export function defaultUiState() {
  return {
    activeView: "dashboard",
    activityFilter: "all",
    activitySearch: "",
    activitySort: "newest"
  };
}

export function defaultAppState() {
  return {
    user: {
      name: "",
      location: "",
      country: "US",
      household: 2,
      motivation: "climate",
      commute: "car_petrol",
      beef: "1-2x/week",
      renewable: 18,
      target: 7800,
      consent: false,
      avatar: "U",
      email: "",
      goal: "climate"
    },
    activities: [],
    started: [],
    dismissed: [],
    joinedChallenges: [],
    completedChallenges: [],
    theme: "light",
    onboarded: false,
    ui: defaultUiState(),
    aiInsights: null,
    chat: {
      messages: [],
      history: [],
      suggestions: [],
      typing: false,
      search: ""
    }
  };
}

/** Load UI preferences from localStorage. */
export function loadUiState() {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore corrupt data */
  }
  return { theme: "light", ui: defaultUiState() };
}

/** Save UI preferences (theme, active view filters) to localStorage. */
export function saveUiState(state) {
  localStorage.setItem(key, JSON.stringify({
    theme: state.theme,
    ui: state.ui
  }));
}

/** Legacy migration: read old localStorage activities for one-time sync. */
export function loadLegacyActivities() {
  const legacyKeys = ["carbontrack-state-v2", "carbontrack-state"];
  for (const legacyKey of legacyKeys) {
    try {
      const saved = localStorage.getItem(legacyKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activities?.length) return parsed.activities;
      }
    } catch {
      /* continue */
    }
  }
  return [];
}

export function clearLegacyStorage() {
  localStorage.removeItem("carbontrack-state-v2");
  localStorage.removeItem("carbontrack-state");
}

export { createId, daysAgoKey };
