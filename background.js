/**
 * TeaAndCode - Background Service Worker
 * 
 * Handles global keyboard shortcuts (Alt + Shift + D) even when the popup is closed.
 */

const DEFAULT_SETTINGS = {
  enabled: false,
  theme: "midnight",
  brightness: 90,
  contrast: 100
};

const THEME_FILTERS = {
  midnight: { invert: 1, hueRotate: 180, sepia: 0, background: "#0d1117" },
  sepia: { invert: 0.92, hueRotate: 165, sepia: 0.35, background: "#181410" },
  slate: { invert: 0.95, hueRotate: 195, sepia: 0.05, background: "#121820" },
  matcha: { invert: 0.94, hueRotate: 140, sepia: 0.15, background: "#0d1813" }
};

// Listen for keyboard shortcuts defined in manifest.json
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-theme") {
    await toggleThemeOnActiveTab();
  }
});

async function toggleThemeOnActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) return;

    // Ignore browser system pages where extensions cannot run
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://")) {
      return;
    }

    const domain = new URL(tab.url).hostname;
    const storageKey = `theme_settings_${domain}`;

    // Get existing settings for this domain
    const data = await chrome.storage.local.get(storageKey);
    const settings = data[storageKey] ? { ...DEFAULT_SETTINGS, ...data[storageKey] } : { ...DEFAULT_SETTINGS };

    // Flip the state (toggle ON if was OFF, toggle OFF if was ON)
    settings.enabled = !settings.enabled;

    // Save the new state back to storage
    await chrome.storage.local.set({ [storageKey]: settings });

    // Apply or remove theme on the webpage
    const config = {
      enabled: settings.enabled,
      theme: settings.theme,
      brightness: settings.brightness,
      contrast: settings.contrast,
      themeProps: THEME_FILTERS[settings.theme] || THEME_FILTERS.midnight
    };

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: updatePageDOMTheme,
      args: [config]
    });

  } catch (err) {
    console.error("TeaAndCode shortcut error:", err);
  }
}

/**
 * Injected into the active page to apply or remove theme styles
 */
function updatePageDOMTheme(config) {
  const STYLE_ID = "tea-and-code-theme-style";
  let existingStyle = document.getElementById(STYLE_ID);

  if (!config.enabled) {
    if (existingStyle) {
      existingStyle.remove();
    }
    return;
  }

  const { themeProps, brightness, contrast } = config;

  const css = `
    html {
      filter: invert(${themeProps.invert}) 
              hue-rotate(${themeProps.hueRotate}deg) 
              sepia(${themeProps.sepia}) 
              brightness(${brightness}%) 
              contrast(${contrast}%) !important;
      background-color: ${themeProps.background} !important;
    }

    img, 
    video, 
    picture, 
    canvas, 
    iframe, 
    svg:not([role="img"]),
    [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    pre, code {
      text-shadow: none !important;
    }
  `;

  if (!existingStyle) {
    existingStyle = document.createElement("style");
    existingStyle.id = STYLE_ID;
    document.head.appendChild(existingStyle);
  }

  existingStyle.textContent = css;
}
