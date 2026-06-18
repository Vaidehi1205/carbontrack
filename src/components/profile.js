import { achievementsFor, calculateStreak, currentStats, levelFor, pointsFor } from "../utils/calculations.js";
import { escapeHtml, formatKg } from "../utils/helpers.js";
import { featureDescription, metricCard, progressBar } from "./ui.js";

export function profileView(state) {
  const points = pointsFor(state);
  const stats = currentStats(state);
  const streak = calculateStreak(state.activities);
  const badges = achievementsFor(state);
  return `
    ${featureDescription("Manage your profile, preferences, exports, and achievement progress.")}
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Settings</span>
        <div class="profile-head">
          <div class="avatar">${escapeHtml(state.user.avatar || state.user.name.slice(0, 1))}</div>
          <div><h2>${escapeHtml(state.user.name)}</h2><span class="muted">${levelFor(points)} · ${points} points</span></div>
        </div>
        <form id="profileForm" class="form-grid">
          <label>Name <input id="profileName" value="${escapeHtml(state.user.name)}" /></label>
          <label>Location <input id="profileLocation" value="${escapeHtml(state.user.location)}" /></label>
          <label>Country
            <select id="profileCountry">
              ${countryOption("IN", "India", state.user.country)}
              ${countryOption("US", "USA", state.user.country)}
              ${countryOption("UK", "UK", state.user.country)}
              ${countryOption("CA", "Canada", state.user.country)}
              ${countryOption("AU", "Australia", state.user.country)}
            </select>
          </label>
          <label>Household <input id="profileHousehold" type="number" min="1" max="8" value="${state.user.household}" /></label>
          <label>Annual target, kg <input id="profileTarget" type="number" min="1000" step="100" value="${state.user.target}" /></label>
          <label class="range-line">Renewable energy <input id="profileRenewable" type="range" min="0" max="100" value="${state.user.renewable}" /><strong id="profileRenewableRead">${state.user.renewable}%</strong></label>
          <label>Theme
            <select id="profileTheme">
              <option value="light" ${state.theme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${state.theme === "dark" ? "selected" : ""}>Dark</option>
            </select>
          </label>
          <label><span>Anonymous data sharing</span><input id="profileConsent" type="checkbox" ${state.user.consent ? "checked" : ""} /></label>
          <button class="primary-button" type="submit">Save profile</button>
        </form>
      </div>
      <div class="card">
        <span class="eyebrow">Gamification</span>
        <h2>Streaks and achievements</h2>
        <div class="grid three-col">
          ${metricCard("Logging streak", `${streak} days`, "7, 15, and 30-day badges")}
          ${metricCard("Level", levelFor(points).replace("Level ", "L"), `${points} points`)}
          ${metricCard("Annual pace", formatKg(stats.annualPace), "projected CO2e")}
        </div>
        <div class="streak-badges">
          ${[7, 15, 30].map((days) => `<span class="badge ${streak >= days ? "unlocked" : ""}">🔥 ${days}-day streak</span>`).join("")}
        </div>
        <h3>Achievements</h3>
        <div class="achievement-grid">${badges.map((badge) => `<div class="achievement ${badge.unlocked ? "unlocked" : ""}"><strong>${badge.name}</strong><span>${badge.detail}</span></div>`).join("")}</div>
        <h3>Target progress</h3>
        ${progressBar(stats.targetProgress, stats.annualPace <= state.user.target ? "var(--sage)" : "var(--amber)", "Target progress")}
        <div class="quick-row export-row"><button class="ghost-button" id="exportJsonBtn">Export JSON</button><button class="ghost-button" id="exportCsvBtn">Export CSV</button><button class="danger-button" id="resetBtn">Reset app</button></div>
      </div>
    </div>
  `;
}

function countryOption(value, label, current) {
  return `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
}
