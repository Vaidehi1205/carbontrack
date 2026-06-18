import { factors } from "../data/factors.js";
import { categoryBreakdown, currentStats, dailyTotals, rankRecommendations } from "../utils/calculations.js";
import { escapeHtml, formatKg, formatTons, title } from "../utils/helpers.js";
import { renderLineChart } from "../charts/lineChart.js";
import { renderPieChart } from "../charts/pieChart.js";
import { featureDescription, metricCard, progressBar, recommendationCard } from "./ui.js";

export function dashboardView(state) {
  const stats = currentStats(state);
  const topRec = rankRecommendations(state)[0];
  const ai = state.aiInsights || {};
  const carbonScore = ai.carbonScore ?? "—";
  const sustainabilityScore = ai.sustainabilityScore ?? "—";

  return `
    ${featureDescription("View insights and monitor your sustainability progress.")}
    <div class="grid metrics dashboard-metrics">
      ${metricCard("Today", formatKg(stats.today), "CO2e logged")}
      ${metricCard("This week", formatKg(stats.week), `${stats.weekDelta <= 0 ? Math.abs(stats.weekDelta) + "% lower" : stats.weekDelta + "% higher"} than previous week`, stats.weekDelta <= 0 ? "positive" : "warning")}
      ${metricCard("Carbon Score", `${carbonScore}/100`, "AI-calculated footprint score", carbonScore >= 60 ? "positive" : "warning")}
      ${metricCard("Sustainability Score", `${sustainabilityScore}/100`, "Overall eco performance", sustainabilityScore >= 60 ? "positive" : "")}
      ${metricCard("This month", formatKg(stats.month), `${formatKg(stats.averageDaily)} daily avg`)}
      ${metricCard("Annual pace", formatTons(stats.annualPace), `${stats.targetProgress}% of annual target`, stats.annualPace <= state.user.target ? "positive" : "warning")}
      ${metricCard("Biggest contributor", title(stats.biggestCategory), "last 30 days")}
      ${metricCard("Current trend", stats.trend, `${stats.weekDelta}% vs previous week`, stats.trend === "Improving" ? "positive" : "")}
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Trend</span><h2>Weekly carbon trend</h2></div><span class="pill">${formatKg(stats.week)} this week</span></div>
        <canvas id="weeklyTrendChart"></canvas>
      </div>
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Distribution</span><h2>Category share</h2></div><span class="pill">${title(stats.biggestCategory)} leads</span></div>
        <canvas id="categoryPieChart"></canvas>
      </div>
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card chart-wrap">
        <div class="card-head"><div><span class="eyebrow">Trend</span><h2>Monthly carbon trend</h2></div><span class="pill">${stats.trend}</span></div>
        <canvas id="monthlyDashboardChart"></canvas>
      </div>
      <div class="card">
        <span class="eyebrow">Goal progress</span>
        <h2>Carbon reduction goal</h2>
        ${progressBar(stats.targetProgress, stats.annualPace <= state.user.target ? "var(--sage)" : "var(--amber)", "Annual target progress")}
        <p class="muted">${formatKg(stats.annualPace)} projected against a ${formatKg(state.user.target)} annual target.</p>
        <div class="grid three-col">
          ${quickButton("transportation", "car_petrol", "Commute")}
          ${quickButton("food", "plant_meal", "Meal")}
          ${quickButton("energy", "electricity", "Energy")}
        </div>
      </div>
    </div>
    <div class="grid two-col" style="margin-top:16px">
      <div class="card">
        <span class="eyebrow">AI Recommendation</span>
        <h2>Personalized tip</h2>
        <div class="insight-line">${escapeHtml(ai.recommendation || topRec?.title || "Log more activities to unlock AI recommendations.")}</div>
        ${ai.predictedSavings ? `<p class="muted">Potential savings: ${ai.predictedSavings}</p>` : ""}
      </div>
      <div class="card">
        <span class="eyebrow">Next best action</span>
        ${recommendationCard(topRec, true)}
      </div>
    </div>
  `;
}

export function renderDashboardCharts(state) {
  const week = dailyTotals(state.activities, 7);
  renderLineChart("weeklyTrendChart", week.map((point) => point.date.slice(5)), week.map((point) => point.value), "Weekly emissions");

  const month = dailyTotals(state.activities, 30);
  renderLineChart("monthlyDashboardChart", month.map((point) => point.date.slice(5)), month.map((point) => point.value), "Monthly emissions");

  const breakdown = categoryBreakdown(state.activities.filter((activity) => new Date(activity.date) >= new Date(Date.now() - 30 * 86400000)));
  const labels = Object.keys(factors).map(title);
  renderPieChart("categoryPieChart", labels, Object.keys(factors).map((category) => breakdown[category] || 0));
}

function quickButton(category, type, label) {
  const item = factors[category][type];
  return `<button class="quick-button" data-quick="${category}:${type}"><span>${item.icon}</span><strong>${label}</strong><small>${item.label}</small></button>`;
}
