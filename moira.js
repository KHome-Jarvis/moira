// Moira — AI GM Companion Module for Foundry VTT
// Backend: Hermes API Server at http://192.168.1.13:8642/v1/chat/completions

const API_ENDPOINT = "http://192.168.1.13:8642/v1/chat/completions";
const API_KEY = "local-hermes-c5b35435549f46c003b198fca4bfd643";
const MODEL = "minimax-m2.7:cloud";

class MoiraChat {
  constructor() {
    this.container = null;
    this.body = null;
    this.input = null;
    this.isOpen = true;
    this.messageHistory = [
      { role: "system", content: "You are Moira, an AI GM companion in a fantasy TTRPG setting. Be helpful, evocative, and brief." }
    ];
  }

  async init() {
    console.log("Moira v0.0.1 initializing...");

    // Load template
    const template = await renderTemplate("modules/moira/templates/moira-chat.html");
    document.body.insertAdjacentHTML("beforeend", template);

    this.container = document.getElementById("moira-chat-container");
    this.body = document.getElementById("moira-body");
    this.input = document.getElementById("moira-input");

    // Toggle header click
    document.querySelector("[data-moira='toggle']").addEventListener("click", () => this.toggle());

    // Send button
    document.querySelector("[data-moira='send']").addEventListener("click", () => this.sendMessage());

    // Enter key in input
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    // Clear button
    document.querySelector("[data-moira='clear']").addEventListener("click", () => this.clearChat());

    console.log("Moira initialized successfully.");
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.body.style.display = this.isOpen ? "flex" : "none";
    document.getElementById("moira-toggle-icon").textContent = this.isOpen ? "▼" : "▲";
  }

  addMessage(role, content) {
    const div = document.createElement("div");
    div.className = `moira-msg ${role}`;
    div.textContent = content;
    this.body.appendChild(div);
    this.body.scrollTop = this.body.scrollHeight;
  }

  showTyping() {
    const div = document.createElement("div");
    div.className = "moira-typing";
    div.id = "moira-typing";
    div.textContent = "Moira is thinking...";
    this.body.appendChild(div);
    this.body.scrollTop = this.body.scrollHeight;
  }

  hideTyping() {
    const el = document.getElementById("moira-typing");
    if (el) el.remove();
  }

  clearChat() {
    this.body.innerHTML = '<div class="moira-msg moira">Chat cleared. What would you like to do?</div>';
    this.messageHistory = [
      { role: "system", content: "You are Moira, an AI GM companion in a fantasy TTRPG setting. Be helpful, evocative, and brief." }
    ];
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;
    this.input.value = "";

    this.addMessage("user", text);
    this.messageHistory.push({ role: "user", content: text });

    this.showTyping();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: this.messageHistory,
          max_tokens: 500,
          stream: false
        })
      });

      this.hideTyping();

      if (!response.ok) {
        const err = await response.text();
        this.addMessage("error", `Hermes error ${response.status}: ${err}`);
        return;
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      this.addMessage("moira", reply);
      this.messageHistory.push({ role: "assistant", content: reply });
    } catch (err) {
      this.hideTyping();
      this.addMessage("error", `Connection failed: ${err.message}`);
    }
  }
}

const moira = new MoiraChat();
Hooks.once("init", () => moira.init());