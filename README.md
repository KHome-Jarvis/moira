# Moira - AI Game Master for Foundry VTT

**Version:** 1.0.0  
**Author:** J.A.R.V.I.S. (Jarvis AI System)  
**License:** MIT

---

## Overview

Moira is a self-hosted AI Game Master companion for [Foundry Virtual Tabletop](https://foundryvtt.com/). It provides AI-powered chat, image generation, text enhancement, and more — powered entirely by your local Hermes Gateway instead of a subscription service.

Moira is a replacement for the Cibola 8 module, built for users who want full control over their AI infrastructure.

---

## Features

- **AI Chat** — Natural language conversation with Moira for game prep, NPC creation, scene descriptions, and rule questions
- **Image Generation** — Generate scene art, maps, and character portraits using FLUX (via Hermes Gateway)
- **Text Enhancement** — Improve, shorten, expand, or convert text to dialogue
- **Translation** — Translate game text to any language
- **Gallery** — Save and organize generated images in Foundry journals
- **Queue System** — Track image generation and other long-running jobs
- **Multi-System Support** — Built-in prompts for D&D 5E, Pathfinder 2E, Call of Cthulhu 7E, Warhammer Fantasy 4E, and more
- **4 Color Themes** — Purple (default), Ocean Blue, Forest Green, Crimson Red
- **Streaming Responses** — Real-time AI output as it generates
- **Keyboard Shortcut** — Ctrl+M to open chat from anywhere

---

## Requirements

- **Foundry VTT** v12 or v14
- **Hermes Gateway** running on a local or remote server
- **API Key** for Hermes Gateway authentication

---

## Installation

### Option 1: GitHub (Recommended)

1. Install via Foundry's package browser with the manifest URL:
   ```
   https://raw.githubusercontent.com/KHome-Jarvis/moira/main/module.json
   ```

### Option 2: Manual

1. Download the latest release from the [GitHub Releases](https://github.com/KHome-Jarvis/moira/releases)
2. Extract the zip into your Foundry `Data/modules/moira/` directory
3. Restart Foundry and enable the Moira module

---

## Configuration

1. Open Foundry and navigate to **Game Settings** → **Configure Settings** → **Module Settings**
2. Find **Moira** and expand the settings
3. Enter your **Hermes Endpoint** (e.g., `http://192.168.1.26:8642`)
4. Enter your **API Key** (from your Hermes Gateway configuration)
5. Optionally select your **Game System** for contextual prompts
6. Click **Test Connection** to verify the setup

### Hermes Gateway Setup

Moira expects your Hermes Gateway to expose an OpenAI-compatible API at:
```
GET/POST {endpoint}/v1/chat/completions
POST   {endpoint}/v1/images/generations
```

---

## Usage

### Opening Moira

- Click the **robot icon** in the Foundry sidebar
- Press **Ctrl+M** from anywhere in Foundry

### Chat

Type your message and press Enter. Moira responds based on your selected game system. You can ask about:
- NPC personalities and backstories
- Scene descriptions and atmosphere
- Encounter design and difficulty
- Rule clarifications and homebrew suggestions
- Loot tables and treasure
- Quest hooks and story ideas

### Image Generation

Click the **Image** button in the chat toolbar, describe what you want, and Moira will generate it using FLUX via your Hermes Gateway.

### Text Enhancement

Select text in the chat input and click **Enhance** to improve it, shorten it, expand it, or convert it to dialogue format.

---

## Supported Game Systems

| System | ID |
|--------|-----|
| Dungeons & Dragons 5E | `dnd5e` |
| Pathfinder 2E | `pf2e` |
| Starfinder 2E | `sf2e` |
| Chronicles of Darkness | `coterie` |
| Warhammer Fantasy 4E | `wfrp4e` |
| Call of Cthulhu 7E | `coc7` |
| Savage Worlds (SWADE) | `swade` |
| Old School Essentials | `ose` |
| The Zone (Stalker) | `zone` |
| Blade Runner RPG | `bladerunner` |
| Generic RPG | `default` |

---

## Architecture

```
moira/
├── module.json          # Foundry module manifest
├── src/
│   ├── moira-init.js    # Main entry point (all services, apps, hooks)
│   └── styles.css       # Full CSS with 4 themes
├── templates/
│   ├── chat/            # Chat window, image generation modal
│   ├── config/          # Settings dialog
│   ├── gallery/         # Image gallery viewer
│   ├── queue/           # Job queue viewer
│   └── onboarding/      # Welcome screen
├── lang/
│   └── en.json          # English translations
└── README.md
```

---

## Comparison: Moira vs Cibola 8

| Feature | Cibola 8 | Moira |
|---------|----------|-------|
| AI Chat | Cloud subscription | Your Hermes Gateway |
| Image Generation | Cloud subscription | Your Hermes Gateway |
| TTS | ElevenLabs cloud | Via Hermes |
| Wall Detection | OpenCV WASM | Planned |
| Translation | Cloud API | Via Hermes |
| Subscription Required | Yes | No |
| Self-hosted | No | Yes |
| Data leaves your network | Yes | No |

---

## Troubleshooting

### "Not connected" status

1. Verify Hermes Gateway is running at your configured endpoint
2. Check your API key is correct in Moira settings
3. Try clicking **Test Connection** in settings
4. Check browser console (F12) for detailed error messages

### Chat not streaming

Streaming requires your browser to support `ReadableStream`. If it fails, disable **Enable Streaming Responses** in settings for non-streaming responses.

### Images not generating

1. Ensure your Hermes Gateway has an image generation endpoint configured
2. Check that your API key has permissions for image generation
3. Try a simpler prompt to rule out content filtering

---

## Planned Features

- [ ] OpenCV wall detection and scanning
- [ ] NPC name generator
- [ ] Scene generator
- [ ] Token generator
- [ ] Radial menu for quick actions
- [ ] PDF import for game content
- [ ] Voice input (microphone)
- [ ] Multi-language support (de, es, fr)

---

## Development

To build or contribute to Moira:

```bash
# Clone the repository
git clone https://github.com/KHome-Jarvis/moira.git

# Install dependencies (if needed)
npm install

# Make changes to src/moira-init.js, templates/, or styles.css

# Test locally by copying to your Foundry modules directory

# Push changes and create a PR
```

---

## Support

For issues or feature requests, open an issue on [GitHub](https://github.com/KHome-Jarvis/moira/issues).

For questions about Hermes Gateway setup, refer to the [Hermes Agent documentation](https://hermes-agent.nousresearch.com/).

---

*Moira is not affiliated with Cibola, Foundry VTT, or any mentioned game system. All trademarks belong to their respective owners.*