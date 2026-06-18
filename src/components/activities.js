import { factors } from "../data/factors.js";
import { escapeHtml, formatKg, title } from "../utils/helpers.js";
import { activityLabel, featureDescription } from "./ui.js";

export function filteredActivities(state) {
  const query = state.ui.activitySearch.trim().toLowerCase();
  const category = state.ui.activityFilter;
  const filtered = state.activities.filter((activity) => {
    const text = [activity.category, activity.type, activity.date, activity.notes, activityLabel(factors, activity)].join(" ").toLowerCase();
    return (category === "all" || activity.category === category) && (!query || text.includes(query));
  });

  return [...filtered].sort((a, b) => {
    switch (state.ui.activitySort) {
      case "oldest": return a.date.localeCompare(b.date);
      case "highest": return b.co2 - a.co2;
      case "lowest": return a.co2 - b.co2;
      case "alphabetical": return activityLabel(factors, a).localeCompare(activityLabel(factors, b));
      default: return b.date.localeCompare(a.date);
    }
  });
}

export function activitiesView(state) {
  const categories = ["all", ...Object.keys(factors)];
  const items = filteredActivities(state);
  return `
    ${featureDescription("Track and record daily carbon emissions from activities.")}
    <div class="card control-card">
      <div class="tabs">${categories.map((c) => `<button class="chip ${state.ui.activityFilter === c ? "active" : ""}" data-filter="${c}">${title(c)}</button>`).join("")}</div>
      <div class="activity-controls">
        <label>Search <input id="activitySearch" type="search" value="${escapeHtml(state.ui.activitySearch)}" placeholder="Category, notes, type, date" /></label>
        <label>Sort
          <select id="activitySort">
            ${sortOption("newest", "Newest first", state.ui.activitySort)}
            ${sortOption("oldest", "Oldest first", state.ui.activitySort)}
            ${sortOption("highest", "Highest emissions", state.ui.activitySort)}
            ${sortOption("lowest", "Lowest emissions", state.ui.activitySort)}
            ${sortOption("alphabetical", "Alphabetical", state.ui.activitySort)}
          </select>
        </label>
        <button class="primary-button" data-open-log>+ Log Activity</button>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-head"><div><span class="eyebrow">Entries</span><h2>${items.length} logged activities</h2></div></div>
      ${items.length ? items.map(activityRow).join("") : `<div class="empty">No entries match this search.</div>`}
    </div>
  `;
}

function sortOption(value, label, current) {
  return `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
}

function activityRow(activity) {
  const item = factors[activity.category][activity.type];
  return `
    <div class="activity-row">
      <div class="row" style="justify-content:space-between">
        <div><strong>${escapeHtml(item.icon)} ${escapeHtml(item.label)}</strong><div class="muted">${escapeHtml(activity.date)} · ${escapeHtml(activity.value)} ${escapeHtml(activity.unit)}${activity.notes ? ` · ${escapeHtml(activity.notes)}` : ""}</div></div>
        <div class="row"><span class="pill">${formatKg(activity.co2)}</span><button class="ghost-button" data-edit="${escapeHtml(activity.id)}">Edit</button><button class="danger-button" data-delete="${escapeHtml(activity.id)}">Delete</button></div>
      </div>
    </div>
  `;
}
