import Activity from "../models/Activity.js";
import { factors } from "../data/factors.js";

/**
 * Map a MongoDB activity document to the frontend shape.
 */
export function toClientActivity(doc) {
  return {
    id: doc._id.toString(),
    category: doc.category,
    type: doc.activityType,
    date: doc.date,
    value: doc.value,
    unit: doc.unit,
    co2: doc.carbonEmission,
    notes: doc.notes || ""
  };
}

/**
 * Build emission analytics context for AI prompts.
 */
export function buildEmissionContext(user, activities) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const recent = activities.filter((a) => new Date(a.date) >= thirtyDaysAgo);
  const categoryTotals = recent.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + activity.carbonEmission;
    return acc;
  }, {});

  const total = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0) || 1;
  const breakdown = {};
  for (const [category, amount] of Object.entries(categoryTotals)) {
    breakdown[category] = Math.round((amount / total) * 100);
  }

  // Weekly trend
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const thisWeek = recent.filter((a) => new Date(a.date) >= weekAgo);
  const lastWeek = recent.filter((a) => {
    const d = new Date(a.date);
    return d >= twoWeeksAgo && d < weekAgo;
  });
  const thisWeekTotal = thisWeek.reduce((s, a) => s + a.carbonEmission, 0);
  const lastWeekTotal = lastWeek.reduce((s, a) => s + a.carbonEmission, 0);
  const trend = lastWeekTotal
    ? thisWeekTotal > lastWeekTotal * 1.05
      ? "Increasing"
      : thisWeekTotal < lastWeekTotal * 0.95
        ? "Decreasing"
        : "Stable"
    : "Insufficient data";

  const topSources = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ${Math.round(amt * 100) / 100} kg`);

  return {
    userName: user.name,
    country: user.country,
    goal: user.goal || user.motivation,
    annualTarget: user.annualTarget,
    breakdown,
    trend,
    topSources,
    totalRecentKg: Math.round(total * 100) / 100,
    activityCount: recent.length
  };
}

/**
 * Calculate sustainability and carbon scores (0-100).
 */
export function calculateScores(user, activities) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const recent = activities.filter((a) => new Date(a.date) >= monthAgo);
  const totalEmissions = recent.reduce((s, a) => s + a.carbonEmission, 0);
  const annualPace = Math.round((totalEmissions / 30) * 365);

  const targetRatio = user.annualTarget ? annualPace / user.annualTarget : 1;
  const carbonScore = Math.max(0, Math.min(100, Math.round(100 - targetRatio * 50)));

  const categories = new Set(recent.map((a) => a.category));
  const loggingBonus = Math.min(20, recent.length);
  const diversityBonus = categories.size * 5;
  const renewableBonus = Math.round((user.renewable || 0) / 10);
  const sustainabilityScore = Math.min(100, carbonScore + loggingBonus + diversityBonus + renewableBonus - 20);

  return {
    carbonScore: Math.max(0, carbonScore),
    sustainabilityScore: Math.max(0, sustainabilityScore),
    annualPace,
    weeklyTotal: recent
      .filter((a) => new Date(a.date) >= new Date(now.getTime() - 7 * 86400000))
      .reduce((s, a) => s + a.carbonEmission, 0),
    monthlyTotal: totalEmissions
  };
}

/**
 * Get daily totals for chart data.
 */
export function dailyTotals(activities, days) {
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const value = activities
      .filter((a) => a.date === key)
      .reduce((s, a) => s + a.carbonEmission, 0);
    result.push({ date: key, value: Math.round(value * 100) / 100 });
  }
  return result;
}

export async function getUserActivities(userId) {
  return Activity.find({ userId }).sort({ date: -1, createdAt: -1 });
}

export { factors };
