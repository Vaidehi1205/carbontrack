const factors = {
  transportation: {
    car_petrol: { label: "Petrol car trip", unit: "km", factor: 0.192, icon: "🚗" },
    car_electric: { label: "Electric car trip", unit: "km", factor: 0.053, icon: "⚡" },
    bus: { label: "Bus ride", unit: "km", factor: 0.089, icon: "🚌" },
    train: { label: "Train ride", unit: "km", factor: 0.041, icon: "🚆" },
    bike_walk: { label: "Bike or walk", unit: "km", factor: 0, icon: "↗" }
  },
  energy: {
    electricity: { label: "Electricity", unit: "kWh", factor: 0.386, icon: "💡" },
    natural_gas: { label: "Natural gas", unit: "therms", factor: 5.3, icon: "🔥" },
    renewable_credit: { label: "Renewable energy credit", unit: "kWh", factor: -0.22, icon: "✓" }
  },
  food: {
    chicken_meal: { label: "Chicken meal", unit: "serving", factor: 1.8, icon: "🍽" },
    dairy: { label: "Dairy serving", unit: "serving", factor: 1.4, icon: "🥛" },
    plant_meal: { label: "Plant-based meal", unit: "serving", factor: 0.7, icon: "🥗" }
  },
  shopping: {
    clothing: { label: "Clothing purchase", unit: "item", factor: 18, icon: "👕" },
    electronics: { label: "Electronics purchase", unit: "item", factor: 90, icon: "▣" },
    household_goods: { label: "Household goods", unit: "$100", factor: 24, icon: "□" }
  },
  waste: {
    landfill: { label: "Landfill waste", unit: "bag", factor: 3.2, icon: "▥" },
    recycled: { label: "Recycled waste", unit: "bag", factor: 0.7, icon: "♻" },
    composted: { label: "Composted waste", unit: "bag", factor: 0.25, icon: "◌" }
  }
};

const recommendations = [
  { id: "transit", category: "transportation", title: "Switch 2 car commutes to transit", text: "Your driving entries make this one of the highest leverage changes.", impact: 410, savings: 1840, effort: "Easy" },
  { id: "meatless", category: "food", title: "Try two plant-based dinners weekly", text: "Adding plant-based meals can lower food emissions without changing every meal.", impact: 320, savings: 460, effort: "Easy" },
  { id: "renewable", category: "energy", title: "Move part of your electricity to renewables", text: "A 50% renewable plan can reduce energy emissions while keeping routines intact.", impact: 620, savings: 120, effort: "Medium" },
  { id: "reuse", category: "shopping", title: "Buy secondhand for your next clothing item", text: "Shopping emissions are spiky. This keeps the next spike lower.", impact: 140, savings: 260, effort: "Easy" },
  { id: "compost", category: "waste", title: "Compost food scraps twice a week", text: "Waste is a smaller category, but composting builds a reliable habit loop.", impact: 80, savings: 30, effort: "Medium" }
];

const challenges = [
  { title: "Transit Sprint", category: "transportation", days: 14, target: 35, members: 182 },
  { title: "Plant Plate Week", category: "food", days: 7, target: 18, members: 264 },
  { title: "Lower Load Laundry", category: "energy", days: 21, target: 24, members: 96 },
  { title: "Zero Waste Weekend", category: "waste", days: 3, target: 8, members: 151 }
];

const navItems = [
  ["dashboard", "⌂", "Dashboard"],
  ["activities", "+", "Activity log"],
  ["insights", "◒", "Insights"],
  ["recommendations", "★", "Actions"],
  ["challenges", "◇", "Challenges"],
  ["profile", "◉", "Profile"]
];

const sampleActivities = [
  activity("transportation", "car_petrol", -6, 22, "Commute"),
  activity("food", "plant_meal", -6, 2, "Lunch"),
  activity("energy", "electricity", -5, 18, "Home use"),
  activity("transportation", "bus", -4, 14, "Office day"),
  activity("food", "chicken_meal", -3, 1, "Dinner"),
  activity("waste", "recycled", -2, 2, "Recycling"),
  activity("shopping", "clothing", -1, 1, "Work shirt"),
  activity("transportation", "bike_walk", 0, 5, "Errands")
];

let state = loadState();
let activeView = "dashboard";
let activeFilter = "all";
let dismissed = new Set(state.dismissed || []);

function activity(category, type, daysAgo, value, notes = "") {
  const date = new Date();
  date.setDate(date.getDate() + daysAgo);
  const item = factors[category][type];
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    category,
    type,
    date: date.toISOString().slice(0, 10),
    value,
    unit: item.unit,
    co2: round(value * item.factor),
    notes
  };
}

function loadState() {
  const saved = localStorage.getItem("carbontrack-state");
  if (saved) return JSON.parse(saved);
  return {
    onboarded: false,
    user: {
      name: "Alex",
      location: "Seattle, WA",
      country: "US",
      household: 2,
      motivation: "climate",
      commute: "car_petrol",
      renewable: 18,
      target: 7800,
      consent: false
    },
    activities: sampleActivities,
    started: [],
    dismissed: []
  };
}

function saveState() {
  state.dismissed = [...dismissed];
  localStorage.setItem("carbontrack-state", JSON.stringify(state));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatKg(value) {
  return `${round(value).toLocaleString()} kg`;
}

function formatTons(value) {
  return `${round(value / 1000).toLocaleString()} t`;
}

function byDate(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return state.activities.filter((a) => new Date(a.date) >= cutoff);
}

function totals(days = 7) {
  const items = byDate(days);
  const total = round(items.reduce((sum, a) => sum + a.co2, 0));
  const byCategory = {};
  items.forEach((a) => {
    byCategory[a.category] = round((byCategory[a.category] || 0) + a.co2);
  });
  return { total, byCategory, items };
}

function annualPace() {
  const month = totals(30).total;
  return round((month / 30) * 365);
}

function render() {
  renderNav();
  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  document.getElementById("communityTotal").textContent = "5.8 t";
  renderOnboarding();
  renderDashboard();
  renderActivities();
  renderInsights();
  renderRecommendations();
  renderChallenges();
  renderProfile();
  showView(activeView);
  saveState();
}

function renderNav() {
  document.getElementById("nav").innerHTML = navItems
    .map(([id, icon, label]) => `<button class="${id === activeView ? "active" : ""}" data-view="${id}"><span>${icon}</span>${label}</button>`)
    .join("");
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      render();
    });
  });
}

function showView(view) {
  const titles = { dashboard: "Dashboard", activities: "Activity log", insights: "Insights", recommendations: "Recommended actions", challenges: "Challenges", profile: "Profile" };
  document.getElementById("pageTitle").textContent = titles[view];
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  if (!state.onboarded) {
    document.getElementById("pageTitle").textContent = "Welcome";
    return;
  }
  document.getElementById(`${view}View`).classList.add("active");
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
      <h2>Track your carbon footprint in 5 minutes</h2>
      <p>Set a baseline, then start with the few activities that shape most of your weekly impact.</p>
    </div>
    <div class="card onboarding-card" style="margin-top:16px">
      <form id="onboardingForm" class="form-grid">
        <label>Display name <input id="nameSetup" value="${state.user.name}" required /></label>
        <label>Location <input id="locationSetup" value="${state.user.location}" required /></label>
        <label>Household size <input id="householdSetup" type="number" min="1" max="8" value="${state.user.household}" /></label>
        <label>Primary motivation
          <select id="motivationSetup">
            ${["climate", "cost", "health", "social"].map((x) => `<option ${state.user.motivation === x ? "selected" : ""}>${x}</option>`).join("")}
          </select>
        </label>
        <label>Usual commute
          <select id="commuteSetup">
            ${Object.entries(factors.transportation).map(([key, item]) => `<option value="${key}" ${state.user.commute === key ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label class="range-line">Renewable energy <input id="renewableSetup" type="range" min="0" max="100" value="${state.user.renewable}" /><strong id="renewableRead">${state.user.renewable}%</strong></label>
        <button class="primary-button" type="submit">Start tracking</button>
      </form>
    </div>
  `;
  document.getElementById("renewableSetup").addEventListener("input", (event) => {
    document.getElementById("renewableRead").textContent = `${event.target.value}%`;
  });
  document.getElementById("onboardingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.user = {
      ...state.user,
      name: value("nameSetup"),
      location: value("locationSetup"),
      household: Number(value("householdSetup")),
      motivation: value("motivationSetup"),
      commute: value("commuteSetup"),
      renewable: Number(value("renewableSetup"))
    };
    state.onboarded = true;
    toast("Baseline ready. Your dashboard is live.");
    render();
  });
}

function renderDashboard() {
  const week = totals(7);
  const previousWeek = state.activities
    .filter((a) => daysBetween(a.date) > 7 && daysBetween(a.date) <= 14)
    .reduce((sum, a) => sum + a.co2, 0);
  const delta = previousWeek ? Math.round(((week.total - previousWeek) / previousWeek) * 100) : -8;
  const pace = annualPace();
  document.getElementById("dashboardView").innerHTML = `
    <div class="grid metrics">
      ${metric("This week", formatKg(week.total), "CO2e logged")}
      ${metric("Vs. last week", `${delta > 0 ? "+" : ""}${delta}%`, delta <= 0 ? "reduction" : "increase", delta <= 0 ? "positive" : "warning")}
      ${metric("Annual pace", formatTons(pace), `${Math.max(0, Math.round((1 - pace / state.user.target) * 100))}% toward target`, "positive")}
      ${metric("Peer context", "Top 28%", `for ${state.user.location}`, "positive")}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Trend</span><h2>Last 14 days</h2></div><span class="pill">${formatKg(week.total)} this week</span></div>
        <canvas id="trendChart" width="760" height="260"></canvas>
      </div>
      <div class="card">
        <span class="eyebrow">Breakdown</span>
        <h2>Emissions by category</h2>
        ${breakdownMarkup(week.byCategory)}
      </div>
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card">
        <span class="eyebrow">Quick log</span>
        <h2>Common activities</h2>
        <div class="grid three-col">
          ${quickButton("transportation", "car_petrol", "Commute")}
          ${quickButton("food", "plant_meal", "Meal")}
          ${quickButton("energy", "electricity", "Energy")}
        </div>
      </div>
      <div class="card">
        <span class="eyebrow">Next best action</span>
        ${recommendationCard(topRecommendation(), true)}
      </div>
    </div>
  `;
  drawTrendChart();
  bindQuickButtons();
}

function metric(label, valueText, subtext, tone = "") {
  return `<div class="card metric"><span>${label}</span><strong class="${tone}">${valueText}</strong><span>${subtext}</span></div>`;
}

function quickButton(category, type, label) {
  const item = factors[category][type];
  return `<button class="quick-button" data-quick="${category}:${type}"><span>${item.icon}</span><strong>${label}</strong><small>${item.label}</small></button>`;
}

function breakdownMarkup(byCategory) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, amount]) => amount), 1);
  if (!entries.length) return `<div class="empty">No activity logged yet.</div>`;
  const colors = { transportation: "#2d9caa", energy: "#d78b23", food: "#4f8f6f", shopping: "#7566b1", waste: "#c95c60" };
  return entries.map(([category, amount]) => `
    <div class="breakdown-item">
      <div class="row" style="justify-content:space-between"><strong>${title(category)}</strong><span>${formatKg(amount)}</span></div>
      <div class="bar"><span style="width:${Math.max(4, (amount / max) * 100)}%;background:${colors[category]}"></span></div>
    </div>
  `).join("");
}

function renderActivities() {
  const categories = ["all", ...Object.keys(factors)];
  const items = state.activities
    .filter((a) => activeFilter === "all" || a.category === activeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById("activitiesView").innerHTML = `
    <div class="tabs">${categories.map((c) => `<button class="chip ${activeFilter === c ? "active" : ""}" data-filter="${c}">${title(c)}</button>`).join("")}</div>
    <div class="card">
      <div class="card-head"><div><span class="eyebrow">Entries</span><h2>${items.length} logged activities</h2></div><button class="primary-button" data-open-log>+ Log Activity</button></div>
      ${items.length ? items.map(activityRow).join("") : `<div class="empty">No entries in this category.</div>`}
    </div>
  `;
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    state.lastDeleted = state.activities.find((a) => a.id === button.dataset.delete);
    state.activities = state.activities.filter((a) => a.id !== button.dataset.delete);
    toast("Activity deleted.");
    render();
  }));
  bindOpenLog();
}

function activityRow(a) {
  const item = factors[a.category][a.type];
  return `
    <div class="activity-row">
      <div class="row" style="justify-content:space-between">
        <div><strong>${item.icon} ${item.label}</strong><div class="muted">${a.date} · ${a.value} ${a.unit}${a.notes ? ` · ${a.notes}` : ""}</div></div>
        <div class="row"><span class="pill">${formatKg(a.co2)}</span><button class="danger-button" data-delete="${a.id}">Delete</button></div>
      </div>
    </div>
  `;
}

function renderInsights() {
  const pace = annualPace();
  const target = state.user.target;
  const all = totals(365);
  document.getElementById("insightsView").innerHTML = `
    <div class="grid two-col">
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Projection</span><h2>Annual pace vs. target</h2></div><span class="pill">${formatTons(target)} target</span></div>
        <canvas id="projectionChart" width="760" height="260"></canvas>
      </div>
      <div class="card">
        <span class="eyebrow">Calculation transparency</span>
        <h2>How your entries are counted</h2>
        <p class="muted">Every entry uses amount × emission factor. Your current annual pace is based on the most recent 30 days.</p>
        ${Object.entries(factors).map(([category, items]) => `<div class="breakdown-item"><strong>${title(category)}</strong><span class="muted">${Object.values(items).map((x) => `${x.label}: ${x.factor} kg/${x.unit}`).join(", ")}</span></div>`).join("")}
      </div>
    </div>
    <div class="grid three-col" style="margin-top:16px">
      ${metric("All logged", formatKg(all.total), "total stored locally")}
      ${metric("Projected gap", formatKg(Math.max(0, pace - target)), "above annual target", pace <= target ? "positive" : "warning")}
      ${metric("Actions started", state.started.length, "active changes", "positive")}
    </div>
  `;
  drawProjectionChart(pace, target);
}

function renderRecommendations() {
  const rows = rankedRecommendations().filter((rec) => !dismissed.has(rec.id));
  document.getElementById("recommendationsView").innerHTML = `
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Personalized pathway</span>
        <h2>Ranked by impact and fit</h2>
        ${rows.map((rec) => recommendationCard(rec)).join("") || `<div class="empty">You dismissed every action. Reset them from Profile.</div>`}
      </div>
      <div class="card">
        <span class="eyebrow">Actions in progress</span>
        <h2>${state.started.length} started</h2>
        ${state.started.length ? state.started.map((id) => {
          const rec = recommendations.find((x) => x.id === id);
          return `<div class="recommendation-row"><strong>${rec.title}</strong><span class="muted">Expected annual reduction: ${formatKg(rec.impact)}</span><div class="bar"><span style="width:42%;background:var(--sage)"></span></div></div>`;
        }).join("") : `<div class="empty">Start an action when one feels doable.</div>`}
      </div>
    </div>
  `;
  bindRecommendationButtons();
}

function recommendationCard(rec, compact = false) {
  if (!rec) return "";
  return `
    <div class="recommendation-row">
      <div class="row" style="justify-content:space-between">
        <div><strong>${rec.title}</strong><div class="muted">${rec.text}</div></div>
        <span class="effort">${rec.effort}</span>
      </div>
      <div class="row" style="justify-content:space-between;flex-wrap:wrap">
        <span class="pill">${formatKg(rec.impact)}/yr</span>
        <span class="pill">$${rec.savings.toLocaleString()}/yr</span>
        <span class="pill">${Math.round(rec.score * 100)}% fit</span>
      </div>
      ${compact ? `<button class="primary-button" data-start="${rec.id}">Start</button>` : `<div class="row"><button class="primary-button" data-start="${rec.id}">Start</button><button class="ghost-button" data-dismiss="${rec.id}">Dismiss</button></div>`}
    </div>
  `;
}

function renderChallenges() {
  document.getElementById("challengesView").innerHTML = `
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Community</span>
        <h2>Active challenges</h2>
        ${challenges.map((c, index) => `
          <div class="challenge-row">
            <div class="row" style="justify-content:space-between"><strong>${c.title}</strong><span class="pill">${c.members} joined</span></div>
            <div class="challenge-meta"><span>${title(c.category)}</span><span>${c.days} days</span><span>${formatKg(c.target)} target</span></div>
            <div class="bar"><span style="width:${34 + index * 13}%;background:${["#2d9caa", "#4f8f6f", "#d78b23", "#c95c60"][index]}"></span></div>
          </div>
        `).join("")}
      </div>
      <div class="card hero-visual">
        <span class="eyebrow">Shared progress</span>
        <h2>Anonymous proof, not pressure</h2>
        <p>CarbonTrack keeps social context community-level so progress feels supported instead of ranked.</p>
      </div>
    </div>
  `;
}

function renderProfile() {
  document.getElementById("profileView").innerHTML = `
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Settings</span>
        <h2>Profile and baseline</h2>
        <form id="profileForm" class="form-grid">
          <label>Name <input id="profileName" value="${state.user.name}" /></label>
          <label>Location <input id="profileLocation" value="${state.user.location}" /></label>
          <label>Household <input id="profileHousehold" type="number" min="1" max="8" value="${state.user.household}" /></label>
          <label>Annual target, kg <input id="profileTarget" type="number" min="1000" step="100" value="${state.user.target}" /></label>
          <label class="range-line">Renewable energy <input id="profileRenewable" type="range" min="0" max="100" value="${state.user.renewable}" /><strong id="profileRenewableRead">${state.user.renewable}%</strong></label>
          <label><span>Anonymous data sharing</span><input id="profileConsent" type="checkbox" ${state.user.consent ? "checked" : ""} /></label>
          <button class="primary-button" type="submit">Save profile</button>
        </form>
      </div>
      <div class="card">
        <span class="eyebrow">Privacy controls</span>
        <h2>Your data stays local in this MVP</h2>
        <p class="muted">Activities and settings are stored in this browser only. You can export or clear them anytime.</p>
        <div class="quick-row"><button class="ghost-button" id="exportBtn">Export JSON</button><button class="danger-button" id="resetBtn">Reset app</button><button class="ghost-button" id="resetRecsBtn">Reset actions</button></div>
        <p class="footer-note">Future backend builds should add encrypted accounts, consent tracking, and deletion workflows.</p>
      </div>
    </div>
  `;
  document.getElementById("profileRenewable").addEventListener("input", (event) => {
    document.getElementById("profileRenewableRead").textContent = `${event.target.value}%`;
  });
  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.user = {
      ...state.user,
      name: value("profileName"),
      location: value("profileLocation"),
      household: Number(value("profileHousehold")),
      target: Number(value("profileTarget")),
      renewable: Number(value("profileRenewable")),
      consent: document.getElementById("profileConsent").checked
    };
    toast("Profile saved.");
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem("carbontrack-state");
    state = loadState();
    dismissed = new Set();
    toast("App reset.");
    render();
  });
  document.getElementById("resetRecsBtn").addEventListener("click", () => {
    dismissed = new Set();
    state.started = [];
    toast("Actions reset.");
    render();
  });
}

function rankedRecommendations() {
  const byCategory = totals(30).byCategory;
  const max = Math.max(...Object.values(byCategory), 1);
  return recommendations
    .map((rec) => ({ ...rec, score: Math.min(0.99, 0.35 + (byCategory[rec.category] || 0) / max * 0.4 + rec.impact / 2500) }))
    .sort((a, b) => b.score - a.score);
}

function topRecommendation() {
  return rankedRecommendations().find((rec) => !dismissed.has(rec.id));
}

function bindRecommendationButtons() {
  document.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => {
    if (!state.started.includes(button.dataset.start)) state.started.push(button.dataset.start);
    toast("Action added to your pathway.");
    render();
  }));
  document.querySelectorAll("[data-dismiss]").forEach((button) => button.addEventListener("click", () => {
    dismissed.add(button.dataset.dismiss);
    toast("Recommendation dismissed.");
    render();
  }));
}

function bindQuickButtons() {
  document.querySelectorAll("[data-quick]").forEach((button) => button.addEventListener("click", () => {
    const [category, type] = button.dataset.quick.split(":");
    openActivityModal(category, type);
  }));
}

function bindOpenLog() {
  document.querySelectorAll("[data-open-log]").forEach((button) => button.addEventListener("click", () => openActivityModal()));
}

function setupModal() {
  const modal = document.getElementById("activityModal");
  document.getElementById("openLogBtn").addEventListener("click", () => openActivityModal());
  document.getElementById("categoryInput").addEventListener("change", () => populateTypes());
  ["typeInput", "valueInput"].forEach((id) => document.getElementById(id).addEventListener("input", updatePreview));
  document.getElementById("activityForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const category = value("categoryInput");
    const type = value("typeInput");
    const amount = Number(value("valueInput"));
    const item = factors[category][type];
    state.activities.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      category,
      type,
      date: value("dateInput"),
      value: amount,
      unit: item.unit,
      co2: round(amount * item.factor),
      notes: value("notesInput")
    });
    modal.close();
    toast("Activity logged.");
    render();
  });
  document.getElementById("undoBtn").addEventListener("click", () => {
    if (state.lastDeleted) {
      state.activities.push(state.lastDeleted);
      state.lastDeleted = null;
      toast("Activity restored.");
      render();
      return;
    }
    const removed = state.activities.pop();
    if (removed) {
      state.lastDeleted = removed;
      toast("Last activity removed.");
      render();
    }
  });
}

function openActivityModal(category = "transportation", type = "car_petrol") {
  const modal = document.getElementById("activityModal");
  document.getElementById("categoryInput").innerHTML = Object.keys(factors).map((key) => `<option value="${key}">${title(key)}</option>`).join("");
  document.getElementById("categoryInput").value = category;
  populateTypes(type);
  document.getElementById("dateInput").value = new Date().toISOString().slice(0, 10);
  document.getElementById("valueInput").value = category === "energy" ? 10 : 1;
  document.getElementById("notesInput").value = "";
  updatePreview();
  modal.showModal();
}

function populateTypes(selected) {
  const category = value("categoryInput");
  const options = Object.entries(factors[category]).map(([key, item]) => `<option value="${key}">${item.label}</option>`).join("");
  document.getElementById("typeInput").innerHTML = options;
  if (selected && factors[category][selected]) document.getElementById("typeInput").value = selected;
  document.getElementById("unitInput").value = factors[category][value("typeInput")].unit;
  updatePreview();
}

function updatePreview() {
  const category = value("categoryInput");
  const type = value("typeInput");
  if (!category || !type) return;
  const item = factors[category][type];
  const amount = Number(value("valueInput")) || 0;
  document.getElementById("unitInput").value = item.unit;
  document.getElementById("calcPreview").innerHTML = `<strong>${formatKg(amount * item.factor)} CO2e</strong><span class="muted"> · ${amount || 0} ${item.unit} × ${item.factor} kg/${item.unit}</span>`;
}

function drawTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const key = date.toISOString().slice(0, 10);
    return { key, value: state.activities.filter((a) => a.date === key).reduce((sum, a) => sum + a.co2, 0) };
  });
  drawLine(canvas, days, "#2d9caa", "kg CO2e");
}

function drawProjectionChart(pace, target) {
  const canvas = document.getElementById("projectionChart");
  if (!canvas) return;
  drawBars(canvas, [
    { key: "Current pace", value: pace, color: "#d78b23" },
    { key: "Target", value: target, color: "#4f8f6f" },
    { key: "Peer avg.", value: 9400, color: "#7566b1" }
  ]);
}

function drawLine(canvas, points, color, label) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const pad = 34;
  const max = Math.max(...points.map((p) => p.value), 1);
  ctx.strokeStyle = "#dfe7e2";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + i * ((height - pad * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  points.forEach((point, i) => {
    const x = pad + i * ((width - pad * 2) / (points.length - 1));
    const y = height - pad - (point.value / max) * (height - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "#15201c";
  ctx.font = "13px system-ui";
  ctx.fillText(label, pad, 18);
}

function drawBars(canvas, bars) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...bars.map((b) => b.value));
  const pad = 38;
  const barWidth = (width - pad * 2) / bars.length - 22;
  bars.forEach((bar, i) => {
    const x = pad + i * ((width - pad * 2) / bars.length) + 11;
    const h = (bar.value / max) * (height - pad * 2);
    const y = height - pad - h;
    ctx.fillStyle = bar.color;
    ctx.fillRect(x, y, barWidth, h);
    ctx.fillStyle = "#15201c";
    ctx.font = "13px system-ui";
    ctx.fillText(bar.key, x, height - 12);
    ctx.fillText(formatTons(bar.value), x, y - 8);
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "carbontrack-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function daysBetween(dateText) {
  return Math.floor((new Date() - new Date(dateText)) / 86400000);
}

function title(text) {
  return text.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function value(id) {
  return document.getElementById(id).value;
}

function toast(message) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2200);
}

setupModal();
render();
