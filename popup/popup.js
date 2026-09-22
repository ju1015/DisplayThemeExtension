/**
 * TeaAndCode - Extension Popup Logic
 * 
 * Flow:
 * 1. Identify the current active tab and domain.
 * 2. Load saved preferences for this domain from chrome.storage.local.
 * 3. Render the UI state (toggle, selected theme preset, sliders).
 * 4. Listen for user interactions and apply/update the CSS on the live page in real time.
 */

// Default settings when visiting a site for the first time
const DEFAULT_SETTINGS = {
  enabled: false,
  theme: "midnight",      // "midnight", "sepia", "slate", "matcha"
  brightness: 90,         // 60 to 110%
  contrast: 100           // 70 to 130%
};

// CSS theme filter definitions
// Notice how every preset preserves contrast while giving a unique eye-comfort tone
const THEME_FILTERS = {
  midnight: {
    // Pure inversion + hue shift back so colors remain recognizable
    invert: 1,
    hueRotate: 180,
    sepia: 0,
    background: "#0d1117"
  },
  sepia: {
    // Warm Chai: Gentle sepia wash that eliminates harsh blue light
    invert: 0.92,
    hueRotate: 165,
    sepia: 0.35,
    background: "#181410"
  },
  slate: {
    // Nordic: Cool muted dark slate tone
    invert: 0.95,
    hueRotate: 195,
    sepia: 0.05,
    background: "#121820"
  },
  matcha: {
    // Gentle Forest Green: Soothing green tint to relax eye strain
    invert: 0.94,
    hueRotate: 140,
    sepia: 0.15,
    background: "#0d1813"
  }
};

// UI Element references
const elements = {
  domainBadge: document.getElementById("domainBadge"),
  domainName: document.getElementById("domainName"),
  toggleTheme: document.getElementById("toggleTheme"),
  powerStatus: document.getElementById("powerStatus"),
  themePresetsSection: document.getElementById("themePresetsSection"),
  themeButtons: document.querySelectorAll(".theme-btn"),
  controlsSection: document.getElementById("controlsSection"),
  sliderBrightness: document.getElementById("sliderBrightness"),
  brightnessVal: document.getElementById("brightnessVal"),
  sliderContrast: document.getElementById("sliderContrast"),
  contrastVal: document.getElementById("contrastVal"),
  btnReset: document.getElementById("btnReset")
};

let currentTabId = null;
let currentDomain = "unknown";
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * 1. Initialize the extension when popup opens
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Query the currently active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      displayUnsupportedPage("Unavailable");
      return;
    }

    currentTabId = tab.id;

    // Check if the current page can be customized (ignore chrome:// or edge:// pages)
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://")) {
      displayUnsupportedPage("System Page");
      return;
    }

    // Extract the clean domain name (e.g. docs.python.org)
    const urlObj = new URL(tab.url);
    currentDomain = urlObj.hostname;
    elements.domainName.textContent = currentDomain;

    // Load saved settings for this specific domain
    const storageKey = `theme_settings_${currentDomain}`;
    const data = await chrome.storage.local.get(storageKey);
    
    if (data[storageKey]) {
      currentSettings = { ...DEFAULT_SETTINGS, ...data[storageKey] };
    }

    // Render UI to reflect settings
    updateUI();

    // Register event listeners for user input
    setupEventListeners();

  } catch (error) {
    console.error("TeaAndCode initialization error:", error);
    displayUnsupportedPage("Error");
  }
});

/**
 * 2. Update the Popup UI based on currentSettings
 */
function updateUI() {
  // Master Switch state
  elements.toggleTheme.checked = currentSettings.enabled;
  
  if (currentSettings.enabled) {
    elements.powerStatus.textContent = "Active";
    elements.powerStatus.classList.add("enabled");
    elements.domainBadge.classList.add("active");
    elements.themePresetsSection.classList.remove("disabled");
    elements.controlsSection.classList.remove("disabled");
  } else {
    elements.powerStatus.textContent = "Disabled";
    elements.powerStatus.classList.remove("enabled");
    elements.domainBadge.classList.remove("active");
    elements.themePresetsSection.classList.add("disabled");
    elements.controlsSection.classList.add("disabled");
  }

  // Theme preset buttons active state
  elements.themeButtons.forEach(btn => {
    if (btn.dataset.theme === currentSettings.theme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Sliders and percentage labels
  elements.sliderBrightness.value = currentSettings.brightness;
  elements.brightnessVal.textContent = `${currentSettings.brightness}%`;
  
  elements.sliderContrast.value = currentSettings.contrast;
  elements.contrastVal.textContent = `${currentSettings.contrast}%`;
}

/**
 * 3. Handle user interactions
 */
function setupEventListeners() {
  // Master Toggle Switch
  elements.toggleTheme.addEventListener("change", async (e) => {
    currentSettings.enabled = e.target.checked;
    updateUI();
    await saveSettings();
    applyThemeToPage();
  });

  // Preset Theme Buttons
  elements.themeButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!currentSettings.enabled) return;
      currentSettings.theme = btn.dataset.theme;
      updateUI();
      await saveSettings();
      applyThemeToPage();
    });
  });

  // Brightness Slider
  elements.sliderBrightness.addEventListener("input", (e) => {
    currentSettings.brightness = parseInt(e.target.value, 10);
    elements.brightnessVal.textContent = `${currentSettings.brightness}%`;
    applyThemeToPage(); // Live preview as you slide
  });
  elements.sliderBrightness.addEventListener("change", async () => {
    await saveSettings(); // Persist once user lets go of slider
  });

  // Contrast Slider
  elements.sliderContrast.addEventListener("input", (e) => {
    currentSettings.contrast = parseInt(e.target.value, 10);
    elements.contrastVal.textContent = `${currentSettings.contrast}%`;
    applyThemeToPage(); // Live preview as you slide
  });
  elements.sliderContrast.addEventListener("change", async () => {
    await saveSettings();
  });

  // Reset to Defaults Button
  elements.btnReset.addEventListener("click", async () => {
    currentSettings.brightness = DEFAULT_SETTINGS.brightness;
    currentSettings.contrast = DEFAULT_SETTINGS.contrast;
    updateUI();
    await saveSettings();
    applyThemeToPage();
  });
}

/**
 * 4. Save current settings for this domain in chrome.storage.local
 */
async function saveSettings() {
  if (currentDomain && currentDomain !== "unknown") {
    const storageKey = `theme_settings_${currentDomain}`;
    await chrome.storage.local.set({ [storageKey]: currentSettings });
  }
}

/**
 * 5. Inject or remove the theme CSS in the current tab
 */
function applyThemeToPage() {
  if (!currentTabId) return;

  const config = {
    enabled: currentSettings.enabled,
    theme: currentSettings.theme,
    brightness: currentSettings.brightness,
    contrast: currentSettings.contrast,
    themeProps: THEME_FILTERS[currentSettings.theme] || THEME_FILTERS.midnight
  };

  // Run this function directly inside the context of the webpage
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: updatePageDOMTheme,
    args: [config]
  }).catch(err => {
    console.warn("Could not inject script (page might be protected or loading):", err);
  });
}

/**
 * This function is executed inside the webpage itself!
 * It creates or removes a dedicated <style id="tea-and-code-theme"> tag in the webpage <head>.
 */
function updatePageDOMTheme(config) {
  const STYLE_ID = "tea-and-code-theme-style";
  let existingStyle = document.getElementById(STYLE_ID);

  // If user disabled the theme, remove the style and clean up
  if (!config.enabled) {
    if (existingStyle) {
      existingStyle.remove();
    }
    return;
  }

  const { themeProps, brightness, contrast } = config;

  // The CSS Rules that power the theme
  // We use CSS custom filters with hardware acceleration
  const css = `
    /* Invert entire document to dark mode */
    html {
      filter: invert(${themeProps.invert}) 
              hue-rotate(${themeProps.hueRotate}deg) 
              sepia(${themeProps.sepia}) 
              brightness(${brightness}%) 
              contrast(${contrast}%) !important;
      background-color: ${themeProps.background} !important;
    }

    /* Smart Media Protection: Keep images, diagrams, videos, and avatars natural! */
    img, 
    video, 
    picture, 
    canvas, 
    iframe, 
    svg:not([role="img"]),
    [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    /* Keep code block backgrounds dark and high-contrast */
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

/**
 * Helper: when tab is not a regular website (e.g. settings or new tab)
 */
function displayUnsupportedPage(label) {
  elements.domainName.textContent = label;
  elements.powerStatus.textContent = "Disabled";
  elements.toggleTheme.disabled = true;
  elements.themePresetsSection.classList.add("disabled");
  elements.controlsSection.classList.add("disabled");
}
