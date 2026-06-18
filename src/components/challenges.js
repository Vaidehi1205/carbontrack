import { challenges } from "../data/challenges.js";
import { activitiesInRange, totalCo2 } from "../utils/calculations.js";
import { escapeHtml, formatKg, title } from "../utils/helpers.js";
import { featureDescription, progressBar } from "./ui.js";

export function challengesView(state) {
  return `
    ${featureDescription("Join focused sustainability challenges and track shared progress.")}
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Community</span>
        <h2>Active challenges</h2>
        ${challenges.map((challenge) => challengeRow(state, challenge)).join("")}
      </div>
      <div class="card hero-visual">
        <span class="eyebrow">Shared progress</span>
        <h2>Anonymous proof, not pressure</h2>
        <p>Join challenges, earn points, and track progress without public personal comparisons.</p>
      </div>
    </div>
  `;
}

export function getChallengeProgress(state, challenge) {
  const loggedTotal = totalCo2(activitiesInRange(state.activities, challenge.days).filter((activity) => activity.category === challenge.category));
  return {
    loggedTotal,
    percent: Math.min(100, Math.round((loggedTotal / challenge.target) * 100))
  };
}

function challengeRow(state, challenge) {
  const joined = state.joinedChallenges.includes(challenge.id);
  const completed = state.completedChallenges.includes(challenge.id);
  const { loggedTotal, percent } = getChallengeProgress(state, challenge);
  const progress = completed ? 100 : percent;
  const canComplete = joined && !completed && progress >= 100;
  return `
    <div class="challenge-row">
      <div class="row" style="justify-content:space-between"><strong>${escapeHtml(challenge.title)}</strong><span class="pill">${challenge.members + (joined ? 1 : 0)} joined</span></div>
      <div class="challenge-meta"><span>${title(challenge.category)}</span><span>${challenge.days} days</span><span>${formatKg(loggedTotal)} / ${formatKg(challenge.target)}</span></div>
      ${progressBar(progress, completed ? "var(--sage)" : "#2d9caa", challenge.title)}
      <div class="row"><button class="primary-button" data-join="${escapeHtml(challenge.id)}" ${joined ? "disabled" : ""}>${joined ? "Joined" : "Join"}</button><button class="ghost-button" data-complete="${escapeHtml(challenge.id)}" ${!canComplete ? "disabled" : ""}>${completed ? "Completed" : "Complete"}</button></div>
    </div>
  `;
}
