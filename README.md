# ☕ TeaAndCode: Developer Documentation Theme Extension

> **Smart, eye-comfort dark mode & theme customizer built specifically for developers reading documentation late at night.**

---

## 💡 The Problem
As developers, we spend hours reading API documentation, reference guides, and blogs (Python docs, Oracle docs, MDN, legacy documentation, etc.). Many of these sites only provide blinding white backgrounds with high-contrast black text. 

Traditional dark mode tools often:
- Break code block styling.
- Turn architecture diagrams, flowcharts, and screenshots into unreadable negative X-rays.
- Apply universally, ruining sites that already have great native dark themes.

**TeaAndCode** solves this with **smart inversion, media protection, per-site memory, and curated reading flavors**.

---

## ✨ Features

- ☕ **Curated Flavor Presets**:
  - **Midnight (OLED)**: Deep dark background (`#0d1117`) for low-light coding sessions.
  - **Warm Chai (Sepia)**: Soft amber/paper tone that filters out harsh blue light.
  - **Nordic (Slate)**: Cool, muted slate gray inspired by popular editor themes.
  - **Matcha (Forest)**: Soothing forest green tint designed to relax eye fatigue.
- 🛡️ **Smart Media Protection**:
  - Automatically detects and protects `<img>`, `<video>`, `<picture>`, `<canvas>`, and architectural SVG diagrams so they look 100% natural, never inverted.
- 💾 **Per-Domain Memory**:
  - Settings are saved per website domain (using `chrome.storage.local`). Turn it ON for `docs.python.org` while keeping it untouched on `github.com`.
- 🎛️ **Live Fine-Tuning**:
  - Real-time sliders for **Brightness** (60% – 110%) and **Contrast** (70% – 130%) with a quick one-click **Reset** button.
- ⚡ **Zero-Lag & GPU Accelerated**:
  - Uses native browser CSS filter compositing for instant response, even on 10,000-line documentation pages.

---

## 🚀 Quick Start / Installation Guide

Anyone can install and use this extension in **less than 60 seconds**:

### 1. Download or Clone
Clone this repository or download and extract the ZIP file:
```bash
git clone https://github.com/your-username/TeaAndCode.git
```

### 2. Load into Your Chromium Browser (Chrome, Edge, Brave, Arc, Opera)
1. Open your browser and navigate to:
   ```text
   chrome://extensions
   ```
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. Click the **Load unpacked** button in the top-left menu.
4. Select the `TeaAndCode` (or `DisplayThemeExtension`) root directory.

### 3. Start Reading!
1. Click the puzzle icon in Chrome's toolbar and **pin** the **TeaAndCode** extension.
2. Open any documentation page (e.g., [docs.python.org](https://docs.python.org/3/) or [en.wikipedia.org](https://en.wikipedia.org/wiki/Main_Page)).
3. Click the extension icon, flip the switch to **Active**, pick your favorite theme, and enjoy comfortable reading!

---

## 📂 Project Architecture

TeaAndCode is built following the latest **Manifest V3** extension standard:

```text
DisplayThemeExtension/
├── manifest.json       # Extension metadata, permissions & command registration
├── background.js       # Background service worker handling Alt+Shift+D shortcuts
├── README.md           # Documentation & installation guide
└── popup/
    ├── popup.html      # Glassmorphic developer UI layout
    ├── popup.css       # Sleek dark theme styling & custom sliders
    └── popup.js        # Event handling, storage persistence & DOM injection
```

### How It Works Behind the Scenes
1. **`popup.html` / `popup.css`**: Provides a modern, responsive popup interface using CSS variables and glassmorphism.
2. **`popup.js`**:
   - Queries `chrome.tabs.query` to identify the current tab and extract the domain.
   - Loads saved preferences for that domain from `chrome.storage.local`.
   - Uses `chrome.scripting.executeScript` to dynamically inject or update a custom `<style id="tea-and-code-theme-style">` element directly in the page's `<head>`.
3. **`background.js` (Service Worker)**:
   - Listens for `chrome.commands` when you press `Alt + Shift + D`.
   - Wakes up on demand to toggle the active tab's theme and saves preferences, even when the popup window is closed.
4. **The Double-Inversion Magic**:
   ```css
   /* Invert page to dark */
   html {
     filter: invert(1) hue-rotate(180deg) ...;
   }

   /* Invert images BACK to normal: (-1) * (-1) = 1 */
   img, video, canvas, svg:not([role="img"]) {
     filter: invert(1) hue-rotate(180deg) !important;
   }
   ```

---

## ⌨️ Shortcuts & Hotkeys
- **`Alt` + `Shift` + `D`**: Instantly toggle the theme ON / OFF on your current tab without even opening the popup!
- You can customize this shortcut anytime in your browser by visiting:
  ```text
  chrome://extensions/shortcuts
  ```

---

## 🛠️ Contributing & Feedback
Contributions, feature suggestions, and pull requests are welcome! If you have ideas for new theme presets or improvements, feel free to open an issue or submit a PR.

---

*Crafted with ☕ for developers who love coding late.*
