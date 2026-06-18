import { escapeHtml, formatKg, title } from "../utils/helpers.js";

export function metricCard(label, value, subtext, tone = "") {
  return `<div class="card metric"><span>${escapeHtml(label)}</span><strong class="${escapeHtml(tone)}">${escapeHtml(value)}</strong><span>${escapeHtml(subtext)}</span></div>`;
}

export function featureDescription(text) {
  return `<p class="muted feature-description">${escapeHtml(text)}</p>`;
}

export function progressBar(value, color = "var(--sage)", label = "") {
  const width = Math.max(3, Math.min(100, Number(value) || 0));
  return `<div class="progress-line" aria-label="${escapeHtml(label)}"><div class="bar"><span style="width:${width}%;background:${color}"></span></div><strong>${Math.round(width)}%</strong></div>`;
}

export function activityLabel(factors, activity) {
  const factor = factors[activity.category]?.[activity.type];
  return factor ? factor.label : title(activity.type);
}

export function recommendationCard(rec, compact = false) {
  if (!rec) return `<div class="empty">Keep logging to unlock more actions.</div>`;
  return `
    <div class="recommendation-row">
      <div class="row" style="justify-content:space-between">
        <div><strong>${escapeHtml(rec.title)}</strong><div class="muted">${escapeHtml(rec.text)}</div></div>
        <span class="effort">${escapeHtml(rec.effort)}</span>
      </div>
      <div class="row" style="justify-content:space-between;flex-wrap:wrap">
        <span class="pill">${formatKg(rec.impact)}/yr</span>
        <span class="pill">$${rec.savings.toLocaleString()}/yr</span>
        <span class="pill">${Math.round(rec.score * 100)}% match</span>
      </div>
      ${compact ? `<button class="primary-button" data-start="${escapeHtml(rec.id)}">Start</button>` : `<div class="row"><button class="primary-button" data-start="${escapeHtml(rec.id)}">Start</button><button class="ghost-button" data-dismiss="${escapeHtml(rec.id)}">Dismiss</button></div>`}
    </div>
  `;
}
