import User from "../models/User.js";
import Activity from "../models/Activity.js";
import Leaderboard from "../models/Leaderboard.js";
import { calculateScores } from "./scoreService.js";

/**
 * Rebuild leaderboard entries from users and activity totals.
 * @returns {Promise<Array<object>>}
 */
export async function rebuildLeaderboard() {
  const [users, totals] = await Promise.all([
    User.find({}).lean(),
    Activity.aggregate([
      { $group: { _id: "$userId", totalEmission: { $sum: "$carbonEmission" } } }
    ])
  ]);
  const totalByUid = new Map(totals.map((entry) => [entry._id, entry.totalEmission]));
  const activityGroups = await Activity.aggregate([
    { $sort: { date: -1, createdAt: -1 } },
    { $group: { _id: "$userId", activities: { $push: "$$ROOT" } } }
  ]);
  const activitiesByUid = new Map(activityGroups.map((entry) => [entry._id, entry.activities]));

  const rows = users
    .map((user) => {
      const scores = calculateScores(user, activitiesByUid.get(user.firebaseUID) || []);
      return {
        uid: user.firebaseUID,
        name: user.name,
        score: scores.sustainabilityScore,
        totalEmission: Math.round((totalByUid.get(user.firebaseUID) || 0) * 100) / 100
      };
    })
    .sort((a, b) => b.score - a.score || a.totalEmission - b.totalEmission)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  await Leaderboard.deleteMany({});
  if (rows.length) await Leaderboard.insertMany(rows);
  return rows;
}

/**
 * Read leaderboard entries, rebuilding when empty.
 * @param {number} limit Max number of rows.
 * @returns {Promise<Array<object>>}
 */
export async function getLeaderboard(limit = 20) {
  let rows = await Leaderboard.find({}).sort({ rank: 1 }).limit(limit).lean();
  if (!rows.length) {
    rows = (await rebuildLeaderboard()).slice(0, limit);
  }
  return rows;
}
