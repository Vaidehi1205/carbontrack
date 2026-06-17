import { SCORE_VALUES } from "../config/constants.js";
import { clampScore, gradeForScore } from "../utils/calculateScore.js";

/**
 * Calculate sustainability and carbon scores for the current activity set.
 * @param {object} user User document.
 * @param {Array<object>} activities Activity documents.
 * @returns {object}
 */
export function calculateScores(user, activities) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - SCORE_VALUES.MONTH_DAYS * 86400000);
  const recent = activities.filter((activity) => new Date(activity.date) >= monthAgo);
  const totalEmissions = recent.reduce((sum, activity) => sum + activity.carbonEmission, 0);
  const annualPace = Math.round((totalEmissions / SCORE_VALUES.MONTH_DAYS) * SCORE_VALUES.YEAR_DAYS);
  const targetRatio = user.annualTarget ? annualPace / user.annualTarget : 1;
  const carbonScore = clampScore(SCORE_VALUES.MAX_SCORE - targetRatio * SCORE_VALUES.TARGET_WEIGHT);
  const categories = new Set(recent.map((activity) => activity.category));
  const loggingBonus = Math.min(SCORE_VALUES.LOGGING_BONUS_CAP, recent.length);
  const diversityBonus = categories.size * SCORE_VALUES.DIVERSITY_BONUS;
  const renewableBonus = Math.round((user.renewable || 0) / 10);
  const sustainabilityScore = clampScore(
    carbonScore + loggingBonus + diversityBonus + renewableBonus - SCORE_VALUES.SUSTAINABILITY_OFFSET
  );

  return {
    carbonScore,
    sustainabilityScore,
    score: sustainabilityScore,
    grade: gradeForScore(sustainabilityScore),
    annualPace,
    weeklyTotal: recent
      .filter((activity) => new Date(activity.date) >= new Date(now.getTime() - SCORE_VALUES.WEEK_DAYS * 86400000))
      .reduce((sum, activity) => sum + activity.carbonEmission, 0),
    monthlyTotal: totalEmissions,
    monthlyEmission: Math.round(totalEmissions * 100) / 100
  };
}
