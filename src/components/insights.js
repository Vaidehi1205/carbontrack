import { countryBenchmarks } from "../data/factors.js";
import { aiInsights, categoryBreakdown, currentStats, dailyTotals } from "../utils/calculations.js";
import { formatKg, formatTons, title } from "../utils/helpers.js";
import { renderBarChart } from "../charts/barChart.js";
import { renderLineChart } from "../charts/lineChart.js";
import { metricCard } from "./ui.js";

export function insightsView(state) {
  const stats = currentStats(state);
  const benchmark = countryBenchmarks[state.user.country] || countryBenchmarks.US;
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
      ${metricCard("Today", formatKg(stats.today), "total CO2e")}
      ${metricCard("This week", formatKg(stats.week), "total CO2e")}
      ${metricCard("This month", formatKg(stats.month), `${formatKg(stats.averageDaily)} avg/day`)}
      ${metricCard("Last month", formatKg(stats.lastMonth), "comparison period")}
      ${metricCard("This year", formatKg(stats.year), "logged so far")}
      ${metricCard("Biggest contributor", title(stats.biggestCategory), "last 30 days")}
      ${metricCard("Projected emissions", formatTons(stats.annualPace), "annual pace")}
      ${metricCard("Target comparison", stats.annualPace <= state.user.target ? "Below target" : "Above target", formatKg(Math.abs(stats.annualPace - state.user.target)), stats.annualPace <= state.user.target ? "positive" : "warning")}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card">
        <span class="eyebrow">AI-powered insights</span>
        <h2>Personal signals</h2>
        ${aiInsights(state).map((insight) => `<div class="insight-line">${insight}</div>`).join("")}
      </div>
      <div class="card">
        <span class="eyebrow">Category breakdown</span>
        <h2>Last 30 days</h2>
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
