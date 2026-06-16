export const navItems = [
  ["dashboard", "⌂", "Dashboard"],
  ["activities", "+", "Activity log"],
  ["insights", "◒", "Insights"],
  ["coach", "💬", "Carbon Coach"],
  ["recommendations", "★", "Actions"],
  ["challenges", "◇", "Challenges"],
  ["profile", "◉", "Profile"]
];

export function renderNavbar(state) {
  const items = navItems
    .map(([id, icon, label]) => `<button class="${id === state.ui.activeView ? "active" : ""}" data-view="${id}"><span>${icon}</span>${label}</button>`)
    .join("");

  return `${items}<button class="logout-btn" id="logoutBtn" type="button"><span>⏻</span>Log out</button>`;
}
