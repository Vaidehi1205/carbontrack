import { countryBenchmarks, factors } from "../data/factors.js";
import { recommendationActions } from "../data/recommendations.js";
import { daysAgoKey, daysBetween, round, todayKey } from "./helpers.js";

export function calculateActivityCo2(category, type, value) {
  return round(Number(value) * factors[category][type].factor);
}

export function activitiesInRange(activities, days) {
  return activities.filter((activity) => daysBetween(activity.date) < days);
}

export function totalCo2(activities) {
  return round(activities.reduce((sum, activity) => sum + activity.co2, 0));
}

export function categoryBreakdown(activities) {
  return activities.reduce((acc, activity) => {
    acc[activity.category] = round((acc[activity.category] || 0) + activity.co2);
    return acc;
  }, {});
}

export function typeFrequency(activities) {
  return activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {});
}

export function dailyTotals(activities, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = daysAgoKey(-(days - 1 - index));
    return {
      date,
      value: totalCo2(activities.filter((activity) => activity.date === date))
    };
  });
}

export function currentStats(state) {
  const today = state.activities.filter((activity) => activity.date === todayKey());
  const week = activitiesInRange(state.activities, 7);
  const previousWeek = state.activities.filter((activity) => daysBetween(activity.date) >= 7 && daysBetween(activity.date) < 14);
  const month = activitiesInRange(state.activities, 30);
  const lastMonth = state.activities.filter((activity) => daysBetween(activity.date) >= 30 && daysBetween(activity.date) < 60);
  const year = activitiesInRange(state.activities, 365);
  const annualPace = round((totalCo2(month) / 30) * 365);
  const weekTotal = totalCo2(week);
  const previousWeekTotal = totalCo2(previousWeek);
  const weekDelta = previousWeekTotal ? Math.round(((weekTotal - previousWeekTotal) / previousWeekTotal) * 100) : 0;
  const categoryTotals = categoryBreakdown(month);
  const biggestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "transportation";
  const series = dailyTotals(state.activities, 30);
  const daysWithData = series.filter((point) => point.value > 0);
  const bestDay = daysWithData.sort((a, b) => a.value - b.value)[0];
  const worstDay = [...series].sort((a, b) => b.value - a.value)[0];
  const firstHalf = totalCo2(month.filter((activity) => daysBetween(activity.date) >= 15));
  const secondHalf = totalCo2(month.filter((activity) => daysBetween(activity.date) < 15));
  const trend = secondHalf < firstHalf ? "Improving" : secondHalf > firstHalf ? "Rising" : "Stable";

  return {
    today: totalCo2(today),
    week: weekTotal,
    previousWeek: previousWeekTotal,
    weekDelta,
    month: totalCo2(month),
    lastMonth: totalCo2(lastMonth),
    year: totalCo2(year),
    annualPace,
    targetProgress: Math.min(100, Math.round((annualPace / state.user.target) * 100)),
    biggestCategory,
    bestDay,
    worstDay,
    trend,
    categoryTotals,
    averageDaily: round(totalCo2(month) / 30)
  };
}

export function calculateStreak(activities) {
  const dates = new Set(activities.map((activity) => activity.date));
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    if (!dates.has(daysAgoKey(-offset))) break;
    streak += 1;
  }
  return streak;
}

export function achievementsFor(state) {
  const plantMeals = state.activities.filter((activity) => activity.type === "plant_meal").length;
  const recycling = state.activities.filter((activity) => activity.type === "recycled").length;
  const stats = currentStats(state);
  const streak = calculateStreak(state.activities);
  return [
    { id: "beginner", name: "Green Beginner", detail: "First activity logged", unlocked: state.activities.length >= 1 },
    { id: "warrior", name: "Eco Warrior", detail: "100 activities logged", unlocked: state.activities.length >= 100 },
    { id: "recycling", name: "Recycling Master", detail: "50 recycling entries", unlocked: recycling >= 50 },
    { id: "plant", name: "Plant Hero", detail: "20 plant-based meals", unlocked: plantMeals >= 20 },
    { id: "champion", name: "Low Carbon Champion", detail: "Below target with a 30-day streak", unlocked: stats.annualPace <= state.user.target && streak >= 30 }
  ];
}

export function pointsFor(state) {
  return state.activities.length * 10 + state.started.length * 50 + state.completedChallenges.length * 100 + achievementsFor(state).filter((badge) => badge.unlocked).length * 150;
}

export function levelFor(points) {
  if (points >= 1400) return "Level 4: Carbon Master";
  if (points >= 800) return "Level 3: Eco Warrior";
  if (points >= 300) return "Level 2: Eco Learner";
  return "Level 1: Beginner";
}

export function rankRecommendations(state) {
  const month = activitiesInRange(state.activities, 90);
  const breakdown = categoryBreakdown(month);
  const frequencies = typeFrequency(month);
  const maxCategory = Math.max(...Object.values(breakdown), 1);

  return recommendationActions
    .filter((action) => !state.dismissed.includes(action.id))
    .map((action) => {
      const categoryContribution = (breakdown[action.category] || 0) / maxCategory;
      const frequencyBoost = action.triggerTypes.reduce((sum, type) => sum + (frequencies[type] || 0), 0) / Math.max(month.length, 1);
      const preferenceBoost = state.user.motivation === "cost" && action.savings > 0 ? 0.12 : 0;
      const impact = Math.min(action.impact / 700, 1);
      const feasibility = 1 - (action.difficulty - 1) * 0.18;
      const score = Math.min(0.99, 0.22 + categoryContribution * 0.3 + frequencyBoost * 0.18 + impact * 0.22 + feasibility * 0.08 + preferenceBoost);
      return { ...action, score: round(score) };
    })
    .sort((a, b) => b.score - a.score);
}

export function benchmarkMessage(state) {
  const benchmark = countryBenchmarks[state.user.country] || countryBenchmarks.US;
  const pace = currentStats(state).annualPace;
  const direction = pace <= benchmark.annualKg ? "below" : "above";
  return `Your emissions are ${direction} the average for ${benchmark.label}.`;
}

export function aiInsights(state) {
  const stats = currentStats(state);
  const total = Math.max(Object.values(stats.categoryTotals).reduce((sum, value) => sum + value, 0), 1);
  const categoryShare = Math.round(((stats.categoryTotals[stats.biggestCategory] || 0) / total) * 100);
  const topRec = rankRecommendations(state)[0];
  return [
    `${stats.biggestCategory.replace("_", " ")} contributes ${categoryShare}% of your recent emissions.`,
    topRec ? `${topRec.title} could reduce annual emissions by about ${topRec.impact} kg.` : "Your activity mix is balanced; keep logging to unlock sharper suggestions.",
    benchmarkMessage(state)
  ];
}
