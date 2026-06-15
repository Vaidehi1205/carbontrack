export const navItems = [
  ["dashboard", "⌂", "Dashboard"],
  ["activities", "+", "Activity log"],
  ["insights", "◒", "Insights"],
  ["recommendations", "★", "Actions"],
  ["challenges", "◇", "Challenges"],
  ["profile", "◉", "Profile"]
];

export function renderNavbar(state) {
  return navItems
    .map(([id, icon, label]) => `<button class="${id === state.ui.activeView ? "active" : ""}" data-view="${id}"><span>${icon}</span>${label}</button>`)
    .join("");
}
