import { factors } from "../config/emissionFactors.js";

/**
 * Calculate CO2e emissions for a logged activity.
 * @param {string} category Activity category.
 * @param {string} activityType Activity type inside the category.
 * @param {number} value Activity quantity.
 * @returns {number} Emissions in kg CO2e.
 */
export function calculateEmission(category, activityType, value) {
  const factorData = factors[category]?.[activityType];
  if (!factorData) {
    throw new Error(`Unknown activity type: ${category}/${activityType}`);
  }
  return Math.round(Number(value) * factorData.factor * 100) / 100;
}
