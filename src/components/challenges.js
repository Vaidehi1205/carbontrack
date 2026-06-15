import { challenges } from "../data/challenges.js";
import { formatKg, title } from "../utils/helpers.js";
import { progressBar } from "./ui.js";

export function challengesView(state) {
  return `
    <div class="grid two-col">
      <div class="card">
        <span class="eyebrow">Community</span>
        <h2>Active challenges</h2>
        ${challenges.map((challenge, index) => challengeRow(state, challenge, index)).join("")}
      </div>
      <div class="card hero-visual">
        <span class="eyebrow">Shared progress</span>
        <h2>Anonymous proof, not pressure</h2>
        <p>Join challenges, earn points, and track progress without public personal comparisons.</p>
      </div>
    </div>
  `;
}

function challengeRow(state, challenge, index) {
  const joined = state.joinedChallenges.includes(challenge.id);
  const completed = state.completedChallenges.includes(challenge.id);
  const progress = completed ? 100 : joined ? 38 + index * 12 : 0;
  return `
    <div class="challenge-row">
      <div class="row" style="justify-content:space-between"><strong>${challenge.title}</strong><span class="pill">${challenge.members + (joined ? 1 : 0)} joined</span></div>
      <div class="challenge-meta"><span>${title(challenge.category)}</span><span>${challenge.days} days</span><span>${formatKg(challenge.target)} target</span></div>
      ${progressBar(progress, completed ? "var(--sage)" : "#2d9caa", challenge.title)}
      <div class="row"><button class="primary-button" data-join="${challenge.id}" ${joined ? "disabled" : ""}>${joined ? "Joined" : "Join"}</button><button class="ghost-button" data-complete="${challenge.id}" ${!joined || completed ? "disabled" : ""}>${completed ? "Completed" : "Complete"}</button></div>
    </div>
  `;
}
