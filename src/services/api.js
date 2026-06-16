/**
 * API client for CarbonTrack backend.
 * Attaches Firebase ID token to all authenticated requests.
 */

let apiBase = "";

export function setApiBase(url) {
  apiBase = url.replace(/\/$/, "");
}

export function getApiBase() {
  return apiBase || window.location.origin;
}

async function getAuthToken() {
  const { getCurrentToken } = await import("./auth.js");
  return getCurrentToken();
}

async function request(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.errors?.[0]?.msg || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/** Load public config (Firebase keys) from backend. */
export async function fetchConfig() {
  const data = await request("/api/auth/config");
  if (data.apiBase) setApiBase(data.apiBase);
  return data;
}

/** Auth */
export const authApi = {
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me")
};

/** Activities */
export const activitiesApi = {
  list: () => request("/api/activities"),
  create: (activity) => request("/api/activities", { method: "POST", body: JSON.stringify(activity) }),
  update: (id, activity) => request(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(activity) }),
  remove: (id) => request(`/api/activities/${id}`, { method: "DELETE" }),
  sync: (activities) => request("/api/activities/sync", { method: "POST", body: JSON.stringify({ activities }) })
};

/** Dashboard */
export const dashboardApi = {
  get: () => request("/api/dashboard"),
  insights: () => request("/api/dashboard/insights"),
  summary: () => request("/api/dashboard/summary")
};

/** Chatbot */
export const chatbotApi = {
  send: (message) => request("/api/chatbot", { method: "POST", body: JSON.stringify({ message }) }),
  history: (search = "") => request(`/api/chatbot/history${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  delete: (id) => request(`/api/chatbot/history/${id}`, { method: "DELETE" }),
  suggestions: () => request("/api/chatbot/suggestions")
};

/** Users */
export const usersApi = {
  updateProfile: (profile) => request("/api/users/profile", { method: "PUT", body: JSON.stringify(profile) }),
  updateChallenge: (challengeName, action) =>
    request("/api/users/challenges", { method: "POST", body: JSON.stringify({ challengeName, action }) })
};
