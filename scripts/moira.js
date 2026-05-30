const API_KEY = "";

// If Hermes requires authentication, set your Bearer token here.
// The token will be stored in Foundry world settings (GM-only visible).

// API Base URL — update if Hermes Gateway is hosted elsewhere
const API_BASE_URL = "http://192.168.1.26:8642/v1/chat/completions";

// Module information
const MOIRA_MODULE_ID = "moira";
const MOIRA_MODULE_NAME = "Moira";

class Moira extends Application {
  constructor() {
    super({ template: "modules/moira/templates/moira-chat.html" });
    this.conversationHistory = [];
    this.isLoading = false;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "moira-chat",
      title: "Moira",
      width: 500,
      height: 600,
      resizable: true
    });
  }

  async activateChatEditor() {
    Hooks.emit("moira:open");
  }

  async #sendMessage(userMessage) {
    if (!API_KEY) {
      ui.notifications.error("Moira API key not configured. Open settings to set your token.");
      return;
    }
    this.isLoading = true;
    this.render();

    try {
      const messages = [
        { role: "system", content: "You are Moira, an omniscient AI GM companion. Be concise, evocative, and helpful." },
        ...this.conversationHistory,
        { role: "user", content: userMessage }
      ];

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ model: "moira", messages, max_tokens: 1000, stream: false })
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      this.conversationHistory.push({ role: "user", content: userMessage });
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      this.render();
    } catch (error) {
      console.error("Moira error:", error);
      ui.notifications.error("Failed to get response from Moira.");
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  getData(options) {
    return {
      messages: this.conversationHistory,
      isLoading: this.isLoading
    };
  }

  render(force, options) {
    return super.render(force, options);
  }
}

const moira = new Moira();

Hooks.on("init", () => {
  console.log("Moira module initializing...");

  // Register module settings
  game.settings.register("moira", "apiKey", {
    name: "Hermes API Key",
    hint: "Your Bearer token for the Hermes Gateway",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  // Register the API key with the window so template can access it
  window.moiraApiKey = () => game.settings.get("moira", "apiKey") || API_KEY;
  window.moiraApp = moira;
});

Hooks.on("ready", () => {
  console.log("Moira module ready.");
  ui.moira = moira;
});

Hooks.on("renderChatMessage", (message, html) => {
  if (message.getFlag("moira", "isMoiraMessage")) {
    html.addClass("moira-message");
  }
});

console.log("Moira module loaded.");
