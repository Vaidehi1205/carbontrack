import { rankRecommendations } from "../utils/calculations.js";
import { escapeHtml, formatKg } from "../utils/helpers.js";
import { featureDescription, recommendationCard } from "./ui.js";

export function recommendationsView(state) {
  const rows = rankRecommendations(state);
  return `
    ${featureDescription("Set targets and choose practical actions to reduce your environmental impact.")}
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Personalized pathway</span>
        <h2>Ranked by contribution, frequency, preference, and impact</h2>
        ${rows.map((rec) => recommendationCard(rec)).join("") || `<div class="empty">You dismissed every action. Reset them from Profile.</div>`}
      </div>
      <div class="card">
        <span class="eyebrow">Actions in progress</span>
        <h2>${state.started.length} started</h2>
        ${state.started.length ? state.started.map((id) => {
          const rec = rows.find((x) => x.id === id) || rankRecommendations({ ...state, dismissed: [] }).find((x) => x.id === id);
          return rec ? `<div class="recommendation-row"><strong>${escapeHtml(rec.title)}</strong><span class="muted">Expected annual reduction: ${formatKg(rec.impact)}</span><div class="bar"><span style="width:42%;background:var(--sage)"></span></div></div>` : "";
        }).join("") : `<div class="empty">Start an action when one feels doable.</div>`}
        <div class="offset-box">
          <strong>Carbon offset suggestions</strong>
          <span>Consider verified tree planting, renewable electricity certificates, community solar, or certified carbon offset programs for unavoidable emissions.</span>
        </div>
      </div>
    </div>
  `;
}
