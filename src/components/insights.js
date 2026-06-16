import { countryBenchmarks } from "../data/factors.js";
import { aiInsights, categoryBreakdown, currentStats, dailyTotals } from "../utils/calculations.js";
import { escapeHtml, formatKg, formatTons, title } from "../utils/helpers.js";
import { renderBarChart } from "../charts/barChart.js";
import { renderLineChart } from "../charts/lineChart.js";
import { metricCard } from "./ui.js";

export function insightsView(state) {
  const stats = currentStats(state);
  const benchmark = countryBenchmarks[state.user.country] || countryBenchmarks.US;
  const ai = state.aiInsights || {};

  return `
    <div class="grid two-col">
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Projection</span><h2>Annual pace vs target</h2></div><span class="pill">${formatTons(benchmark.annualKg)} ${benchmark.label} avg</span></div>
        <canvas id="annualBarChart"></canvas>
      </div>
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">History</span><h2>Monthly emissions trend</h2></div><span class="pill">${stats.trend}</span></div>
        <canvas id="monthlyTrendChart"></canvas>
      </div>
    </div>
    <div class="grid metrics" style="margin-top:16px">
      ${metricCard("Carbon Score", `${ai.carbonScore ?? "—"}/100`, "AI footprint rating", (ai.carbonScore ?? 0) >= 60 ? "positive" : "warning")}
      ${metricCard("Sustainability Score", `${ai.sustainabilityScore ?? "—"}/100`, "Overall eco score")}
      ${metricCard("This week", formatKg(stats.week), ai.weeklySummary ? escapeHtml(ai.weeklySummary.slice(0, 40)) + "…" : "total CO2e")}
      ${metricCard("This month", formatKg(stats.month), ai.monthlySummary ? escapeHtml(ai.monthlySummary.slice(0, 40)) + "…" : `${formatKg(stats.averageDaily)} avg/day`)}
      ${metricCard("Last month", formatKg(stats.lastMonth), "comparison period")}
      ${metricCard("This year", formatKg(stats.year), "logged so far")}
      ${metricCard("Biggest contributor", title(stats.biggestCategory), "last 30 days")}
      ${metricCard("Projected emissions", formatTons(stats.annualPace), "annual pace")}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card">
        <span class="eyebrow">AI Insights Dashboard</span>
        <h2>Weekly & monthly summary</h2>
        ${ai.weeklySummary ? `<div class="insight-line"><strong>Weekly:</strong> ${escapeHtml(ai.weeklySummary)}</div>` : ""}
        ${ai.monthlySummary ? `<div class="insight-line"><strong>Monthly:</strong> ${escapeHtml(ai.monthlySummary)}</div>` : ""}
        ${ai.predictedSavings ? `<div class="insight-line"><strong>Predicted savings:</strong> ${escapeHtml(ai.predictedSavings)}</div>` : ""}
        ${!ai.weeklySummary ? aiInsights(state).map((insight) => `<div class="insight-line">${insight}</div>`).join("") : ""}
      </div>
      <div class="card">
        <span class="eyebrow">Top improvement opportunities</span>
        <h2>AI recommendations</h2>
        ${(ai.topOpportunities || []).length
    ? ai.topOpportunities.map((opp) => `<div class="insight-line">${escapeHtml(opp)}</div>`).join("")
    : aiInsights(state).map((insight) => `<div class="insight-line">${insight}</div>`).join("")}
        <h3 style="margin-top:16px">Category breakdown</h3>
        ${Object.entries(categoryBreakdown(state.activities)).map(([category, amount]) => `<div class="breakdown-item"><strong>${title(category)}</strong><span class="muted">${formatKg(amount)}</span></div>`).join("")}
      </div>
    </div>
  `;
}

export function renderInsightsCharts(state) {
  const stats = currentStats(state);
  const benchmark = countryBenchmarks[state.user.country] || countryBenchmarks.US;
  renderBarChart("annualBarChart", ["Current pace", "Target", `${benchmark.label} avg`], [stats.annualPace, state.user.target, benchmark.annualKg], "Annual kg CO2e");
  const month = dailyTotals(state.activities, 30);
  renderLineChart("monthlyTrendChart", month.map((point) => point.date.slice(5)), month.map((point) => point.value), "Daily kg CO2e");
}
