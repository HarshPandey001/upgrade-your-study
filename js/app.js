let authMode = "login";
let dashboardSearchQuery = "";
let historySearchQuery = "";
let bcaCatalogCache = null;
let bcaSyllabusViewCache = null;
let customUploadedMaterials = [];
let assistantImageAttachment = "";
let processingIntervalId = null;
let backendHistoryCache = [];
let profileAvatarDraft = "";

const BCA_SUBJECTS_FALLBACK = {
  "1": {
    subjects: [
      { name: "IT Tools and Applications", code: "BCA 101" },
      { name: "Principles of Mathematics", code: "BCA 102" },
      { name: "Functional English", code: "BCA 103" },
      { name: "Programming in C", code: "BCA 104" }
    ]
  },
  "2": {
    subjects: [
      { name: "Discrete Mathematics", code: "BCA 201" },
      { name: "Financial Management", code: "BCA 202" },
      { name: "Digital Logic", code: "BCA 203" },
      { name: "OOP with C++", code: "BCA 204" }
    ]
  },
  "3": {
    subjects: [
      { name: "Operating System", code: "BCA 301" },
      { name: "Data Structures", code: "BCA 303" },
      { name: "Computer Architecture", code: "BCA 304" }
    ]
  },
  "4": {
    subjects: [
      { name: "Database Management System", code: "BCA 401" },
      { name: "Java Programming", code: "BCA 402" },
      { name: "Computer Networks", code: "BCA 403" }
    ]
  },
  "5": {
    subjects: [
      { name: "Software Engineering", code: "BCA 501" },
      { name: "Web Technology", code: "BCA 502" },
      { name: "Python Programming", code: "BCA 503" }
    ]
  },
  "6": {
    subjects: [
      { name: "Artificial Intelligence", code: "BCA 601" },
      { name: "Project Work", code: "BCA 602" },
      { name: "Cloud Computing", code: "BCA 603" }
    ]
  }
};

function ensureRuntimeStyles() {
  if ($("uys-runtime-style")) return;

  const style = document.createElement("style");
  style.id = "uys-runtime-style";
  style.textContent = `
    body {
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 30%),
        linear-gradient(160deg, #08111f 0%, #111c30 52%, #0f172a 100%);
    }

    .app-shell {
      width: 100%;
      max-width: 1180px;
      align-items: stretch;
      justify-content: flex-start;
      text-align: left;
      padding: 32px 20px 48px;
    }

    .hero-card,
    .panel-card {
      width: 100%;
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 22px;
      box-shadow: 0 18px 45px rgba(2, 8, 23, 0.35);
    }

    .hero-card {
      padding: 28px;
    }

    .hero-card.compact {
      max-width: none;
    }

    .panel-card {
      padding: 24px;
    }

    .top-bar,
    .action-row,
    .search-row {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .top-bar {
      align-items: center;
      justify-content: space-between;
    }

    .status-grid,
    .dashboard-grid,
    .split-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .split-grid.wide {
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    }

    .stat-card,
    .content-card,
    .recent-item,
    .review-card,
    .timeline-card,
    .chat-bubble,
    .upload-card {
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 18px;
      padding: 16px;
    }

    .eyebrow {
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .pill-row,
    .option-list,
    .recent-list,
    .timeline-list,
    .checklist,
    .chat-list,
    .step-list {
      display: grid;
      gap: 12px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      background: rgba(56, 189, 248, 0.14);
      color: #d8f3ff;
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 10px 12px;
      border-radius: 999px;
      margin: 0 8px 8px 0;
      font-size: 14px;
    }

    .inline-btn,
    .question-button,
    .option-card {
      width: auto;
      min-width: 0;
    }

    .question-button,
    .option-card,
    .subject-choice {
      justify-content: flex-start;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(51, 65, 85, 0.88);
      color: #e2e8f0;
    }

    .question-button:hover,
    .option-card:hover,
    .subject-choice:hover {
      opacity: 1;
      background: rgba(71, 85, 105, 0.96);
    }

    .selected-card,
    .option-card.selected,
    .subject-choice.active {
      background: #38bdf8;
      color: #082f49;
    }

    .option-letter,
    .timeline-day {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      font-weight: 700;
      flex-shrink: 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.18);
      color: #cbd5e1;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .recent-meta,
    .chat-meta,
    .upload-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
    }

    .search-row input,
    .search-row select,
    textarea {
      flex: 1;
      margin-top: 0;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      margin-top: 10px;
      border: none;
      border-radius: 10px;
      background: #334155;
      color: white;
      outline: none;
      resize: vertical;
    }

    .chat-bubble.user {
      border-color: rgba(56, 189, 248, 0.3);
    }

    .chat-bubble.assistant {
      border-color: rgba(148, 163, 184, 0.2);
    }

    .preview-image {
      width: 100%;
      max-width: 320px;
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      margin-top: 12px;
    }

    .toast-root {
      position: fixed;
      right: 18px;
      top: 18px;
      z-index: 1000;
      display: grid;
      gap: 10px;
    }

    .toast {
      min-width: 220px;
      max-width: 340px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #e2e8f0;
      padding: 14px 16px;
      border-radius: 14px;
      box-shadow: 0 12px 28px rgba(2, 8, 23, 0.4);
      opacity: 0;
      transform: translateY(-6px);
      transition: 0.18s ease;
    }

    .toast.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .toast-success {
      border-color: rgba(34, 197, 94, 0.4);
    }

    .toast-error {
      border-color: rgba(248, 113, 113, 0.45);
    }

    .is-loading {
      opacity: 0.75;
      cursor: wait;
    }

    @media (max-width: 820px) {
      .split-grid.wide {
        grid-template-columns: 1fr;
      }

      .top-bar {
        align-items: flex-start;
      }
    }
  `;

  document.head.appendChild(style);
}

function getResultForCurrentCourse() {
  const course = getCourse();
  const result = getAIResult();
  if (!course || !result) return null;
  return result.meta?.courseSignature === courseSignature(course) ? result : null;
}

function stopProcessingSteps() {
  if (processingIntervalId) {
    clearInterval(processingIntervalId);
    processingIntervalId = null;
  }
}

function renderProcessingView(stepIndex = 0) {
  const steps = [
    "Checking course context",
    "Reading selected subjects and uploaded notes",
    "Generating topics and questions",
    "Creating MCQs and explanations",
    "Preparing the 7-day study plan"
  ];

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <p class="eyebrow">Processing</p>
        <h1>Building your study pack</h1>
        <p class="subtitle">The app is simulating a step-by-step workflow while the AI prepares your results.</p>
      </section>

      <section class="panel-card">
        <div class="loader"></div>
        <div class="step-list" style="margin-top: 20px;">
          ${steps
            .map((step, index) => `
              <div class="timeline-card ${index <= stepIndex ? "selected-card" : ""}">
                <div class="chat-meta">
                  <strong>Step ${index + 1}</strong>
                  <span class="small">${index < stepIndex ? "Done" : index === stepIndex ? "Running" : "Pending"}</span>
                </div>
                <p>${escapeHtml(step)}</p>
              </div>
            `)
            .join("")}
        </div>
      </section>
    </div>
  `;
}

async function initApp() {
  ensureRuntimeStyles();

  if (!getUser()) {
    const backendUser = await fetchCurrentBackendUser();
    if (backendUser) {
      saveUser({
        ...(getStoredUserRecord() || {}),
        ...backendUser,
        loggedIn: true,
        lastLoginAt: new Date().toISOString()
      });
    } else {
      removeAuthToken();
      loadAuthUI();
      return;
    }
  }

  if (!getAIConfig()) {
    const backendConfig = await fetchAIConfigFromBackend();
    if (backendConfig) {
      saveAIConfig(backendConfig);
    }
  }

  if (!getAIConfig()) {
    loadSetupUI();
    return;
  }

  if (!getCourse()) {
    loadCourseUI();
    return;
  }

  if (!getResultForCurrentCourse()) {
    loadCourseUI();
    return;
  }

  loadDashboardUI();
}

function reloadApp() {
  initApp();
}

function resetApp() {
  if (!window.confirm("Reset the app and clear all study data?")) return;
  clearAllData();
  removeAuthToken();
  authMode = "login";
  dashboardSearchQuery = "";
  historySearchQuery = "";
  customUploadedMaterials = [];
  assistantImageAttachment = "";
  stopProcessingSteps();
  initApp();
}

function logout() {
  removeUser();
  removeAuthToken();
  dashboardSearchQuery = "";
  historySearchQuery = "";
  customUploadedMaterials = [];
  assistantImageAttachment = "";
  stopProcessingSteps();
  showToast("Logged out successfully.", "success");
  loadAuthUI();
}

function loadAuthUI(mode = "login") {
  authMode = mode;

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card">
        <p class="eyebrow">Upgrade Your Study</p>
        <h1>Study flow, AI setup, smart questions, history, and skill testing in one vanilla JS app.</h1>
        <p class="subtitle">Login or create your local account to continue.</p>
      </section>

      <section class="panel-card">
        <h2>${authMode === "signup" ? "Create account" : "Login"}</h2>
        <p class="subtitle">${authMode === "signup" ? "Use a real name with letters/spaces only, a valid email, and a password of 6+ characters." : "Login with your registered email and password."}</p>
        ${authMode === "signup" ? '<input id="auth-name" type="text" placeholder="Full name">' : ""}
        <input id="auth-email" type="email" placeholder="Email">
        <input id="auth-password" type="password" placeholder="Password">

        <div class="action-row">
          <button class="inline-btn" onclick="handleAuth()">${authMode === "signup" ? "Create Account" : "Login"}</button>
          <button class="btn-secondary inline-btn" onclick="toggleAuthMode()">${authMode === "signup" ? "Switch to Login" : "Switch to Signup"}</button>
        </div>
      </section>
    </div>
  `;
}

function toggleAuthMode() {
  loadAuthUI(authMode === "signup" ? "login" : "signup");
}

function validateSignupInputs({ name, email, password }) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namePattern = /^[A-Za-z][A-Za-z\s]{1,48}[A-Za-z]$/;
  const hasAlphabet = /[a-z]/i.test(normalizedEmail);

  if (!normalizedName) {
    return "Full name is required.";
  }

  if (normalizedName.length < 3) {
    return "Full name must be at least 3 characters long.";
  }

  if (!namePattern.test(normalizedName)) {
    return "Full name should contain only letters and spaces.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  if (!hasAlphabet) {
    return "Email must include at least one letter.";
  }

  if (normalizedPassword.length < 6) {
    return "Password must be at least 6 characters long.";
  }

  return "";
}

function validateProfileInputs({ name, email }) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namePattern = /^[A-Za-z][A-Za-z\s]{1,48}[A-Za-z]$/;

  if (!normalizedName) {
    return "Full name is required.";
  }

  if (normalizedName.length < 3) {
    return "Full name must be at least 3 characters long.";
  }

  if (!namePattern.test(normalizedName)) {
    return "Full name should contain only letters and spaces.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  if (!/[a-z]/i.test(normalizedEmail)) {
    return "Email must include at least one letter.";
  }

  return "";
}

function getUserInitials(name) {
  return String(name || "Student")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "S";
}

function renderAvatarMarkup(user, size = 52) {
  const avatarUrl = String(user?.avatarUrl || "").trim();
  const initials = escapeHtml(getUserInitials(user?.name || "Student"));
  const inlineSize = `width:${size}px;height:${size}px;`;

  if (avatarUrl) {
    return `<img src="${escapeHtml(avatarUrl)}" alt="Profile avatar" style="${inlineSize} border-radius:50%; object-fit:cover; border:1px solid rgba(148, 163, 184, 0.18); box-shadow:0 10px 24px rgba(2,8,23,0.28);">`;
  }

  return `<div style="${inlineSize} display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:linear-gradient(135deg, rgba(99,102,241,0.78), rgba(34,197,94,0.72)); color:#fff; font-weight:800; letter-spacing:0.04em; box-shadow:0 10px 24px rgba(2,8,23,0.28);">${initials}</div>`;
}

async function handleAuth() {
  const name = authMode === "signup" ? $("auth-name")?.value.trim() : "";
  const email = $("auth-email")?.value.trim().toLowerCase();
  const password = $("auth-password")?.value.trim();

  if (!email || !password || (authMode === "signup" && !name)) {
    showToast("Please fill all required fields.", "error");
    return;
  }

  if (authMode === "signup") {
    const validationError = validateSignupInputs({ name, email, password });
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
  }

  try {
    const payload = authMode === "signup"
      ? await signupWithBackend({ name, email, password })
      : await loginWithBackend({ email, password });

    saveAuthToken(payload.token || "");
    saveUser({
      ...(getStoredUserRecord() || {}),
      ...(payload.user || {}),
      password,
      loggedIn: true,
      lastLoginAt: new Date().toISOString()
    });

    showToast(authMode === "signup" ? "Account created successfully." : `Welcome back, ${payload.user?.name || "Student"}.`, "success");
    await initApp();
  } catch (error) {
    showToast(error.message || "Authentication failed.", "error");
  }
}

function loadSetupUI() {
  const config = getAIConfig() || {};

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <p class="eyebrow">AI Setup</p>
            <h1>Select provider, model, and API key</h1>
          </div>
          <button class="btn-secondary inline-btn" onclick="getUser() ? loadCourseUI() : loadAuthUI()">Back</button>
        </div>
        <p class="subtitle">You can change settings anytime without logging out.</p>
      </section>

      <section class="panel-card">
        <select id="provider" onchange="updateModels()">
          <option value="">Select provider</option>
          <option value="gemini" ${config.provider === "gemini" ? "selected" : ""}>Gemini</option>
          <option value="openai" ${config.provider === "openai" ? "selected" : ""}>OpenAI</option>
          <option value="groq" ${config.provider === "groq" ? "selected" : ""}>Groq</option>
        </select>
        <select id="model"></select>
        <input id="apiKeyInput" type="password" placeholder="Paste API key" value="${escapeHtml(config.apiKey || "")}">

        <div class="action-row">
          <button class="inline-btn" onclick="handleSetup()">Save Settings</button>
          <button class="btn-secondary inline-btn" onclick="getCourse() ? loadDashboardUI() : loadCourseUI()">Cancel</button>
        </div>
      </section>
    </div>
  `;

  updateModels();
  if (config.model) $("model").value = config.model;
  if (config.provider === "gemini" && $("model") && !$("model").value) {
    $("model").value = normalizeGeminiModel(config.model);
  }
}

function openSettings() {
  loadSetupUI();
}

async function openProfileManagement() {
  const user = getUser();
  const profile = await fetchProfileFromBackend();
  const currentName = profile?.name || user?.name || "";
  const currentEmail = profile?.email || user?.email || "";
  profileAvatarDraft = profile?.avatarUrl || user?.avatarUrl || "";

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <div class="icon-heading">
              ${iconBadge("settings")}
              <div>
                <p class="eyebrow">Profile Management</p>
                <h1>Manage your account details</h1>
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Dashboard</button>
          </div>
        </div>
        <p class="subtitle">Update your name, email, and password without losing your account data.</p>
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <h2>Profile Details</h2>
          <p class="subtitle">Keep your account information up to date.</p>
          <div class="icon-heading" style="margin-top:16px;">
            <div id="profile-avatar-preview">${renderAvatarMarkup({ name: currentName || "Student", avatarUrl: profileAvatarDraft }, 72)}</div>
            <div>
              <p class="small">Avatar</p>
              <input id="profile-avatar-file" type="file" accept="image/*" onchange="handleProfileAvatarUpload(event)">
            </div>
          </div>
          <input id="profile-name" type="text" placeholder="Full name" value="${escapeHtml(currentName)}">
          <input id="profile-email" type="email" placeholder="Email" value="${escapeHtml(currentEmail)}">

          <div class="action-row">
            <button id="profile-save-btn" class="inline-btn" onclick="saveProfileChanges()">Save Profile</button>
          </div>
        </article>

        <article class="panel-card">
          <h2>Change Password</h2>
          <p class="subtitle">Use your current password to set a new one.</p>
          <input id="current-password" type="password" placeholder="Current password">
          <input id="new-password" type="password" placeholder="New password">
          <input id="confirm-new-password" type="password" placeholder="Confirm new password">

          <div class="action-row">
            <button id="password-save-btn" class="inline-btn" onclick="savePasswordChanges()">Update Password</button>
          </div>
        </article>
      </section>
    </div>
  `;
}

async function handleProfileAvatarUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  try {
    profileAvatarDraft = await readFileAsDataUrl(file);
    const preview = $("profile-avatar-preview");
    if (preview) {
      preview.innerHTML = renderAvatarMarkup({
        name: $("profile-name")?.value.trim() || getUser()?.name || "Student",
        avatarUrl: profileAvatarDraft
      }, 72);
    }
  } catch (error) {
    profileAvatarDraft = getUser()?.avatarUrl || "";
    showToast(error.message || "Unable to read avatar image.", "error");
  }
}

async function saveProfileChanges() {
  const name = $("profile-name")?.value.trim() || "";
  const email = $("profile-email")?.value.trim().toLowerCase() || "";
  const validationError = validateProfileInputs({ name, email });

  if (validationError) {
    showToast(validationError, "error");
    return;
  }

  try {
    setButtonLoading("profile-save-btn", true, "Saving...");
    const payload = await updateProfileInBackend({ name, email, avatarUrl: profileAvatarDraft });
    saveAuthToken(payload.token || getAuthToken());
    saveUser({
      ...(getStoredUserRecord() || {}),
      ...(payload.data || {}),
      loggedIn: true,
      lastLoginAt: new Date().toISOString()
    });
    showToast("Profile updated successfully.", "success");
    await openProfileManagement();
  } catch (error) {
    showToast(error.message || "Unable to update profile.", "error");
    setButtonLoading("profile-save-btn", false);
  }
}

async function savePasswordChanges() {
  const currentPassword = $("current-password")?.value.trim() || "";
  const newPassword = $("new-password")?.value.trim() || "";
  const confirmPassword = $("confirm-new-password")?.value.trim() || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast("Please fill all password fields.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showToast("New password must be at least 6 characters long.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("New password and confirm password must match.", "error");
    return;
  }

  try {
    setButtonLoading("password-save-btn", true, "Updating...");
    await changePasswordInBackend({
      currentPassword,
      newPassword
    });
    saveUser({
      ...(getStoredUserRecord() || {}),
      password: newPassword,
      loggedIn: true,
      lastLoginAt: new Date().toISOString()
    });
    showToast("Password updated successfully.", "success");
    $("current-password").value = "";
    $("new-password").value = "";
    $("confirm-new-password").value = "";
    setButtonLoading("password-save-btn", false);
  } catch (error) {
    showToast(error.message || "Unable to update password.", "error");
    setButtonLoading("password-save-btn", false);
  }
}

function updateModels() {
  const provider = $("provider")?.value || "";
  const modelSelect = $("model");
  if (!modelSelect) return;

  const models = getModelsForProvider(provider);
  modelSelect.innerHTML = ['<option value="">Select model</option>', ...models.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`)].join("");

  const current = getAIConfig();
  if (current?.provider === provider && current?.model) {
    const currentModel = provider === "gemini" ? normalizeGeminiModel(current.model) : current.model;
    if (models.includes(currentModel)) {
      modelSelect.value = currentModel;
    }
  }
}

async function handleSetup() {
  const provider = $("provider")?.value || "";
  const model = $("model")?.value || "";
  const apiKey = $("apiKeyInput")?.value.trim() || "";

  if (!provider || !model || !apiKey) {
    showToast("Provider, model, and API key are all required.", "error");
    return;
  }

  const config = saveAIConfig({ provider, model, apiKey, updatedAt: new Date().toISOString() });
  await syncAIConfigToBackend(config, getStoredUserRecord());
  showToast("AI settings saved locally and in backend.", "success");
  getCourse() ? loadDashboardUI() : loadCourseUI();
}

async function getBcaCatalog() {
  if (bcaCatalogCache) return bcaCatalogCache;

  try {
    const response = await fetch("data/bca_subjects.json");
    if (!response.ok) throw new Error("Unable to fetch BCA subjects.");
    bcaCatalogCache = await response.json();
  } catch (error) {
    bcaCatalogCache = BCA_SUBJECTS_FALLBACK;
  }

  return bcaCatalogCache;
}

function getSemesterSubjects(catalog, semester) {
  const bucket = catalog?.[String(semester)]?.subjects || [];
  return Array.isArray(bucket) ? bucket : [];
}

async function getBcaSyllabusViewData() {
  if (bcaSyllabusViewCache) return bcaSyllabusViewCache;

  try {
    const response = await fetch("data/syllabus.json");
    if (!response.ok) throw new Error("Unable to load BCA syllabus.");
    bcaSyllabusViewCache = await response.json();
  } catch (error) {
    bcaSyllabusViewCache = null;
  }

  return bcaSyllabusViewCache;
}

function getSelectedBcaSyllabusSubjects(semesterData, selectedNames) {
  const names = new Set(selectedNames || []);
  const allSubjects = Array.isArray(semesterData?.subjects) ? semesterData.subjects : [];
  return allSubjects.filter((subject) => names.size === 0 || names.has(subject.name));
}

function renderSubjectMarkLabel(subject) {
  if (!subject) return "";
  return `${subject.code || ""} • ${subject.internal || 0}/${subject.external || 0}/${subject.total || 0}`;
}

function getUiIcon(name) {
  const icons = {
    graduation: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6"></path><path d="M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>`,
    history: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>`,
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"></path></svg>`,
    bot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-1.95 1.57l-.2.9a2 2 0 0 1-2.26 1.55l-.91-.12a2 2 0 0 0-2.12 1.17l-.22.4a2 2 0 0 0 .33 2.39l.61.67a2 2 0 0 1 0 2.69l-.61.67a2 2 0 0 0-.33 2.39l.22.4a2 2 0 0 0 2.12 1.17l.91-.12a2 2 0 0 1 2.26 1.55l.2.9A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 1.95-1.57l.2-.9a2 2 0 0 1 2.26-1.55l.91.12a2 2 0 0 0 2.12-1.17l.22-.4a2 2 0 0 0-.33-2.39l-.61-.67a2 2 0 0 1 0-2.69l.61-.67a2 2 0 0 0 .33-2.39l-.22-.4a2 2 0 0 0-2.12-1.17l-.91.12a2 2 0 0 1-2.26-1.55l-.2-.9A2 2 0 0 0 12.22 2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    plan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>`,
    question: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path><circle cx="12" cy="12" r="10"></circle></svg>`,
    test: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path></svg>`,
    chart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>`
  };

  return icons[name] || icons.sparkles;
}

function iconBadge(name) {
  return `<span class="section-icon">${getUiIcon(name)}</span>`;
}

function buildContinueLabel() {
  if (getResultForCurrentCourse()) return "Continue Recent";
  if (getCourse()) return "Resume Course";
  return "Start Learning";
}

function continueRecentJourney() {
  if (getResultForCurrentCourse()) {
    loadDashboardUI();
    return;
  }

  if (getCourse()) {
    startAIProcessing();
    return;
  }

  loadCourseUI();
}

function loadCourseUI() {
  const course = getCourse();
  const hasRecents = getAllRecents().length > 0;

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <p class="eyebrow">Course Selection</p>
            <h1>Choose how you want to study</h1>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Dashboard</button>
        </div>
        <p class="subtitle">Continue recent work, choose BCA, create a custom course, or use the assistant.</p>
      </section>

      <section class="dashboard-grid">
        <article class="content-card">
          <div class="icon-heading">
            ${iconBadge("sparkles")}
            <div>
              <h3>${escapeHtml(buildContinueLabel())}</h3>
              <p class="small">Resume flow</p>
            </div>
          </div>
          <p class="subtitle">Jump back to the latest active learning flow.</p>
          <button class="inline-btn" onclick="continueRecentJourney()">${escapeHtml(buildContinueLabel())}</button>
        </article>

        <article class="content-card">
          <div class="icon-heading">
            ${iconBadge("history")}
            <div>
              <h3>See All Recent</h3>
              <p class="small">Search activity</p>
            </div>
          </div>
          <p class="subtitle">Open the full recent activity history with instant search.</p>
          <button class="btn-secondary inline-btn" onclick="loadHistoryView()" ${hasRecents ? "" : "disabled"}>Open History</button>
        </article>

        ${course ? `
          <article class="content-card">
            <h3>Current Course</h3>
            <p class="subtitle">${escapeHtml(course.label)}</p>
            <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Open Dashboard</button>
          </article>
        ` : ""}
      </section>

      <section class="dashboard-grid">
        <article class="content-card">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="width:48px; height:48px; display:inline-flex; align-items:center; justify-content:center; border-radius:16px; background:linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(34, 197, 94, 0.16)); color:#a5b4fc; border:1px solid rgba(148, 163, 184, 0.14);">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <div>
          <h3>BCA (DDU)</h3>
              <p class="small">Structured semester flow</p>
            </div>
          </div>
          <p class="subtitle">Semester and subject-based study pack generation.</p>
          <button class="inline-btn" onclick="selectBCA()">Choose BCA</button>
        </article>

        <article class="content-card">
          <div class="icon-heading">
            ${iconBadge("folder")}
            <div>
              <h3>Other Course</h3>
              <p class="small">Custom upload flow</p>
            </div>
          </div>
          <p class="subtitle">Add course, subjects, notes, and upload syllabus or PYQs.</p>
          <button class="inline-btn" onclick="selectCustom()">Choose Custom</button>
        </article>

        <article class="content-card">
          <div class="icon-heading">
            ${iconBadge("bot")}
            <div>
              <h3>AI Assistant</h3>
              <p class="small">Chat and image help</p>
            </div>
          </div>
          <p class="subtitle">Open chat mode with optional image analysis.</p>
          <button class="inline-btn" onclick="openAssistant()">Open Assistant</button>
        </article>
      </section>
    </div>
  `;
}

async function selectBCA() {
  const catalog = await getBcaCatalog();
  const syllabus = await getBcaSyllabusViewData();
  const current = getCourse();
  const semester = current?.type === "bca" ? current.semester : "1";
  const selectedSubjects = current?.type === "bca" ? current.subjects : getSemesterSubjects(catalog, semester).map((item) => item.name);
  const practicalInfo = syllabus?.program?.evaluation?.practicalSemesters1to5;
  const projectInfo = syllabus?.program?.evaluation?.projectSemester6;

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <p class="eyebrow">BCA Flow</p>
            <h1>Select semester and subjects</h1>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Back</button>
        </div>
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <h2>Semester</h2>
          <select id="semester" onchange="updateBcaSubjectPicker()">
            ${[1, 2, 3, 4, 5, 6].map((item) => `<option value="${item}" ${String(item) === String(semester) ? "selected" : ""}>Semester ${item}</option>`).join("")}
          </select>

          <div class="action-row">
            <button class="inline-btn" onclick="confirmBCA()">Start AI Processing</button>
            <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Cancel</button>
          </div>
        </article>

        <article class="panel-card">
          <h2>Subjects</h2>
          <div id="bca-subjects-list" class="checklist"></div>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="panel-card">
          <h2>Semester Evaluation</h2>
          <p class="small">Theory papers usually follow 30 internal + 70 external. Semester total is 500 marks.</p>
          <p class="small" style="margin-top:12px;">Semesters 1-5 practical: Practical ${practicalInfo?.practical || 60}, Record ${practicalInfo?.record || 20}, Viva ${practicalInfo?.vivaVoce || 20}.</p>
          <p class="small" style="margin-top:12px;">Semester 6 project: Report ${projectInfo?.projectReport || 150}, Presentation/Viva ${projectInfo?.presentationViva || 150}.</p>
        </article>

        <article class="panel-card">
          <h2>Division Rules</h2>
          <p class="small">First Division: 60% and above</p>
          <p class="small" style="margin-top:12px;">Second Division: 45% and above but below 60%</p>
          <p class="small" style="margin-top:12px;">Third Division: Minimum pass marks in each semester</p>
        </article>
      </section>
    </div>
  `;

  updateBcaSubjectPicker(selectedSubjects);
}

async function updateBcaSubjectPicker(preselected = null) {
  const catalog = await getBcaCatalog();
  const syllabus = await getBcaSyllabusViewData();
  const semester = $("semester")?.value || "1";
  const subjects = getSemesterSubjects(catalog, semester);
  const semesterData = syllabus?.semesters?.[String(semester)];
  const detailedMap = new Map((semesterData?.subjects || []).map((subject) => [subject.name, subject]));
  const checkedSet = new Set(Array.isArray(preselected) && preselected.length ? preselected : subjects.map((item) => item.name));
  const target = $("bca-subjects-list");
  if (!target) return;

  target.innerHTML = subjects
    .map((subject, index) => {
      const detail = detailedMap.get(subject.name) || subject;
      return `
      <label class="subject-choice ${checkedSet.has(subject.name) ? "active" : ""}" style="flex-direction:column; align-items:flex-start;">
        <div style="display:flex; align-items:center; gap:12px; width:100%;">
          <input type="checkbox" class="bca-subject" value="${escapeHtml(subject.name)}" ${checkedSet.has(subject.name) ? "checked" : ""} onchange="this.parentElement.parentElement.classList.toggle('active', this.checked)">
          <span class="option-letter">${index + 1}</span>
          <span>${escapeHtml(subject.name)} <span class="small">(${escapeHtml(subject.code || "")})</span></span>
        </div>
        <span class="small">${escapeHtml(renderSubjectMarkLabel(detail))}</span>
      </label>
    `;
    })
    .join("");
}

function confirmBCA() {
  const semester = $("semester")?.value || "";
  const subjectElements = Array.from(document.querySelectorAll(".bca-subject:checked"));
  const subjects = subjectElements.map((element) => element.value);

  if (!semester || !subjects.length) {
    showToast("Choose a semester and at least one subject.", "error");
    return;
  }

  const course = saveCourse({
    type: "bca",
    semester,
    subjects,
    label: `BCA Semester ${semester}`
  });

  removeAIResult();
  saveRecent({
    id: uid("recent-course"),
    type: "course-start",
    title: `Started ${course.label}`,
    question: subjects.join(", "),
    time: nowLabel()
  });

  startAIProcessing();
}

function renderCustomMaterialList() {
  const target = $("custom-files-preview");
  if (!target) return;

  target.innerHTML = customUploadedMaterials.length
    ? customUploadedMaterials
        .map((item) => `
          <article class="upload-card">
            <div class="upload-meta">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="small">${escapeHtml(item.type || "text")}</span>
            </div>
            <p class="small">${escapeHtml(item.content.slice(0, 180))}${item.content.length > 180 ? "..." : ""}</p>
          </article>
        `)
        .join("")
    : `<p class="subtitle">No files uploaded yet.</p>`;
}

function selectCustom() {
  const current = getCourse();
  customUploadedMaterials = current?.type === "custom" ? current.materials || [] : [];

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <p class="eyebrow">Custom Course</p>
            <h1>Add your course, subjects, and supporting files</h1>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Back</button>
        </div>
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <input id="course-name" type="text" placeholder="Course name" value="${escapeHtml(current?.type === "custom" ? current.name : "")}">
          <input id="course-subjects" type="text" placeholder="Subjects, separated by commas" value="${escapeHtml(current?.type === "custom" ? current.subjects.join(", ") : "")}">
          <textarea id="course-notes" placeholder="Optional notes, syllabus summary, exam pattern, or learning goal">${escapeHtml(current?.notes || "")}</textarea>
          <input id="custom-files" type="file" multiple onchange="handleCustomFileUpload(event)">

          <div class="action-row">
            <button class="inline-btn" onclick="confirmCustom()">Start AI Processing</button>
            <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Cancel</button>
          </div>
        </article>

        <article class="panel-card">
          <h2>Uploaded Materials</h2>
          <div id="custom-files-preview" class="option-list"></div>
        </article>
      </section>
    </div>
  `;

  renderCustomMaterialList();
}

async function handleCustomFileUpload(event) {
  const files = Array.from(event.target?.files || []);
  if (!files.length) return;

  const parsed = [];

  for (const file of files) {
    try {
      const content = await readFileAsText(file);
      parsed.push({
        name: file.name,
        type: file.type || "text/plain",
        content: content.slice(0, 6000)
      });
    } catch (error) {
      showToast(error.message || `Unable to read ${file.name}`, "error");
    }
  }

  customUploadedMaterials = [...customUploadedMaterials, ...parsed].slice(0, 5);
  renderCustomMaterialList();
  showToast(`${parsed.length} file(s) added.`, "success");
}

function confirmCustom() {
  const name = $("course-name")?.value.trim() || "";
  const subjects = ($("course-subjects")?.value || "").split(",").map((item) => item.trim()).filter(Boolean);
  const notes = $("course-notes")?.value.trim() || "";

  if (!name || !subjects.length) {
    showToast("Add a course name and at least one subject.", "error");
    return;
  }

  const course = saveCourse({
    type: "custom",
    name,
    subjects,
    notes,
    materials: customUploadedMaterials,
    label: name
  });

  removeAIResult();
  saveRecent({
    id: uid("recent-course"),
    type: "course-start",
    title: `Started ${course.label}`,
    question: subjects.join(", "),
    time: nowLabel()
  });

  startAIProcessing();
}

function getAssistantMessages() {
  return getAIResult()?.meta?.assistantMessages || [];
}

function usePredictedQuestion(question) {
  const input = $("assistant-message");
  if (!input) return;

  input.value = question || "";
  input.focus();
}

function openAssistant() {
  const course = getCourse();
  const assistantTopic = course?.type === "assistant" ? course.prompt : "";
  const messages = getAssistantMessages();
  const predictedNextQuestions = getAIResult()?.meta?.latestPredictedNextQuestions || [];

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <div class="icon-heading">
              ${iconBadge("bot")}
              <div>
                <p class="eyebrow">AI Assistant</p>
                <h1>Chat with optional image analysis</h1>
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Back</button>
            <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Dashboard</button>
          </div>
        </div>
        <p class="subtitle">Use this for a quick concept explanation, exam doubt, or visual study analysis.</p>
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <input id="assistant-topic" type="text" placeholder="Main study topic" value="${escapeHtml(assistantTopic)}">
          <textarea id="assistant-message" placeholder="Ask anything about this topic..."></textarea>
          <input id="assistant-image" type="file" accept="image/*" onchange="handleAssistantImageUpload(event)">
          <div id="assistant-image-preview"></div>

          <div class="action-row">
            <button id="assistant-send-btn" class="inline-btn" onclick="sendAssistantMessage()">Send</button>
            <button class="btn-secondary inline-btn" onclick="generatePackFromAssistant()">Generate Study Pack</button>
          </div>
        </article>

        <article class="panel-card">
          <h2>Assistant Chat</h2>
          <div class="insight-card">
            <div class="section-title-row">
              <h3>Predicted Next Questions</h3>
              <span class="small">Based on your recent activity</span>
            </div>
            ${
              predictedNextQuestions.length
                ? `
                  <div class="chip-row">
                    ${predictedNextQuestions
                      .map(
                        (item) => `
                          <button
                            type="button"
                            class="btn-secondary chip-btn"
                            onclick="usePredictedQuestion(decodeURIComponent('${encodeURIComponent(item)}'))"
                          >
                            ${escapeHtml(item)}
                          </button>
                        `
                      )
                      .join("")}
                  </div>
                `
                : `<p class="subtitle">Use the assistant a bit more and I will surface likely next doubts here.</p>`
            }
          </div>
          <div class="chat-list">
            ${
              messages.length
                ? messages
                    .map((item) => `
                      <article class="chat-bubble ${escapeHtml(item.role)}">
                        <div class="chat-meta">
                          <strong>${escapeHtml(capitalize(item.role))}</strong>
                          <span class="small">${escapeHtml(item.time || "")}</span>
                        </div>
                        <pre style="white-space: pre-wrap; font-family: inherit; color: inherit;">${escapeHtml(item.text || "")}</pre>
                      </article>
                    `)
                    .join("")
                : `<p class="subtitle">No messages yet. Start the conversation from the left panel.</p>`
            }
          </div>
        </article>
      </section>
    </div>
  `;

  renderAssistantImagePreview();
}

async function handleAssistantImageUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) {
    assistantImageAttachment = "";
    renderAssistantImagePreview();
    return;
  }

  try {
    assistantImageAttachment = await readFileAsDataUrl(file);
    renderAssistantImagePreview();
  } catch (error) {
    assistantImageAttachment = "";
    showToast(error.message || "Unable to read the selected image.", "error");
  }
}

function renderAssistantImagePreview() {
  const target = $("assistant-image-preview");
  if (!target) return;

  target.innerHTML = assistantImageAttachment
    ? `<img class="preview-image" src="${assistantImageAttachment}" alt="Assistant upload preview">`
    : `<p class="small">Optional: attach an image for visual analysis.</p>`;
}

async function sendAssistantMessage() {
  const topic = $("assistant-topic")?.value.trim() || "";
  const message = $("assistant-message")?.value.trim() || "";

  if (!topic && !message && !assistantImageAttachment) {
    showToast("Add a topic, message, or image first.", "error");
    return;
  }

  saveCourse({
    type: "assistant",
    prompt: topic || message || "general study support",
    label: `Assistant: ${topic || "Study Chat"}`
  });

  try {
    setButtonLoading("assistant-send-btn", true, "Thinking...");
    await askAssistant(message || `Please help me study ${topic}.`, {
      imageDataUrl: assistantImageAttachment
    });
    assistantImageAttachment = "";
    openAssistant();
  } catch (error) {
    showToast(error.message || "Assistant request failed.", "error");
    setButtonLoading("assistant-send-btn", false);
  }
}

function generatePackFromAssistant() {
  const topic = $("assistant-topic")?.value.trim() || "";
  const message = $("assistant-message")?.value.trim() || "";
  const prompt = topic || message;

  if (!prompt) {
    showToast("Add a topic or message first so the study pack knows what to generate.", "error");
    return;
  }

  saveCourse({
    type: "assistant",
    prompt,
    label: `Assistant: ${prompt}`
  });

  saveRecent({
    id: uid("recent-course"),
    type: "course-start",
    title: `Started Assistant study pack`,
    question: prompt,
    time: nowLabel()
  });

  startAIProcessing();
}

function goToCourse() {
  if (!getAIConfig()) {
    loadSetupUI();
    return;
  }

  loadCourseUI();
}

async function startAIProcessing() {
  if (!getAIConfig()) {
    loadSetupUI();
    return;
  }

  if (!getCourse()) {
    loadCourseUI();
    return;
  }

  stopProcessingSteps();
  let stepIndex = 0;
  renderProcessingView(stepIndex);
  processingIntervalId = setInterval(() => {
    stepIndex = Math.min(stepIndex + 1, 4);
    renderProcessingView(stepIndex);
  }, 900);

  try {
    await generateStudyContent();
    stopProcessingSteps();
    showToast("AI study pack is ready.", "success");
    loadDashboardUI();
  } catch (error) {
    stopProcessingSteps();
    showToast(error.message || "Failed to generate study content.", "error");
    loadCourseUI();
  }
}

function handleSearch(query) {
  dashboardSearchQuery = query;
  if (String(query || "").trim()) {
    void logActivityToBackend({
      action: "search",
      title: query,
      details: {
        source: "dashboard"
      }
    });
  }
  loadDashboardUI();
}

function handleHistorySearch(query) {
  historySearchQuery = query;
  if (String(query || "").trim()) {
    void logActivityToBackend({
      action: "search",
      title: query,
      details: {
        source: "history"
      }
    });
  }
  loadHistoryView();
}

function buildStudyPlanDays(result = getResultForCurrentCourse()) {
  const plan = result?.studyPlan || [];
  return plan.map((item, index) => ({
    day: index + 1,
    text: item
  }));
}

function downloadStudyPack() {
  const course = getCourse();
  const result = getResultForCurrentCourse();

  if (!course || !result) {
    showToast("Nothing to download yet.", "error");
    return;
  }

  const content = [
    `Upgrade Your Study`,
    `Course: ${course.label}`,
    ``,
    `Summary`,
    result.summary || "",
    ``,
    `Topics`,
    ...result.topics.map((item, index) => `${index + 1}. ${item}`),
    ``,
    `Questions`,
    ...result.questions.map((item, index) => `${index + 1}. ${item}`),
    ``,
    `Study Plan`,
    ...buildStudyPlanDays(result).map((item) => `Day ${item.day}: ${item.text}`),
    ``,
    `MCQs`,
    ...result.mcqs.flatMap((mcq, index) => [
      `${index + 1}. ${mcq.question}`,
      `   A. ${mcq.options[0] || ""}`,
      `   B. ${mcq.options[1] || ""}`,
      `   C. ${mcq.options[2] || ""}`,
      `   D. ${mcq.options[3] || ""}`,
      `   Answer: ${mcq.options[mcq.answer] || ""}`,
      ``
    ])
  ].join("\n");

  downloadTextFile("upgrade-your-study-pack.txt", content);
  showToast("Study pack downloaded as .txt", "success");
}

function loadStudyPlanView() {
  const result = getResultForCurrentCourse();
  if (!result) {
    showToast("Generate a study pack first.", "error");
    loadDashboardUI();
    return;
  }

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <div class="icon-heading">
              ${iconBadge("plan")}
              <div>
                <p class="eyebrow">Study Plan</p>
                <h1>7-day roadmap</h1>
              </div>
            </div>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Back</button>
        </div>
      </section>

      <section class="panel-card">
        <div class="timeline-list">
          ${buildStudyPlanDays(result)
            .map((item) => `
              <article class="timeline-card">
                <div class="top-bar">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span class="timeline-day">${item.day}</span>
                    <strong>Day ${item.day}</strong>
                  </div>
                  <span class="badge">Roadmap</span>
                </div>
                <p style="margin-top: 12px;">${escapeHtml(item.text)}</p>
              </article>
            `)
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function loadQuestionDetailView(index, options = {}) {
  const result = getResultForCurrentCourse();
  const question = result?.questions?.[index];
  if (!question) {
    showToast("Question not found.", "error");
    loadDashboardUI();
    return;
  }

  const length = options.length || "medium";
  const language = options.language || "English";
  const answerKey = buildAnswerCacheKey(question, { length, language });
  const answer = result?.answers?.[answerKey] || "";

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <div class="icon-heading">
              ${iconBadge("question")}
              <div>
                <p class="eyebrow">Question Detail</p>
                <h1>${escapeHtml(question)}</h1>
              </div>
            </div>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Back</button>
        </div>
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <h2>Explanation Settings</h2>
          <div class="search-row">
            <select id="answer-length">
              <option value="short" ${length === "short" ? "selected" : ""}>Short</option>
              <option value="medium" ${length === "medium" ? "selected" : ""}>Medium</option>
              <option value="long" ${length === "long" ? "selected" : ""}>Long</option>
            </select>
            <select id="answer-language">
              <option value="English" ${language === "English" ? "selected" : ""}>English</option>
              <option value="Hindi" ${language === "Hindi" ? "selected" : ""}>Hindi</option>
            </select>
          </div>

          <div class="action-row">
            <button id="question-answer-btn" class="inline-btn" onclick="generateQuestionAnswer(${index})">${answer ? "Regenerate Explanation" : "Generate Explanation"}</button>
            <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Dashboard</button>
          </div>
        </article>

        <article class="panel-card">
          <h2>Explanation</h2>
          ${
            answer
              ? `<pre style="white-space: pre-wrap; font-family: inherit; color: inherit;">${escapeHtml(answer)}</pre>`
              : `<p class="subtitle">Choose the answer length and language, then generate the explanation.</p>`
          }
        </article>
      </section>
    </div>
  `;
}

function handleQuestionClick(index) {
  const question = getResultForCurrentCourse()?.questions?.[index] || "";
  if (question) {
    void logActivityToBackend({
      action: "question_opened",
      title: question,
      details: {}
    });
  }
  loadQuestionDetailView(index);
}

async function generateQuestionAnswer(index) {
  const result = getResultForCurrentCourse();
  const question = result?.questions?.[index];
  if (!question) return;

  const length = $("answer-length")?.value || "medium";
  const language = $("answer-language")?.value || "English";

  try {
    setButtonLoading("question-answer-btn", true, "Generating...");
    await getAnswer(question, { length, language });
    loadQuestionDetailView(index, { length, language });
  } catch (error) {
    showToast(error.message || "Unable to generate the explanation.", "error");
    setButtonLoading("question-answer-btn", false);
  }
}

function continueRecent(itemId) {
  const item = [...getAllRecents(), ...backendHistoryCache].find((recent) => recent.id === itemId);
  if (!item) {
    loadDashboardUI();
    return;
  }

  if (item.type === "question-click" && item.question) {
    const result = getResultForCurrentCourse();
    const index = result?.questions?.findIndex((question) => question === item.question);
    if (index >= 0) {
      loadQuestionDetailView(index);
      return;
    }
  }

  if (item.type === "test-result" || item.type === "mcq-generation") {
    startTest();
    return;
  }

  if (item.type === "assistant-chat") {
    openAssistant();
    return;
  }

  loadDashboardUI();
}

async function loadHistoryView() {
  const localRecents = searchRecents(historySearchQuery).map((item) => ({
    ...item,
    source: "local"
  }));
  const backendItems = (await fetchBackendHistory(historySearchQuery))
    .map(normalizeBackendHistoryItem)
    .filter(Boolean);

  backendHistoryCache = backendItems;

  const seen = new Set();
  const recents = [...localRecents, ...backendItems]
    .filter((item) => {
      const key = `${item.type}|${item.title}|${item.question}|${item.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <div class="icon-heading">
              ${iconBadge("history")}
              <div>
                <p class="eyebrow">History</p>
                <h1>Recent activity timeline</h1>
              </div>
            </div>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadCourseUI()">Back</button>
        </div>
      </section>

      <section class="panel-card">
        <div class="search-row">
          <input type="text" placeholder="Search history..." value="${escapeHtml(historySearchQuery)}" oninput="handleHistorySearch(this.value)">
          <button class="btn-secondary inline-btn" onclick="clearDashboardRecents()">Clear Recents</button>
        </div>

        <div class="recent-list" style="margin-top:16px;">
          ${
            recents.length
              ? recents
                  .map((item) => `
                    <article class="recent-item">
                      <div class="recent-meta">
                        <span class="badge">${escapeHtml(item.type)}</span>
                        <span class="badge">${escapeHtml(item.source === "backend" ? "MongoDB" : "Local")}</span>
                        <span class="small">${escapeHtml(item.time || "")}</span>
                      </div>
                      <h3>${escapeHtml(item.title || item.question || "Untitled")}</h3>
                      ${item.question ? `<p class="small">${escapeHtml(item.question)}</p>` : ""}
                      <div class="action-row">
                        <button class="inline-btn" onclick="continueRecent('${escapeHtml(item.id)}')" ${item.source === "backend" ? "disabled" : ""}>${item.source === "backend" ? "Saved in DB" : "Continue"}</button>
                      </div>
                    </article>
                  `)
                  .join("")
              : `<p class="subtitle">No recent activity yet.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderStatusCard(title, ready, subtitle, actionLabel, actionFn) {
  return `
    <article class="stat-card ${ready ? "selected-card" : ""}">
      <span class="badge">${ready ? "Ready" : "Pending"}</span>
      <h3>${escapeHtml(title)}</h3>
      <p class="small">${escapeHtml(subtitle)}</p>
      <button class="${ready ? "btn-secondary" : ""} inline-btn" onclick="${actionFn}()">${escapeHtml(actionLabel)}</button>
    </article>
  `;
}

async function loadDashboardUI() {
  const user = getUser();
  const config = getAIConfig();
  const course = getCourse();
  const result = getResultForCurrentCourse();
  const recents = searchRecents(dashboardSearchQuery).slice(0, 8);
  const syllabus = course?.type === "bca" ? await getBcaSyllabusViewData() : null;
  const semesterData = syllabus?.semesters?.[String(course?.semester || "")];
  const selectedBcaSubjects = getSelectedBcaSyllabusSubjects(semesterData, course?.subjects || []);
  const bcaInsightsHtml = course?.type === "bca" && semesterData
    ? `
      <section class="dashboard-grid">
        <article class="panel-card">
          <h2>BCA Semester Structure</h2>
          <p class="subtitle">${escapeHtml(semesterData.title || "")} • Total ${escapeHtml(String(semesterData.totalMarks || 500))} marks</p>
          <div class="option-list" style="margin-top:16px;">
            ${selectedBcaSubjects.map((subject) => `
              <div class="content-card">
                <h3>${escapeHtml(subject.code || "")} ${escapeHtml(subject.name || "")}</h3>
                <p class="small">${escapeHtml(renderSubjectMarkLabel(subject))}</p>
                ${
                  Array.isArray(subject.units)
                    ? `<p class="small" style="margin-top:8px;">${escapeHtml(subject.units.map((unit) => unit.title).join(", "))}</p>`
                    : subject.breakup
                      ? `<p class="small" style="margin-top:8px;">${escapeHtml(Object.entries(subject.breakup).map(([key, value]) => `${key}: ${value}`).join(" • "))}</p>`
                      : ""
                }
              </div>
            `).join("")}
          </div>
        </article>

        <article class="panel-card">
          <h2>Exam Rules</h2>
          <p class="small">Practical semesters 1-5: Practical 60, Record 20, Viva 20.</p>
          <p class="small" style="margin-top:12px;">Project semester 6: Report 150, Presentation/Viva 150.</p>
          <p class="small" style="margin-top:12px;">First Division: 60% and above</p>
          <p class="small" style="margin-top:12px;">Second Division: 45% and above but below 60%</p>
        </article>
      </section>
    `
    : "";

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card">
        <div class="top-bar">
          <div>
            <p class="eyebrow">Dashboard</p>
            <div class="icon-heading" style="margin-top:8px;">
              ${renderAvatarMarkup(user, 58)}
              <div>
                <h1>Welcome, ${escapeHtml(user?.name || "Student")}</h1>
                <p class="subtitle">Login, setup, course selection, processing, dashboard, question detail, study plan, history, and skill test all stay inside this single-page app.</p>
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="inline-btn" onclick="goToCourse()">Course Flow</button>
            <button class="btn-secondary inline-btn" onclick="openProfileManagement()">Profile</button>
            <button class="btn-secondary inline-btn" onclick="openSettings()">AI Settings</button>
            <button class="btn-secondary inline-btn" onclick="logout()">Logout</button>
          </div>
        </div>
      </section>

      <section class="status-grid">
        ${renderStatusCard("AI Setup", Boolean(config), config ? `${capitalize(config.provider)} • ${config.model}` : "Provider, model, and key are not configured yet.", config ? "Edit Settings" : "Setup AI", "loadSetupUI")}
        ${renderStatusCard("Course", Boolean(course), course ? course.label : "Choose a course or assistant mode to begin.", course ? "Change Course" : "Pick Course", "loadCourseUI")}
        ${renderStatusCard("AI Study Pack", Boolean(result), result ? `${result.topics.length} topics • ${result.mcqs.length} MCQs ready` : "Generate topics, questions, MCQs, and a study plan.", result ? "Regenerate" : "Run AI", "startAIProcessing")}
      </section>

      <section class="split-grid wide">
        <article class="panel-card">
          <div class="top-bar">
            <div>
              <h2>Recent Activity</h2>
              <p class="subtitle">Instant local search across title, question, and type.</p>
            </div>
            <button class="btn-secondary inline-btn" onclick="loadHistoryView()">Open History</button>
          </div>

          <div class="search-row" style="margin-top:16px;">
            <input type="text" placeholder="Search recent activity..." value="${escapeHtml(dashboardSearchQuery)}" oninput="handleSearch(this.value)">
            <button class="btn-secondary inline-btn" onclick="clearDashboardRecents()">Clear</button>
          </div>

          <div class="recent-list" style="margin-top:16px;">
            ${
              recents.length
                ? recents.map(formatResult).join("")
                : `<p class="subtitle">No matching recent activity yet.</p>`
            }
          </div>
        </article>

        <article class="panel-card">
          <div class="icon-heading">
            ${iconBadge("sparkles")}
            <div>
              <h2>Quick Actions</h2>
              <p class="small">Core shortcuts</p>
            </div>
          </div>
          <div class="action-row">
            <button class="inline-btn" onclick="${result ? "startTest()" : "startAIProcessing()"}">${result ? "Start Skill Test" : "Generate Study Pack"}</button>
            <button class="btn-secondary inline-btn" onclick="loadStudyPlanView()" ${result ? "" : "disabled"}>Study Plan</button>
            <button class="btn-secondary inline-btn" onclick="downloadStudyPack()" ${result ? "" : "disabled"}>Download .txt</button>
            <button class="btn-secondary inline-btn" onclick="openAssistant()">Assistant</button>
          </div>
        </article>
      </section>

      ${
        result
          ? `
            ${bcaInsightsHtml}
            <section class="dashboard-grid">
              <article class="panel-card">
                <div class="icon-heading">
                  ${iconBadge("chart")}
                  <h2>Summary</h2>
                </div>
                <p class="subtitle">${escapeHtml(result.summary || "Your AI study pack is ready.")}</p>
                <div class="pill-row" style="margin-top:16px;">
                  ${result.topics.map((topic) => `<span class="pill">${escapeHtml(topic)}</span>`).join("")}
                </div>
              </article>

              <article class="panel-card">
                <div class="icon-heading">
                  ${iconBadge("plan")}
                  <h2>Study Plan Preview</h2>
                </div>
                <div class="option-list">
                  ${buildStudyPlanDays(result).slice(0, 3).map((item) => `<div class="content-card"><h3>Day ${item.day}</h3><p>${escapeHtml(item.text)}</p></div>`).join("")}
                </div>
              </article>
            </section>

            <section class="split-grid wide">
              <article class="panel-card">
                <div class="top-bar">
                  <div>
                    <div class="icon-heading">
                      ${iconBadge("question")}
                      <h2>Practice Questions</h2>
                    </div>
                    <p class="subtitle">Click any question to open detail view with answer length and language controls.</p>
                  </div>
                  <button class="btn-secondary inline-btn" onclick="loadStudyPlanView()">View Study Plan</button>
                </div>
                <div class="option-list" style="margin-top:16px;">
                  ${result.questions.map((question, index) => `
                    <button class="question-button" onclick="handleQuestionClick(${index})">
                      <span class="badge">Q${index + 1}</span>
                      <span>${escapeHtml(question)}</span>
                    </button>
                  `).join("")}
                </div>
              </article>

              <article class="panel-card">
                <div class="top-bar">
                  <div>
                    <div class="icon-heading">
                      ${iconBadge("test")}
                      <h2>MCQ Skill Test</h2>
                    </div>
                    <p class="subtitle">Run the test, get scored review, then keep going with more MCQs.</p>
                  </div>
                  <button class="inline-btn" onclick="startTest()">Start Skill Test</button>
                </div>
                <div class="option-list" style="margin-top:16px;">
                  ${result.mcqs.slice(0, 3).map((mcq, index) => `<div class="content-card"><h3>MCQ ${index + 1}</h3><p>${escapeHtml(mcq.question)}</p></div>`).join("")}
                </div>
              </article>
            </section>
          `
          : renderEmptyState(
              "No study pack yet",
              "Choose a course flow and start AI processing to generate topics, questions, MCQs, and a study plan.",
              `<div class="action-row" style="margin-top:16px;"><button class="inline-btn" onclick="goToCourse()">Open Course Flow</button></div>`
            )
      }
    </div>
  `;
}

function clearDashboardRecents() {
  clearRecents();
  dashboardSearchQuery = "";
  historySearchQuery = "";
  showToast("Recent activity cleared.", "success");
  loadDashboardUI();
}

document.addEventListener("DOMContentLoaded", initApp);
