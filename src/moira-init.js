/**
 * Moira - AI Game Master for Foundry VTT
 * Main module entry point
 */
'use strict';

// ============================================================
// MOIRA MODULE
// ============================================================
const Moira = {
  version: '1.0.0',
  MODULE_ID: 'moira',
  API: null,
  apps: {},
  initialized: false
};

// ============================================================
// SYSTEM DEFINITIONS
// ============================================================
const MOIRA_SYSTEMS = {
  'dnd5e': { name: 'D&D 5E', prompt: 'You are Moira, an AI Game Master for Dungeons & Dragons 5th Edition. Help create adventures, NPCs, encounters, loot, and descriptions. Use 5E mechanics when relevant.' },
  'pf2e': { name: 'Pathfinder 2E', prompt: 'You are Moira, an AI Game Master for Pathfinder 2nd Edition. Help create adventures, NPCs, encounters, and descriptions using Pathfinder 2E mechanics.' },
  'sf2e': { name: 'Starfinder 2E', prompt: 'You are Moira, an AI Game Master for Starfinder 2nd Edition. Help create space adventures, NPCs, starship encounters using SF2E mechanics.' },
  'coterie': { name: 'Chronicles of Darkness', prompt: 'You are Moira, an AI Game Master for Chronicles of Darkness. Help create dark, gritty stories with mortal characters facing supernatural threats.' },
  'wfrp4e': { name: 'Warhammer Fantasy 4E', prompt: 'You are Moira, an AI Game Master for Warhammer Fantasy Roleplay 4th Edition. Help create dark fantasy adventures in the Old World.' },
  'coc7': { name: 'Call of Cthulhu 7E', prompt: 'You are Moira, an AI Game Master for Call of Cthulhu 7th Edition. Help create horror scenarios with investigation, sanity mechanics, and cosmic dread.' },
  'swade': { name: 'SWADE (SWN)', prompt: 'You are Moira, an AI Game Master for Savage Worlds Adventure Edition. Help create fast-paced adventure with the SWADE rules.' },
  'ose': { name: 'Old School Essentials', prompt: 'You are Moira, an AI Game Master for Old School Essentials. Help create classic dungeon crawls with old-school OSR mechanics.' },
  'zone': { name: 'The Zone', prompt: 'You are Moira, an AI Game Master for The Zone (Stalker). Help create survival horror adventures in the exclusion zone.' },
  'bladerunner': { name: 'Blade Runner', prompt: 'You are Moira, an AI Game Master for the Blade Runner RPG. Help create cyberpunk noir investigations in Los Angeles 2037.' },
  'default': { name: 'Generic RPG', prompt: 'You are Moira, an AI Game Master for tabletop RPGs. Help create adventures, NPCs, descriptions, and game content. Be creative and evocative.' }
};

// ============================================================
// SETTINGS
// ============================================================
class MoiraSettings {
  static register() {
    // Hermes API Key
    game.settings.register('moira', 'hermesApiKey', {
      name: 'Hermes API Key',
      hint: 'Your Hermes Gateway API key for authentication',
      scope: 'world',
      config: true,
      type: String,
      default: ''
    });

    // Hermes Endpoint
    game.settings.register('moira', 'hermesEndpoint', {
      name: 'Hermes Endpoint',
      hint: 'Hermes Gateway URL (e.g. http://192.168.1.26:8643)',
      scope: 'world',
      config: true,
      type: String,
      default: 'http://192.168.1.26:8643'
    });

    // Default Model
    game.settings.register('moira', 'defaultModel', {
      name: 'Default AI Model',
      hint: 'Model used for chat and generation',
      scope: 'world',
      config: true,
      type: String,
      default: 'minimax-m2.7:cloud',
      choices: {
        'minimax-m2.7:cloud': 'MiniMax (Fast, Cloud)',
        'qwen3-8b-64k:latest': 'Qwen 3 8B (Local)',
        'deepseek-r1:14b': 'DeepSeek R1 14B (Local)',
        'qwq:latest': 'QwenQwQ (Reasoning)'
      }
    });

    // Image Model
    game.settings.register('moira', 'imageModel', {
      name: 'Image Generation Model',
      hint: 'Model used for image generation',
      scope: 'world',
      config: true,
      type: String,
      default: 'FLUX',
      choices: {
        'FLUX': 'FLUX (High Quality)',
        'flux-schnell': 'FLUX Schnell (Fast)',
        'any': 'Any (Flexible)'
      }
    });

    // System Prompt
    game.settings.register('moira', 'systemPrompt', {
      name: 'System Prompt',
      hint: 'Custom instructions for Moira\'s behavior',
      scope: 'world',
      config: true,
      type: String,
      default: ''
    });

    // Active System
    game.settings.register('moira', 'activeSystem', {
      name: 'Game System',
      hint: 'The tabletop RPG system you are playing',
      scope: 'world',
      config: true,
      type: String,
      default: 'default',
      choices: Object.fromEntries(Object.entries(MOIRA_SYSTEMS).map(([k, v]) => [k, v.name]))
    });

    // Chat History
    game.settings.register('moira', 'chatHistory', {
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Message History
    game.settings.register('moira', 'messageHistory', {
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Show Sidebar Button
    game.settings.register('moira', 'showSidebarButton', {
      name: 'Show Sidebar Button',
      hint: 'Display Moira button in the sidebar',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Theme
    game.settings.register('moira', 'theme', {
      name: 'Theme',
      hint: 'Color theme for Moira',
      scope: 'world',
      config: true,
      type: String,
      default: 'default',
      choices: {
        'default': 'Default (Purple)',
        'blue': 'Ocean Blue',
        'green': 'Forest Green',
        'red': 'Crimson Red'
      }
    });

    // Auto-connect
    game.settings.register('moira', 'autoConnect', {
      name: 'Auto-connect on startup',
      hint: 'Test Hermes connection when Foundry starts',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Streaming enabled
    game.settings.register('moira', 'streamingEnabled', {
      name: 'Enable Streaming Responses',
      hint: 'Stream AI responses in real-time (slower but more responsive)',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Shown Onboarding (internal flag)
    game.settings.register('moira', 'shownOnboarding', {
      name: 'Onboarding Shown',
      hint: 'Internal flag for onboarding flow',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false
    });

  // Show sidebar button if enabled
  if (game.settings.get('moira', 'showSidebarButton')) {
    MoiraSidebar.inject();
  }

    // Image size
    game.settings.register('moira', 'imageSize', {
      name: 'Default Image Size',
      hint: 'Default size for generated images',
      scope: 'world',
      config: true,
      type: String,
      default: '1:1',
      choices: {
        '1:1': 'Square (1024x1024)',
        '16:9': 'Landscape (1344x756)',
        '9:16': 'Portrait (864x1344)',
        '1:2': 'Tall (768x1344)',
        '2:1': 'Wide (1344x768)'
      }
    });

    // Queue
    game.settings.register('moira', 'permanentQueue', {
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Gallery
    game.settings.register('moira', 'gallery', {
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Settings sheet
    game.settings.register('moira', 'settingsSheet', {
      scope: 'world',
      config: false,
      type: Object,
      default: null
    });
  }

  static getSystemPrompt() {
    const custom = game.settings.get('moira', 'systemPrompt');
    const systemId = game.settings.get('moira', 'activeSystem') || 'default';
    const systemDef = MOIRA_SYSTEMS[systemId] || MOIRA_SYSTEMS['default'];
    return custom || systemDef.prompt;
  }
}

// ============================================================
// API SERVICE
// ============================================================
class MoiraAPI {
  constructor() {
    this._cachedKey = null;
    this._connected = false;
  }

  async getKey() {
    if (this._cachedKey) return this._cachedKey;
    this._cachedKey = game.settings.get('moira', 'hermesApiKey') || '';
    return this._cachedKey;
  }

  getEndpoint() {
    return game.settings.get('moira', 'hermesEndpoint') || 'http://192.168.1.26:8643';
  }

  getModel() {
    return game.settings.get('moira', 'defaultModel') || 'minimax-m2.7:cloud';
  }

  getImageModel() {
    return game.settings.get('moira', 'imageModel') || 'FLUX';
  }

  async chat(messages, onChunk) {
    const key = await this.getKey();
    if (!key) throw new Error('No API key configured. Open Moira settings to enter your Hermes API key.');

    const endpoint = this.getEndpoint();
    const model = this.getModel();
    const streaming = game.settings.get('moira', 'streamingEnabled') && !!onChunk;

    // Build OpenAI-compatible payload
    const payload = {
      model: model,
      messages: messages,
      stream: streaming
    };

    const response = await fetch(endpoint + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errMsg = 'API error ' + response.status;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) errMsg = errJson.error.message;
        else if (errJson.message) errMsg = errJson.message;
      } catch (_) {}
      throw new Error(errMsg);
    }

    if (streaming && response.body) {
      return this._streamResponse(response.body, onChunk);
    } else {
      const json = await response.json();
      return json.choices?.[0]?.message?.content || '';
    }
  }

  async _streamResponse(body, onChunk) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'undefined' || trimmed === '[DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              onChunk(fullContent);
            }
          } catch (e) {
            // Skip malformed JSON in stream
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  async generateImage(prompt, onProgress) {
    const key = await this.getKey();
    if (!key) throw new Error('No API key configured.');

    const endpoint = this.getEndpoint();
    const model = this.getImageModel();
    const size = game.settings.get('moira', 'imageSize') || '1:1';
    const sizeMap = {
      '1:1': '1024x1024',
      '16:9': '1344x756',
      '9:16': '864x1344',
      '1:2': '768x1344',
      '2:1': '1344x768'
    };

    if (onProgress) onProgress('Generating image...');

    const response = await fetch(endpoint + '/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        size: sizeMap[size] || '1024x1024',
        n: 1
      })
    });

    if (!response.ok) {
      let errMsg = 'Image generation failed: ' + response.status;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const json = await response.json();
    const imageUrl = json.data?.[0]?.url || json.data?.[0]?.b64_json;
    if (!imageUrl) throw new Error('No image returned from generation service.');
    if (onProgress) onProgress('Image ready');
    return imageUrl;
  }

  async translate(text, targetLang = 'en') {
    const messages = [
      { role: 'system', content: 'You are a translator. Translate the following text to ' + targetLang + '. Only return the translation, nothing else.' },
      { role: 'user', content: text }
    ];
    return await this.chat(messages, null);
  }

  async enhance(text, mode = 'improve') {
    const enhanceMap = {
      improve: 'Improve the following text, making it more descriptive and evocative while keeping the same meaning:',
      shorten: 'Shorten the following text to its essential elements:',
      expand: 'Expand the following text with more detail and description:',
      dialogue: 'Convert the following narrative text into natural dialogue between characters:'
    };
    const messages = [
      { role: 'system', content: enhanceMap[mode] || enhanceMap.improve },
      { role: 'user', content: text }
    ];
    return await this.chat(messages, null);
  }

  async testConnection() {
    try {
      const result = await this.chat([
        { role: 'user', content: 'Reply with exactly: Pong' }
      ], null);
      this._connected = result.trim().toLowerCase().includes('pong');
      return this._connected;
    } catch (e) {
      console.error('Moira connection test failed:', e);
      this._connected = false;
      return false;
    }
  }

  isConnected() {
    return this._connected;
  }
}

Moira.API = new MoiraAPI();

// ============================================================
// QUEUE MANAGER
// ============================================================
class MoiraQueue {
  static add(type, label, payload) {
    const queue = game.settings.get('moira', 'permanentQueue') || [];
    const item = {
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      type: type,
      label: label,
      payload: payload,
      status: 'pending',
      progress: 0,
      createdAt: Date.now()
    };
    queue.push(item);
    game.settings.set('moira', 'permanentQueue', queue);
    Hooks.call('moira:queueUpdated', queue);
    return item;
  }

  static update(id, updates) {
    const queue = game.settings.get('moira', 'permanentQueue') || [];
    const idx = queue.findIndex(q => q.id === id);
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], ...updates };
      game.settings.set('moira', 'permanentQueue', queue);
      Hooks.call('moira:queueUpdated', queue);
    }
  }

  static remove(id) {
    let queue = game.settings.get('moira', 'permanentQueue') || [];
    queue = queue.filter(q => q.id !== id);
    game.settings.set('moira', 'permanentQueue', queue);
    Hooks.call('moira:queueUpdated', queue);
  }

  static clear() {
    game.settings.set('moira', 'permanentQueue', []);
    Hooks.call('moira:queueUpdated', []);
  }

  static getAll() {
    return game.settings.get('moira', 'permanentQueue') || [];
  }
}

// ============================================================
// GALLERY MANAGER
// ============================================================
class MoiraGallery {
  static add(imageUrl, prompt, metadata = {}) {
    const gallery = game.settings.get('moira', 'gallery') || [];
    const item = {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      url: imageUrl,
      prompt: prompt,
      metadata: metadata,
      createdAt: Date.now()
    };
    gallery.unshift(item);
    // Keep last 100 images
    if (gallery.length > 100) gallery.splice(100);
    game.settings.set('moira', 'gallery', gallery);
    Hooks.call('moira:galleryUpdated', gallery);
    return item;
  }

  static remove(id) {
    let gallery = game.settings.get('moira', 'gallery') || [];
    gallery = gallery.filter(g => g.id !== id);
    game.settings.set('moira', 'gallery', gallery);
    Hooks.call('moira:galleryUpdated', gallery);
  }

  static clear() {
    game.settings.set('moira', 'gallery', []);
    Hooks.call('moira:galleryUpdated', []);
  }

  static getAll() {
    return game.settings.get('moira', 'gallery') || [];
  }
}

// ============================================================
// CHAT APPLICATION
// ============================================================
class MoiraChatApp {
  constructor() {
    this.app = null;
    this.messages = [];
    this.streaming = false;
    this.currentRequest = null;
  }

  async open() {
    if (this.app) {
      this.app.bringToTop();
      return;
    }

    const renderedHtml = await renderTemplate('modules/moira/templates/chat/chat-window.html', {
      version: Moira.version
    });

    this.app = new Dialog({
      title: 'Moira - AI Game Master',
      content: renderedHtml,
      buttons: {
        settings: {
          icon: '<i class="fas fa-cog"></i>',
          label: 'Settings',
          callback: () => this.openSettings()
        },
        clearHistory: {
          icon: '<i class="fas fa-trash"></i>',
          label: 'Clear',
          callback: () => this.clearHistory()
        }
      },
      default: 'settings',
      render: (html) => this._render(html),
      close: () => {
        this.app = null;
        this.streaming = false;
        if (this.currentRequest) {
          this.currentRequest.cancelled = true;
        }
      }
    }, {
      id: 'moira-chat-dialog',
      minimizable: true,
      resizable: true,
      width: 720,
      height: 650,
      minWidth: 500,
      minHeight: 400,
      classes: ['moira-chat-dialog', 'moira-theme-' + (game.settings.get('moira', 'theme') || 'default')]
    });

    this.app.render(true);
  }

  _render(html) {
    this.container = html;
    this._setupListeners();
    this._loadHistory();
    this._updateStatus();
  }

  _setupListeners() {
    const input = this.container.find('[name="moira-prompt"]');
    const sendBtn = this.container.find('[data-action="send"]');
    const imgGenBtn = this.container.find('[data-action="generate-image"]');
    const enhanceBtn = this.container.find('[data-action="enhance"]');

    sendBtn.on('click', () => this._sendMessage());
    input.on('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });

    input.on('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    imgGenBtn.on('click', () => this._openImageGen());
    enhanceBtn.on('click', () => this._openEnhance());
  }

  _loadHistory() {
    const history = game.settings.get('moira', 'messageHistory') || [];
    const container = this.container.find('.moira-chat-messages');
    for (const msg of history.slice(-30)) {
      this._appendMessage(msg.role, msg.content, false, false);
    }
  }

  _updateStatus() {
    const statusEl = this.container.find('.moira-status');
    if (Moira.API.isConnected()) {
      statusEl.html('<span class="moira-status-dot moira-status-dot--connected"></span> Connected');
    } else {
      statusEl.html('<span class="moira-status-dot moira-status-dot--disconnected"></span> Not connected');
    }
  }

  _appendMessage(role, content, save = true, scroll = true) {
    const container = this.container.find('.moira-chat-messages');
    const icon = role === 'user' ? 'fa-user' : 'fa-robot';
    const name = role === 'user' ? game.user.name : 'Moira';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = 'moira-message moira-message--' + role;
    div.innerHTML = `
      <div class="moira-message__header">
        <i class="fas ${icon}"></i>
        <span class="moira-message__name">${name}</span>
        <span class="moira-message__time">${timestamp}</span>
      </div>
      <div class="moira-message__content">${this._formatContent(content)}</div>
      ${role === 'assistant' ? '<div class="moira-message__actions"><button class="moira-msg-btn" data-action="regenerate" title="Regenerate"><i class="fas fa-rotate"></i></button><button class="moira-msg-btn" data-action="copy" title="Copy"><i class="fas fa-copy"></i></button></div>' : ''}
    `;

    container.append(div);

    if (scroll) {
      container.scrollTop(container[0].scrollHeight);
    }

    // Action buttons
    div.querySelectorAll('.moira-msg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === 'copy') {
          navigator.clipboard.writeText(content);
          ui.notifications.info('Copied to clipboard');
        } else if (action === 'regenerate' && role === 'assistant') {
          // Find the previous user message and regenerate
          this._regenerateLast();
        }
      });
    });

    if (save) {
      this.messages.push({ role, content });
      this._saveHistory();
    }
  }

  _formatContent(content) {
    if (!content) return '';
    let formatted = String(content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown formatting
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`{3}([\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^(\d+)\.\s/gm, '<li>$1. ')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');

    return formatted;
  }

  _saveHistory() {
    const recent = this.messages.slice(-50);
    game.settings.set('moira', 'messageHistory', recent);
  }

  _showTyping() {
    const container = this.container.find('.moira-chat-messages');
    this.typingEl = document.createElement('div');
    this.typingEl.className = 'moira-message moira-message--assistant moira-typing';
    this.typingEl.innerHTML = '<div class="moira-message__header"><i class="fas fa-robot"></i><span class="moira-message__name">Moira</span></div><div class="moira-typing-indicator"><span></span><span></span><span></span></div>';
    container.appendChild(this.typingEl);
    container.scrollTop(container[0].scrollHeight);
    this.streaming = true;
  }

  _hideTyping() {
    if (this.typingEl && this.typingEl.parentNode) {
      this.typingEl.parentNode.removeChild(this.typingEl);
    }
    this.streaming = false;
  }

  _updateLastMessage(content) {
    const msgs = this.container.find('.moira-message--assistant');
    if (!msgs.length) return;
    const lastMsg = msgs[msgs.length - 1];
    const contentEl = lastMsg.querySelector('.moira-message__content');
    if (contentEl) {
      contentEl.innerHTML = this._formatContent(content);
    }
  }

  async _sendMessage(prompt = null) {
    if (this.streaming) return;

    const input = this.container.find('[name="moira-prompt"]');
    const text = prompt || input.val().trim();
    if (!text) return;

    input.val('');
    input.trigger('input');
    this._appendMessage('user', text);

    this._showTyping();

    this.currentRequest = { cancelled: false };
    const request = this.currentRequest;

    try {
      const systemPrompt = MoiraSettings.getSystemPrompt();
      const conversationMessages = this.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
        { role: 'user', content: text }
      ];

      let fullResponse = '';
      const streamingEnabled = game.settings.get('moira', 'streamingEnabled');

      if (streamingEnabled) {
        await Moira.API.chat(apiMessages, (chunk) => {
          if (request.cancelled) throw new Error('Cancelled');
          fullResponse = chunk;
          this._updateLastMessage(fullResponse);
        });
      } else {
        fullResponse = await Moira.API.chat(apiMessages, null);
      }

      this._hideTyping();

      if (!fullResponse || fullResponse.trim() === '') {
        fullResponse = 'I apologize, but I did not receive a response. Please try again or rephrase your question.';
      }

      this._appendMessage('assistant', fullResponse);

    } catch (err) {
      this._hideTyping();
      if (err.message !== 'Cancelled') {
        ui.notifications.error('Moira: ' + err.message);
        this._appendMessage('assistant', '**Error:** ' + err.message);
      }
    } finally {
      this.currentRequest = null;
    }
  }

  _regenerateLast() {
    const userMsgs = this.messages.filter(m => m.role === 'user');
    if (userMsgs.length < 2) return;
    const lastUserMsg = userMsgs[userMsgs.length - 2];
    // Remove last assistant message
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'assistant') {
        this.messages.splice(i, 1);
        break;
      }
    }
    // Remove last user message
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        this.messages.splice(i, 1);
        break;
      }
    }
    // Re-send
    this._sendMessage(lastUserMsg.content);
  }

  _openImageGen() {
    const prompt = this.container.find('[name="moira-prompt"]').val().trim();
    const modal = new MoiraImageGenModal(prompt);
    modal.render(true);
  }

  _openEnhance() {
    const prompt = this.container.find('[name="moira-prompt"]').val().trim();
    if (!prompt) {
      ui.notifications.warn('Enter some text first to enhance');
      return;
    }
    this.container.find('.moira-enhance-panel').toggle();
  }

  clearHistory() {
    this.messages = [];
    game.settings.set('moira', 'messageHistory', []);
    this.container.find('.moira-chat-messages').html('');
    ui.notifications.info('Chat history cleared');
  }

  openSettings() {
    game.settings.sheet.render(true);
  }
}

Moira.chat = new MoiraChatApp();

// ============================================================
// IMAGE GENERATION MODAL
// ============================================================
class MoiraImageGenModal extends FormApplication {
  constructor(initialPrompt = '') {
    super();
    this.prompt = initialPrompt;
    this.generating = false;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'moira-image-gen',
      title: 'Generate Image',
      template: 'modules/moira/templates/chat/image-gen.html',
      width: 500,
      height: 'auto',
      classes: ['moira-image-gen-modal']
    });
  }

  async getData(options = {}) {
    const size = game.settings.get('moira', 'imageSize') || '1:1';
    return {
      prompt: this.prompt,
      size: size,
      sizes: {
        '1:1': 'Square (1024x1024)',
        '16:9': 'Landscape (1344x756)',
        '9:16': 'Portrait (864x1344)',
        '1:2': 'Tall (768x1344)',
        '2:1': 'Wide (1344x768)'
      },
      models: {
        'FLUX': 'FLUX (High Quality)',
        'flux-schnell': 'FLUX Schnell (Fast)',
        'any': 'Any (Flexible)'
      },
      selectedModel: game.settings.get('moira', 'imageModel') || 'FLUX'
    };
  }

  _updateObject(event, formData) {
    this.prompt = formData.prompt || this.prompt;
  }

  async _updateImage() {
    const formData = new FormData(this.element.find('form')[0]);
    const prompt = formData.get('prompt');
    const size = formData.get('size') || '1:1';
    const model = formData.get('model') || 'FLUX';

    if (!prompt || !prompt.trim()) {
      ui.notifications.warn('Please enter a prompt');
      return;
    }

    this.generating = true;
    this.element.find('.moira-img-generate-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Generating...');
    this.element.find('.moira-img-preview').html('<div class="moira-img-loading"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Generating your image...</p></div>');

    try {
      // Update settings temporarily
      game.settings.set('moira', 'imageSize', size);
      game.settings.set('moira', 'imageModel', model);

      const imageUrl = await Moira.API.generateImage(prompt, (status) => {
        this.element.find('.moira-img-loading p').text(status);
      });

      this.element.find('.moira-img-preview').html(`<img src="${imageUrl}" alt="Generated image" class="moira-img-result"/>`);
      this.element.find('.moira-img-actions').show();

      // Save to gallery
      MoiraGallery.add(imageUrl, prompt, { size, model });

      // Add to chat as special message
      const chatMsg = `[Generated Image: ${prompt}](${imageUrl})`;
      Moira.chat._appendMessage('assistant', `**Image Generated:** ${prompt}\n![Generated](${imageUrl})`);

    } catch (err) {
      this.element.find('.moira-img-preview').html(`<div class="moira-img-error"><i class="fas fa-exclamation-triangle"></i><p>${err.message}</p></div>`);
    } finally {
      this.generating = false;
      this.element.find('.moira-img-generate-btn').prop('disabled', false).html('<i class="fas fa-image"></i> Generate');
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.moira-img-generate-btn').on('click', () => this._updateImage());
    html.find('.moira-img-use-btn').on('click', () => {
      const imgSrc = html.find('.moira-img-result').attr('src');
      if (imgSrc) {
        // Create a journal entry with the image
        this._createJournalEntry(imgSrc);
      }
    });
  }

  async _createJournalEntry(imgSrc) {
    const folder = game.folders.find(f => f.name === 'Moira Gallery' && f.type === 'JournalEntry');
    await JournalEntry.create({
      name: 'Generated Image ' + new Date().toLocaleString(),
      content: `<img src="${imgSrc}" style="max-width: 100%;">`,
      folder: folder?.id || null
    });
    ui.notifications.info('Image saved to journal');
    this.close();
  }
}

// ============================================================
// QUEUE VIEWER
// ============================================================
class MoiraQueueViewer extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'moira-queue-viewer',
      title: 'Moira Queue',
      template: 'modules/moira/templates/queue/queue-viewer.html',
      width: 500,
      height: 400,
      classes: ['moira-queue-dialog']
    });
  }

  async getData(options = {}) {
    const queue = MoiraQueue.getAll();
    return { jobs: queue };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="remove"]').on('click', (e) => {
      const id = e.currentTarget.closest('[data-job-id]').dataset.jobId;
      MoiraQueue.remove(id);
      this.render();
    });
    html.find('[data-action="clear-all"]').on('click', () => {
      MoiraQueue.clear();
      this.render();
    });
    html.find('[data-action="refresh"]').on('click', () => this.render());
  }
}

Moira.queueViewer = new MoiraQueueViewer();

// ============================================================
// SETTINGS APPLICATION
// ============================================================
class MoiraSettingsApp extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'moira-settings',
      title: 'Moira - Settings',
      template: 'modules/moira/templates/config/settings.html',
      width: 600,
      height: 'auto',
      classes: ['moira-settings-dialog']
    });
  }

  async getData(options = {}) {
    return {
      endpoint: game.settings.get('moira', 'hermesEndpoint') || 'http://192.168.1.26:8642',
      apiKey: game.settings.get('moira', 'hermesApiKey') || '',
      defaultModel: game.settings.get('moira', 'defaultModel') || 'minimax-m2.7:cloud',
      imageModel: game.settings.get('moira', 'imageModel') || 'FLUX',
      imageSize: game.settings.get('moira', 'imageSize') || '1:1',
      activeSystem: game.settings.get('moira', 'activeSystem') || 'default',
      systemPrompt: game.settings.get('moira', 'systemPrompt') || '',
      theme: game.settings.get('moira', 'theme') || 'default',
      streamingEnabled: game.settings.get('moira', 'streamingEnabled') !== false,
      showSidebarButton: game.settings.get('moira', 'showSidebarButton') !== false,
      autoConnect: game.settings.get('moira', 'autoConnect') !== false,
      systems: MOIRA_SYSTEMS,
      connected: Moira.API.isConnected(),
      models: {
        'minimax-m2.7:cloud': 'MiniMax (Fast, Cloud)',
        'qwen3-8b-64k:latest': 'Qwen 3 8B (Local)',
        'deepseek-r1:14b': 'DeepSeek R1 14B (Local)',
        'qwq:latest': 'QwenQwQ (Reasoning)'
      },
      imageModels: {
        'FLUX': 'FLUX (High Quality)',
        'flux-schnell': 'FLUX Schnell (Fast)',
        'any': 'Any (Flexible)'
      },
      themes: {
        'default': 'Default (Purple)',
        'blue': 'Ocean Blue',
        'green': 'Forest Green',
        'red': 'Crimson Red'
      },
      sizes: {
        '1:1': 'Square (1024x1024)',
        '16:9': 'Landscape (1344x756)',
        '9:16': 'Portrait (864x1344)',
        '1:2': 'Tall (768x1344)',
        '2:1': 'Wide (1344x768)'
      }
    };
  }

  _updateObject(event, formData) {
    const updates = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith('moira_')) {
        const settingKey = key.slice(6);
        updates[settingKey] = value;
      }
    }
    for (const [key, value] of Object.entries(updates)) {
      game.settings.set('moira', key, value);
    }
    // Update body theme class
    const theme = updates.theme || game.settings.get('moira', 'theme');
    document.body.className = document.body.className.replace(/moira-theme-\w+/g, '');
    document.body.classList.add('moira-theme-' + theme);
    ui.notifications.info('Settings saved');
    this.render();
  }

  async _testConnection() {
    const btn = this.element.find('[data-action="test-connection"]');
    btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Testing...');
    try {
      const connected = await Moira.API.testConnection();
      if (connected) {
        ui.notifications.success('Connected to Hermes Gateway successfully');
      } else {
        ui.notifications.error('Connection test failed - check API key and endpoint');
      }
      this.element.find('.moira-connection-status').html(connected
        ? '<span class="success"><i class="fas fa-check-circle"></i> Connected</span>'
        : '<span class="error"><i class="fas fa-times-circle"></i> Not connected</span>'
      );
    } catch (e) {
      ui.notifications.error('Connection error: ' + e.message);
    } finally {
      btn.prop('disabled', false).html('<i class="fas fa-plug"></i> Test Connection');
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="test-connection"]').on('click', () => this._testConnection());
    html.find('[data-action="clear-queue"]').on('click', () => {
      MoiraQueue.clear();
      ui.notifications.info('Queue cleared');
    });
    html.find('[data-action="clear-gallery"]').on('click', () => {
      MoiraGallery.clear();
      ui.notifications.info('Gallery cleared');
    });
    html.find('[data-action="open-gallery"]').on('click', () => {
      MoiraGalleryApp.open();
    });
  }
}

// ============================================================
// GALLERY APPLICATION
// ============================================================
class MoiraGalleryApp extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'moira-gallery',
      title: 'Moira Gallery',
      template: 'modules/moira/templates/gallery/gallery-view.html',
      width: 800,
      height: 600,
      classes: ['moira-gallery-dialog']
    });
  }

  static open() {
    if (!Moira.apps.gallery) {
      Moira.apps.gallery = new MoiraGalleryApp();
    }
    Moira.apps.gallery.render(true);
  }

  async getData(options = {}) {
    const images = MoiraGallery.getAll();
    return { images };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="delete"]').on('click', (e) => {
      const id = e.currentTarget.closest('[data-image-id]').dataset.imageId;
      MoiraGallery.remove(id);
      this.render();
    });
    html.find('[data-action="use-image"]').on('click', (e) => {
      const url = e.currentTarget.closest('[data-image-url]').dataset.imageUrl;
      const prompt = e.currentTarget.closest('[data-image-url]').dataset.imagePrompt || '';
      // Create journal entry
      JournalEntry.create({
        name: 'Gallery Image ' + new Date().toLocaleString(),
        content: `<img src="${url}" style="max-width: 100%;"><p><em>${prompt}</em></p>`,
        folder: game.folders.find(f => f.name === 'Moira Gallery')?.id || null
      });
      ui.notifications.info('Image added to journal');
    });
  }
}

Moira.apps.gallery = null;

// ============================================================
// ONBOARDING
// ============================================================
class MoiraOnboarding extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'moira-onboarding',
      title: 'Welcome to Moira',
      template: 'modules/moira/templates/onboarding/welcome.html',
      width: 600,
      height: 'auto',
      classes: ['moira-onboarding-dialog']
    });
  }

  async getData(options = {}) {
    return {
      version: Moira.version
    };
  }
}

// ============================================================
// SIDEBAR BUTTON
// ============================================================
class MoiraSidebar {
  static inject() {
    if (!game.settings.get('moira', 'showSidebarButton')) return;
    const sidebarTabs = $('#sidebar-tabs');
    if (!sidebarTabs.length) return;

    const btn = document.createElement('a');
    btn.className = 'item moira-sidebar-btn';
    btn.dataset.tab = 'moira';
    btn.title = 'Moira AI Game Master';
    btn.innerHTML = '<i class="fas fa-robot"></i><span class="tab-label">Moira</span>';
    btn.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    btn.addEventListener('click', () => Moira.chat.open());
    sidebarTabs.append(btn);
  }
}

// ============================================================
// TEMPLATE RENDERER
// ============================================================
async function renderTemplate(path, data = {}) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn('Moira: Template not found:', path);
      return '<div class="moira-error">Template not found: ' + path + '</div>';
    }
    let template = await response.text();

    // Replace {{variable}} placeholders
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g');
      template = template.replace(regex, String(value != null ? value : ''));
    }

    // Handle #each loops
    template = template.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, inner) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      return array.map(item => {
        let result = inner;
        for (const [k, v] of Object.entries(item)) {
          result = result.replace(new RegExp('\\{\\{\\s*' + k + '\\s*\\}\\}', 'g'), String(v != null ? v : ''));
        }
        return result;
      }).join('');
    });

    return template;
  } catch (err) {
    console.error('Moira: Template render error:', err);
    return '<div class="moira-error">Template error: ' + err.message + '</div>';
  }
}

// ============================================================
// FOUNDRY HOOKS
// ============================================================
Hooks.once('init', () => {
  console.log('Moira v' + Moira.version + ' initializing...');
  MoiraSettings.register();

  // Register keyboard shortcut Ctrl+M
  game.keybindings.register('moira', 'openChat', {
    name: 'Open Moira Chat',
    editable: [{ key: 'm', modifiers: [CONST.KEY_MODIFIER_CONTROL] }],
    onDown: () => Moira.chat.open()
  });
});

Hooks.once('setup', () => {
  const theme = game.settings.get('moira', 'theme') || 'default';
  document.body.classList.add('moira-theme-' + theme);
});

Hooks.once('ready', async () => {
  console.log('Moira v' + Moira.version + ' ready');

  if (game.settings.get('moira', 'autoConnect')) {
    try {
      const connected = await Moira.API.testConnection();
      if (connected) {
        console.log('Moira: Connected to Hermes Gateway');
        ui.notifications.info('Moira connected to Hermes Gateway');
      } else {
        console.warn('Moira: Could not connect to Hermes Gateway');
        ui.notifications.warn('Moira: Check your API key in settings');
      }
    } catch (e) {
      console.warn('Moira connection error:', e);
    }
  }

  Moira.initialized = true;

  // Show onboarding if first time
  const shownOnboarding = game.settings.get('moira', 'shownOnboarding');
  if (!shownOnboarding) {
    setTimeout(() => {
      const onboarding = new MoiraOnboarding();
      onboarding.render(true);
    }, 1000);
    game.settings.set('moira', 'shownOnboarding', true);
  }
});

// Hook for queue updates
Hooks.on('moira:queueUpdated', (queue) => {
  // Could update a queue viewer if open
});

// Hook for gallery updates
Hooks.on('moira:galleryUpdated', (gallery) => {
  // Could update gallery viewer if open
});

// ============================================================
// GLOBAL ACCESS
// ============================================================
window.Moira = Moira;
window.MoiraAPI = MoiraAPI;
window.MoiraChatApp = MoiraChatApp;
window.MoiraQueue = MoiraQueue;
window.MoiraGallery = MoiraGallery;
window.MoiraSettings = MoiraSettings;
window.MoiraSYSTEMS = MOIRA_SYSTEMS;

console.log('Moira module loaded - AI Game Master for Foundry VTT');