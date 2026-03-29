// =======================================
// ⚙️ SETUP MODULE (FULL AI CONFIG SYSTEM)
// =======================================

// Load Setup UI
function loadSetupUI() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>Setup Your AI ⚙️</h1>

      <div class="card">
        <h2>AI Configuration</h2>
        <p class="subtitle">Select provider, model & enter API key</p>

        <!-- AI Provider -->
        <select id="provider" onchange="updateModels()">
          <option value="">Select AI Provider</option>
          <option value="gemini">Google Gemini (Free)</option>
          <option value="openai">OpenAI (Paid)</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="huggingface">HuggingFace (Free)</option>
          <option value="groq">Groq (Fast)</option>
        </select>

        <!-- Model Selection -->
        <select id="model">
          <option value="">Select Model</option>
        </select>

        <!-- API Key -->
        <input type="text" id="apiKeyInput" placeholder="Enter API key">

        <button onclick="handleSetup()">Save & Continue</button>

        <button class="btn-secondary" onclick="goBackToAuth()">Back</button>
      </div>
    </div>
  `;
}

// Model database (ALL PROVIDERS 🔥)
const MODEL_MAP = {
  gemini: [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
  ],

  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-3.5-turbo"
  ],

  anthropic: [
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku"
  ],

  huggingface: [
    "mistralai/Mistral-7B-Instruct",
    "meta-llama/Llama-3-8B",
    "tiiuae/falcon-7b"
  ],

  groq: [
    "llama3-70b-8192",
    "mixtral-8x7b",
    "gemma-7b-it"
  ]
};

// Update models dynamically
function updateModels() {
  const provider = document.getElementById("provider").value;
  const modelSelect = document.getElementById("model");

  modelSelect.innerHTML = `<option value="">Select Model</option>`;

  if (!provider || !MODEL_MAP[provider]) return;

  MODEL_MAP[provider].forEach(model => {
    modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
  });
}

// Handle Setup
function handleSetup() {
  const provider = document.getElementById("provider").value;
  const model = document.getElementById("model").value;
  const key = document.getElementById("apiKeyInput").value.trim();

  if (!provider || !model || !key) {
    alert("Please select provider, model and enter API key");
    return;
  }

  // Save full config
  const config = {
    provider,
    model,
    apiKey: key
  };

  localStorage.setItem("uys_ai_config", JSON.stringify(config));

  console.log("Saved Config:", config);

  reloadApp();
}
// =======================================
// ⚙️ SETTINGS PANEL (CHANGE AI ANYTIME)
// =======================================

function openSettings() {
  const config = getAIConfig() || {};

  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>AI Settings ⚙️</h1>

      <div class="card">

        <select id="provider" onchange="updateModels()">
          <option value="">Select Provider</option>
          <option value="gemini" ${config.provider==="gemini"?"selected":""}>Gemini</option>
          <option value="openai" ${config.provider==="openai"?"selected":""}>OpenAI</option>
        </select>

        <select id="model"></select>

        <input type="text" id="apiKeyInput" placeholder="API Key" value="${config.apiKey || ""}">

        <button onclick="saveSettings()">Save Changes</button>
        <button class="btn-secondary" onclick="loadDashboardUI()">Back</button>

      </div>
    </div>
  `;

  setTimeout(() => {
    updateModels();
    document.getElementById("model").value = config.model || "";
  }, 100);
}

// Save new settings
function saveSettings() {
  const provider = document.getElementById("provider").value;
  const model = document.getElementById("model").value;
  const key = document.getElementById("apiKeyInput").value.trim();

  if (!provider || !model || !key) {
    alert("Fill all fields");
    return;
  }

  const config = { provider, model, apiKey: key };

  localStorage.setItem("uys_ai_config", JSON.stringify(config));

  showToast("Settings updated ✅");

  loadDashboardUI();
}

// Back to Auth
function goBackToAuth() {
  removeUser();
  reloadApp();
}