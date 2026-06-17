import Activity from "../models/Activity.js";
import { factors } from "../config/emissionFactors.js";
import { calculateEmission } from "../utils/calculateEmission.js";
import { invalidateByPrefix } from "./cacheService.js";

/**
 * Map a MongoDB activity document to the frontend activity shape.
 * @param {object} doc Activity document.
 * @returns {object}
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
 * List activities for a user.
 * @param {string} userId Firebase user id.
 * @returns {Promise<Array>}
 */
export function getUserActivities(userId) {
  return Activity.find({ userId }).sort({ date: -1, createdAt: -1 });
}

/**
 * Create a user activity.
 * @param {string} userId Firebase user id.
 * @param {object} input Activity payload.
 * @returns {Promise<object>}
 */
export async function createUserActivity(userId, input) {
  const { category, type, date, value, notes } = input;
  const factorData = factors[category][type];
  const activity = await Activity.create({
    userId,
    category,
    activityType: type,
    value,
    emissionFactor: factorData.factor,
    carbonEmission: calculateEmission(category, type, value),
    date: date.slice(0, 10),
    unit: factorData.unit,
    notes: notes || ""
  });
  invalidateByPrefix(`dashboard:${userId}`);
  return activity;
}

/**
 * Update a user activity.
 * @param {string} userId Firebase user id.
 * @param {string} activityId Activity id.
 * @param {object} input Activity payload.
 * @returns {Promise<object|null>}
 */
export async function updateUserActivity(userId, activityId, input) {
  const { category, type, date, value, notes } = input;
  const factorData = factors[category][type];
  const activity = await Activity.findOneAndUpdate(
    { _id: activityId, userId },
    {
      category,
      activityType: type,
      value,
      emissionFactor: factorData.factor,
      carbonEmission: calculateEmission(category, type, value),
      date: date.slice(0, 10),
      unit: factorData.unit,
      notes: notes || ""
    },
    { new: true }
  );
  invalidateByPrefix(`dashboard:${userId}`);
  return activity;
}

/**
 * Delete a user activity.
 * @param {string} userId Firebase user id.
 * @param {string} activityId Activity id.
 * @returns {Promise<object|null>}
 */
export async function deleteUserActivity(userId, activityId) {
  const activity = await Activity.findOneAndDelete({ _id: activityId, userId });
  invalidateByPrefix(`dashboard:${userId}`);
  return activity;
}

/**
 * Bulk sync migration activities for a user.
 * @param {string} userId Firebase user id.
 * @param {Array<object>} activities Client activity payloads.
 * @returns {Promise<number>}
 */
export async function syncUserActivities(userId, activities) {
  const existing = await Activity.countDocuments({ userId });
  if (existing > 0) return 0;

  const docs = activities.slice(0, 500).map((activity) => {
    const factorData = factors[activity.category]?.[activity.type] || { factor: 0, unit: activity.unit || "" };
    return {
      userId,
      category: activity.category,
      activityType: activity.type,
      value: activity.value,
      emissionFactor: factorData.factor,
      carbonEmission: activity.co2 || calculateEmission(activity.category, activity.type, activity.value),
      date: activity.date,
      unit: activity.unit || factorData.unit,
      notes: activity.notes || ""
    };
  });

  if (docs.length) await Activity.insertMany(docs);
  invalidateByPrefix(`dashboard:${userId}`);
  return docs.length;
}

export { factors };
