import { escapeHtml } from "../utils/helpers.js";
import { featureDescription } from "./ui.js";

/**
 * Carbon Coach chatbot view — AI-powered sustainability advisor.
 */
export function coachView(state) {
  const messages = state.chat?.messages || [];
  const suggestions = state.chat?.suggestions || [];
  const searching = state.chat?.search || "";

  return `
    ${featureDescription("Ask Carbon Coach for personalized guidance based on your logged activities.")}
    <div class="grid two-col coach-layout">
      <div class="card coach-panel">
        <div class="card-head">
          <div>
            <span class="eyebrow">AI Advisor</span>
            <h2>Carbon Coach</h2>
          </div>
          <span class="pill">Powered by Gemini</span>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${messages.length ? messages.map(chatBubble).join("") : `
            <div class="chat-welcome">
              <strong>Hi ${escapeHtml(state.user.name)}!</strong>
              <p class="muted">I'm your Carbon Coach. Ask me anything about reducing your footprint based on your logged activities.</p>
            </div>
          `}
          <div class="typing-indicator ${state.chat?.typing ? "active" : ""}" id="typingIndicator">
            <span></span><span></span><span></span>
          </div>
        </div>

        ${suggestions.length ? `
          <div class="chat-suggestions" id="chatSuggestions">
            ${suggestions.map((s) => `<button class="chip suggestion-chip" data-suggest="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
          </div>
        ` : ""}

        <form id="chatForm" class="chat-input-row">
          <input id="chatInput" type="text" placeholder="Ask about your carbon footprint..." maxlength="2000" required />
          <button class="primary-button" type="submit">Send</button>
        </form>
      </div>

      <div class="card coach-history">
        <div class="card-head">
          <div>
            <span class="eyebrow">History</span>
            <h2>Previous chats</h2>
          </div>
        </div>
        <label class="history-search">
          Search
          <input id="chatSearch" type="search" value="${escapeHtml(searching)}" placeholder="Search conversations..." />
        </label>
        <div class="history-list" id="chatHistoryList">
          ${renderHistoryList(state.chat?.history || [])}
        </div>
      </div>
    </div>
  `;
}

function chatBubble(msg) {
  const isUser = msg.role === "user";
  return `
    <div class="chat-bubble ${isUser ? "user" : "coach"}">
      <span class="bubble-label">${isUser ? "You" : "Carbon Coach"}</span>
      <p>${escapeHtml(msg.text)}</p>
      ${msg.timestamp ? `<small class="muted">${new Date(msg.timestamp).toLocaleString()}</small>` : ""}
    </div>
  `;
}

function renderHistoryList(history) {
  if (!history.length) {
    return `<div class="empty">No chat history yet. Start a conversation!</div>`;
  }

  return history.map((item) => `
    <div class="history-item" data-chat-id="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.question.slice(0, 60))}${item.question.length > 60 ? "…" : ""}</strong>
      <span class="muted">${new Date(item.timestamp).toLocaleDateString()}</span>
      <div class="history-actions">
        <button class="ghost-button" data-load-chat="${escapeHtml(item.id)}">View</button>
        <button class="danger-button" data-delete-chat="${escapeHtml(item.id)}">Delete</button>
      </div>
    </div>
  `).join("");
}

export function scrollChatToBottom() {
  const el = document.getElementById("chatMessages");
  if (el) el.scrollTop = el.scrollHeight;
}
