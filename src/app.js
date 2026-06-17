import { factors } from "./data/factors.js";
import { activitiesView } from "./components/activities.js";
import { challengesView } from "./components/challenges.js";
import { coachView, scrollChatToBottom } from "./components/coach.js";
import { dashboardView, renderDashboardCharts } from "./components/dashboard.js";
import { insightsView, renderInsightsCharts } from "./components/insights.js";
import { renderNavbar } from "./components/navbar.js";
import { profileView } from "./components/profile.js";
import { recommendationsView } from "./components/recommendations.js";
import { calculateActivityCo2, pointsFor } from "./utils/calculations.js";
import {
  defaultAppState,
  loadUiState,
  saveUiState,
  loadLegacyActivities,
  clearLegacyStorage
} from "./utils/storage.js";
import { createId, downloadFile, escapeHtml, formatKg, title, todayKey } from "./utils/helpers.js";
import { validateActivity } from "./utils/validation.js";
import { fetchConfig, activitiesApi, authApi, dashboardApi, chatbotApi, usersApi } from "./services/api.js";
import { initFirebase, requireAuth, logout, waitForAuth } from "./services/auth.js";

const PROTECTED_VIEWS = ["dashboard", "activities", "insights", "coach", "recommendations", "challenges", "profile"];

const views = {
  dashboard: dashboardView,
  activities: activitiesView,
  insights: insightsView,
  coach: coachView,
  recommendations: recommendationsView,
  challenges: challengesView,
  profile: profileView
};

const titles = {
  dashboard: "Dashboard",
  activities: "Activity log",
  insights: "Insights",
  coach: "Carbon Coach",
  recommendations: "Recommended actions",
  challenges: "Challenges",
  profile: "Profile"
};

let state = defaultAppState();
let editingId = null;
let deletedTimer = null;
let lastDeleted = null;
let apiReady = false;

const els = {
  nav: document.getElementById("nav"),
  pageTitle: document.getElementById("pageTitle"),
  todayLabel: document.getElementById("todayLabel"),
  pointsPill: document.getElementById("pointsPill"),
  themeToggle: document.getElementById("themeToggle"),
  modal: document.getElementById("activityModal"),
  form: document.getElementById("activityForm"),
  category: document.getElementById("categoryInput"),
  type: document.getElementById("typeInput"),
  date: document.getElementById("dateInput"),
  value: document.getElementById("valueInput"),
  unit: document.getElementById("unitInput"),
  notes: document.getElementById("notesInput"),
  preview: document.getElementById("calcPreview"),
  saveActivityBtn: document.getElementById("saveActivityBtn")
};

/** Bootstrap: auth check, load remote data, render app. */
async function bootstrap() {
  try {
    console.log("[Bootstrap] Starting...");
    const config = await fetchConfig();
    await initFirebase(config.firebase);
    const user = await requireAuth();
    if (!user) {
      console.log("[Bootstrap] No user, redirected to login");
      return;
    }

    console.log("[Bootstrap] User authenticated, loading data...");
    await loadRemoteData(user);
    apiReady = true;
    console.log("[Bootstrap] Data loaded, rendering app");
    render();
    if (state.ui.activeView === "coach") {
      await loadChatData();
      render();
    }
    loadAiInsights();
  } catch (error) {
    console.error("Bootstrap error:", error);
    toast("Failed to load app data. Some features may be unavailable.", "!");
  }
}

/** Load user profile and activities from the API. */
async function loadRemoteData(firebaseUser) {
  const uiSaved = loadUiState();
  state.theme = uiSaved.theme || "light";
  state.ui = { ...state.ui, ...uiSaved.ui };

  try {
    const { user, meta } = await authApi.me();
    state.user = { ...state.user, ...user, target: user.target || user.annualTarget || 7800 };
    state.started = meta?.started || [];
    state.dismissed = meta?.dismissed || [];
    state.joinedChallenges = meta?.joinedChallenges || [];
    state.completedChallenges = meta?.completedChallenges || [];
    state.theme = meta?.theme || state.theme;
    state.onboarded = meta?.onboarded !== false;
  } catch (error) {
    if (firebaseUser && error.message === "Profile not found") {
      window.location.href = `/register.html?email=${encodeURIComponent(firebaseUser.email || "")}`;
      return;
    }
    throw error;
  }

  try {
    const { activities } = await activitiesApi.list();
    state.activities = activities;

    if (!activities.length) {
      const legacy = loadLegacyActivities();
      if (legacy.length) {
        await activitiesApi.sync(legacy);
        const refreshed = await activitiesApi.list();
        state.activities = refreshed.activities;
        clearLegacyStorage();
        toast("Local activities synced to cloud.", "☁");
      }
    }
  } catch (error) {
    console.warn("Activities load failed:", error.message);
  }
}

/** Fetch AI insights in the background. */
async function loadAiInsights() {
  try {
    const { insights } = await dashboardApi.insights();
    state.aiInsights = insights;
    if (state.ui.activeView === "dashboard" || state.ui.activeView === "insights") {
      document.getElementById(`${state.ui.activeView}View`).innerHTML = views[state.ui.activeView](state);
      renderCharts();
    }
  } catch {
    /* AI insights are optional */
  }
}

/** Load chat history and suggestions for Carbon Coach. */
async function loadChatData() {
  try {
    const [historyRes, suggestionsRes] = await Promise.all([
      chatbotApi.history(state.chat.search),
      chatbotApi.suggestions()
    ]);
    state.chat.history = historyRes.chats || [];
    state.chat.suggestions = suggestionsRes.suggestions || [];
  } catch {
    /* Chat data is optional on first load */
  }
}

function render() {
  applyTheme();
  els.nav.innerHTML = renderNavbar(state);
  els.todayLabel.textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  els.pointsPill.textContent = `${pointsFor(state)} pts`;
  renderOnboarding();
  Object.entries(views).forEach(([id, view]) => {
    document.getElementById(`${id}View`).innerHTML = view(state);
  });
  showView(state.ui.activeView);
  bindEvents();
  renderCharts();
  saveUiState(state);
}

function renderOnboarding() {
  const node = document.getElementById("onboarding");
  if (state.onboarded) {
    node.className = "onboarding";
    node.innerHTML = "";
    return;
  }
  node.className = "onboarding active";
  node.innerHTML = `
    <div class="card hero-visual onboarding-card">
      <span class="eyebrow">Welcome</span>
      <h2>Complete your sustainability profile</h2>
      <p>Set a baseline so Carbon Coach can personalize your advice.</p>
    </div>
    <div class="card onboarding-card" style="margin-top:16px">
      <form id="onboardingForm" class="form-grid">
        <label>Display name <input id="nameSetup" value="${escapeHtml(state.user.name)}" required /></label>
        <label>Location <input id="locationSetup" value="${escapeHtml(state.user.location)}" required /></label>
        <label>Country
          <select id="countrySetup">
            ${option("IN", "India", state.user.country)}
            ${option("US", "USA", state.user.country)}
            ${option("UK", "UK", state.user.country)}
            ${option("CA", "Canada", state.user.country)}
            ${option("AU", "Australia", state.user.country)}
          </select>
        </label>
        <label>Household size <input id="householdSetup" type="number" min="1" max="8" value="${state.user.household}" /></label>
        <label>Primary motivation
          <select id="motivationSetup">${["climate", "cost", "health", "social"].map((x) => option(x, title(x), state.user.motivation)).join("")}</select>
        </label>
        <label>Usual commute
          <select id="commuteSetup">${Object.entries(factors.transportation).map(([key, item]) => option(key, item.label, state.user.commute)).join("")}</select>
        </label>
        <label>Beef frequency
          <select id="beefSetup">${["daily", "3-5x/week", "1-2x/week", "rarely", "never"].map((x) => option(x, x, state.user.beef)).join("")}</select>
        </label>
        <label class="range-line">Renewable energy <input id="renewableSetup" type="range" min="0" max="100" value="${state.user.renewable}" /><strong id="renewableRead">${state.user.renewable}%</strong></label>
        <button class="primary-button" type="submit">Start tracking</button>
      </form>
    </div>
  `;
  document.getElementById("renewableSetup").addEventListener("input", (event) => {
    document.getElementById("renewableRead").textContent = `${event.target.value}%`;
  });
  document.getElementById("onboardingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.user = {
      ...state.user,
      name: valueOf("nameSetup"),
      location: valueOf("locationSetup"),
      country: valueOf("countrySetup"),
      household: Number(valueOf("householdSetup")),
      motivation: valueOf("motivationSetup"),
      commute: valueOf("commuteSetup"),
      beef: valueOf("beefSetup"),
      renewable: Number(valueOf("renewableSetup")),
      avatar: valueOf("nameSetup").slice(0, 1).toUpperCase()
    };
    state.onboarded = true;

    if (apiReady) {
      try {
        await usersApi.updateProfile({ ...state.user, onboarded: true, annualTarget: state.user.target });
      } catch (error) {
        toast("Profile save failed: " + error.message, "!");
      }
    }

    toast("Baseline ready. Your dashboard is live.", "✓");
    render();
    loadAiInsights();
  });
}

function showView(view) {
  if (!PROTECTED_VIEWS.includes(view)) view = "dashboard";
  els.pageTitle.textContent = state.onboarded ? titles[view] : "Welcome";
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  if (state.onboarded) document.getElementById(`${view}View`).classList.add("active");
}

function renderCharts() {
  if (!state.onboarded) return;
  if (state.ui.activeView === "dashboard") renderDashboardCharts(state);
  if (state.ui.activeView === "insights") renderInsightsCharts(state);
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", async () => {
    state.ui.activeView = button.dataset.view;
    if (button.dataset.view === "coach") {
      await loadChatData();
    }
    render();
    if (button.dataset.view === "coach") scrollChatToBottom();
  }));

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logout();
    window.location.href = "/login.html";
  });

  document.querySelectorAll("[data-open-log]").forEach((button) => button.addEventListener("click", () => openActivityModal()));
  document.querySelectorAll("[data-quick]").forEach((button) => button.addEventListener("click", () => {
    const [category, type] = button.dataset.quick.split(":");
    openActivityModal({ category, type });
  }));
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.ui.activityFilter = button.dataset.filter;
    render();
  }));

  const search = document.getElementById("activitySearch");
  if (search) search.addEventListener("input", (event) => {
    state.ui.activitySearch = event.target.value;
    render();
  });
  const sort = document.getElementById("activitySort");
  if (sort) sort.addEventListener("change", (event) => {
    state.ui.activitySort = event.target.value;
    render();
  });

  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openActivityModal(state.activities.find((activity) => activity.id === button.dataset.edit))));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteActivity(button.dataset.delete)));
  document.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => startRecommendation(button.dataset.start)));
  document.querySelectorAll("[data-dismiss]").forEach((button) => button.addEventListener("click", () => {
    state.dismissed = [...new Set([...state.dismissed, button.dataset.dismiss])];
    persistMeta();
    toast("Recommendation dismissed.", "−");
    render();
  }));
  document.querySelectorAll("[data-join]").forEach((button) => button.addEventListener("click", () => joinChallenge(button.dataset.join)));
  document.querySelectorAll("[data-complete]").forEach((button) => button.addEventListener("click", () => completeChallenge(button.dataset.complete)));
  bindProfile();
  bindCoach();
}

function bindCoach() {
  const form = document.getElementById("chatForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    state.chat.messages.push({ role: "user", text: message, timestamp: new Date().toISOString() });
    state.chat.typing = true;
    input.value = "";
    document.getElementById("coachView").innerHTML = coachView(state);
    scrollChatToBottom();

    try {
      const response = await chatbotApi.send(message);
      state.chat.messages.push({ role: "coach", text: response.answer, timestamp: response.timestamp });
      await loadChatData();
    } catch (error) {
      state.chat.messages.push({ role: "coach", text: "Sorry, I couldn't process that. " + error.message, timestamp: new Date().toISOString() });
    }

    state.chat.typing = false;
    document.getElementById("coachView").innerHTML = coachView(state);
    bindCoach();
    scrollChatToBottom();
  });

  document.querySelectorAll("[data-suggest]").forEach((button) => button.addEventListener("click", () => {
    document.getElementById("chatInput").value = button.dataset.suggest;
    form.requestSubmit();
  }));

  const searchInput = document.getElementById("chatSearch");
  if (searchInput) {
    let debounce;
    searchInput.addEventListener("input", (event) => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        state.chat.search = event.target.value;
        await loadChatData();
        document.getElementById("coachView").innerHTML = coachView(state);
        bindCoach();
      }, 300);
    });
  }

  document.querySelectorAll("[data-load-chat]").forEach((button) => button.addEventListener("click", () => {
    const item = state.chat.history.find((h) => h.id === button.dataset.loadChat);
    if (!item) return;
    state.chat.messages = [
      { role: "user", text: item.question, timestamp: item.timestamp },
      { role: "coach", text: item.answer, timestamp: item.timestamp }
    ];
    document.getElementById("coachView").innerHTML = coachView(state);
    bindCoach();
    scrollChatToBottom();
  }));

  document.querySelectorAll("[data-delete-chat]").forEach((button) => button.addEventListener("click", async () => {
    try {
      await chatbotApi.delete(button.dataset.deleteChat);
      await loadChatData();
      toast("Chat deleted.", "−");
      document.getElementById("coachView").innerHTML = coachView(state);
      bindCoach();
    } catch (error) {
      toast("Delete failed: " + error.message, "!");
    }
  }));
}

async function persistMeta() {
  if (!apiReady) return;
  try {
    await usersApi.updateProfile({
      started: state.started,
      dismissed: state.dismissed,
      joinedChallenges: state.joinedChallenges,
      completedChallenges: state.completedChallenges,
      theme: state.theme
    });
  } catch {
    /* non-critical */
  }
}

async function joinChallenge(id) {
  state.joinedChallenges = [...new Set([...state.joinedChallenges, id])];
  if (apiReady) {
    try { await usersApi.updateChallenge(id, "join"); } catch { /* local fallback */ }
  }
  toast("Challenge joined. 50 points earned.", "✓");
  render();
}

async function completeChallenge(id) {
  state.completedChallenges = [...new Set([...state.completedChallenges, id])];
  if (apiReady) {
    try { await usersApi.updateChallenge(id, "complete"); } catch { /* local fallback */ }
  }
  toast("Challenge completed. 100 points earned.", "★");
  render();
}

function bindProfile() {
  const renewable = document.getElementById("profileRenewable");
  if (renewable) renewable.addEventListener("input", (event) => {
    document.getElementById("profileRenewableRead").textContent = `${event.target.value}%`;
  });
  const form = document.getElementById("profileForm");
  if (form) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.user = {
      ...state.user,
      name: valueOf("profileName"),
      location: valueOf("profileLocation"),
      country: valueOf("profileCountry"),
      household: Number(valueOf("profileHousehold")),
      target: Number(valueOf("profileTarget")),
      renewable: Number(valueOf("profileRenewable")),
      consent: document.getElementById("profileConsent").checked,
      avatar: valueOf("profileName").slice(0, 1).toUpperCase()
    };
    state.theme = valueOf("profileTheme");

    if (apiReady) {
      try {
        await usersApi.updateProfile({ ...state.user, annualTarget: state.user.target, theme: state.theme });
      } catch (error) {
        toast("Profile save failed: " + error.message, "!");
        return;
      }
    }

    toast("Profile saved.", "✓");
    render();
  });
  const json = document.getElementById("exportJsonBtn");
  if (json) json.addEventListener("click", () => downloadFile("carbontrack-data.json", JSON.stringify(state, null, 2), "application/json"));
  const csv = document.getElementById("exportCsvBtn");
  if (csv) csv.addEventListener("click", exportCsv);
  const reset = document.getElementById("resetBtn");
  if (reset) reset.addEventListener("click", () => {
    toast("Reset is disabled in cloud mode. Delete activities individually.", "!");
  });
}

function setupGlobalEvents() {
  document.getElementById("openLogBtn").addEventListener("click", () => openActivityModal());
  document.getElementById("undoBtn").addEventListener("click", undoLastDelete);
  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    persistMeta();
    toast(`${title(state.theme)} mode enabled.`, "◐");
    render();
  });
  els.category.addEventListener("change", () => populateTypes());
  els.type.addEventListener("change", updatePreview);
  els.value.addEventListener("input", updatePreview);
  els.date.addEventListener("change", updatePreview);
  els.form.addEventListener("submit", saveActivityFromModal);
}

function openActivityModal(activity = {}) {
  editingId = activity.id || null;
  const category = activity.category || "transportation";
  const type = activity.type || "car_petrol";
  els.category.innerHTML = Object.keys(factors).map((key) => option(key, title(key), category)).join("");
  populateTypes(type);
  els.date.value = activity.date || todayKey();
  els.value.value = activity.value || (category === "energy" ? 10 : 1);
  els.notes.value = activity.notes || "";
  els.saveActivityBtn.textContent = editingId ? "Save changes" : "Save activity";
  updatePreview();
  els.modal.showModal();
}

function populateTypes(selectedType) {
  const category = els.category.value;
  const first = Object.keys(factors[category])[0];
  els.type.innerHTML = Object.entries(factors[category]).map(([key, item]) => option(key, item.label, selectedType || first)).join("");
  if (selectedType && factors[category][selectedType]) els.type.value = selectedType;
  els.unit.value = factors[category][els.type.value].unit;
  updatePreview();
}

function updatePreview() {
  const category = els.category.value;
  const type = els.type.value;
  if (!category || !type) return;
  const factor = factors[category][type];
  const amount = Number(els.value.value) || 0;
  els.unit.value = factor.unit;
  els.preview.innerHTML = `<strong>${formatKg(calculateActivityCo2(category, type, amount))} CO2e</strong><span class="muted"> · ${amount || 0} ${factor.unit} × ${factor.factor} kg/${factor.unit}</span><div class="form-error" id="modalErrors"></div>`;
}

async function saveActivityFromModal(event) {
  event.preventDefault();
  const input = {
    category: els.category.value,
    type: els.type.value,
    date: els.date.value,
    value: Number(els.value.value),
    notes: els.notes.value.trim()
  };
  const errors = validateActivity(input);
  if (errors.length) {
    document.getElementById("modalErrors").textContent = errors.join(" ");
    return;
  }

  try {
    if (editingId && apiReady) {
      const { activity } = await activitiesApi.update(editingId, input);
      state.activities = state.activities.map((a) => a.id === editingId ? activity : a);
      toast("Activity updated.", "✓");
    } else if (apiReady) {
      const { activity } = await activitiesApi.create(input);
      state.activities = [...state.activities, activity];
      toast("Activity logged. 10 points earned.", "✓");
    } else {
      const factor = factors[input.category][input.type];
      const nextActivity = {
        id: editingId || createId(),
        ...input,
        unit: factor.unit,
        co2: calculateActivityCo2(input.category, input.type, input.value)
      };
      if (editingId) {
        state.activities = state.activities.map((a) => a.id === editingId ? nextActivity : a);
      } else {
        state.activities = [...state.activities, nextActivity];
      }
      toast("Activity saved locally.", "✓");
    }
  } catch (error) {
    document.getElementById("modalErrors").textContent = error.message;
    return;
  }

  editingId = null;
  els.modal.close();
  render();
  loadAiInsights();
}

async function deleteActivity(id) {
  const activity = state.activities.find((item) => item.id === id);
  if (!activity) return;
  lastDeleted = activity;

  try {
    if (apiReady) await activitiesApi.remove(id);
    state.activities = state.activities.filter((item) => item.id !== id);
    clearTimeout(deletedTimer);
    deletedTimer = setTimeout(() => { lastDeleted = null; }, 7000);
    toast("Activity deleted.", "−", `<button class="toast-action" id="toastUndo">Undo</button>`);
    document.getElementById("toastUndo")?.addEventListener("click", undoLastDelete);
    render();
    loadAiInsights();
  } catch (error) {
    toast("Delete failed: " + error.message, "!");
  }
}

async function undoLastDelete() {
  if (!lastDeleted) {
    toast("Nothing to undo.", "↶");
    return;
  }
  try {
    if (apiReady) {
      const { activity } = await activitiesApi.create({
        category: lastDeleted.category,
        type: lastDeleted.type,
        date: lastDeleted.date,
        value: lastDeleted.value,
        notes: lastDeleted.notes
      });
      state.activities = [...state.activities, activity];
    } else {
      state.activities = [...state.activities, lastDeleted];
    }
    lastDeleted = null;
    clearTimeout(deletedTimer);
    toast("Delete undone.", "↶");
    render();
  } catch (error) {
    toast("Undo failed: " + error.message, "!");
  }
}

function startRecommendation(id) {
  state.started = [...new Set([...state.started, id])];
  persistMeta();
  toast("Action added to your pathway. 50 points earned.", "★");
  render();
}

function exportCsv() {
  const header = ["Date", "Category", "Type", "Value", "Unit", "CO2", "Notes"];
  const rows = state.activities.map((activity) => [
    activity.date, activity.category, activity.type, activity.value, activity.unit, activity.co2, activity.notes || ""
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  downloadFile("carbontrack-activities.csv", csv, "text/csv");
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  els.themeToggle.classList.toggle("active", state.theme === "dark");
}

function toast(message, icon = "•", action = "") {
  const node = document.getElementById("toast");
  node.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>${action}`;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 3200);
}

function option(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function valueOf(id) {
  return document.getElementById(id).value;
}

setupGlobalEvents();
bootstrap();
