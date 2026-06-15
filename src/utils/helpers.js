export const title = (text) => text.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const round = (value) => Math.round(value * 100) / 100;
export const formatKg = (value) => `${round(value).toLocaleString()} kg`;
export const formatTons = (value) => `${round(value / 1000).toLocaleString()} t`;
export const todayKey = () => new Date().toISOString().slice(0, 10);

export function daysAgoKey(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() + daysAgo);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(dateText) {
  return Math.floor((new Date(todayKey()) - new Date(dateText)) / 86400000);
}

export function createId() {
  return crypto.randomUUID();
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
