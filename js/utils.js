function $(id) {
  return document.getElementById(id);
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function capitalize(text) {
  const value = String(text || "").trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function nowLabel() {
  return new Date().toLocaleString();
}

function uid(prefix = "uys") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function courseSignature(course) {
  return JSON.stringify({
    type: course?.type || "",
    name: course?.name || "",
    semester: course?.semester || "",
    subjects: Array.isArray(course?.subjects) ? course.subjects : [],
    prompt: course?.prompt || ""
  });
}

function showLoader(text = "Loading...", subtitle = "Please wait while we prepare your study space.") {
  const app = $("app");
  if (!app) return;

  app.innerHTML = `
    <div class="container app-shell">
      <div class="hero-card compact">
        <div class="loader"></div>
        <h1>${escapeHtml(text)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
      </div>
    </div>
  `;
}

function ensureToastRoot() {
  let root = $("uys-toast-root");
  if (root) return root;

  root = document.createElement("div");
  root.id = "uys-toast-root";
  root.className = "toast-root";
  document.body.appendChild(root);
  return root;
}

function showToast(message, type = "info") {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));
  window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => toast.remove(), 180);
  }, 2400);
}

function setButtonLoading(buttonId, isLoading, loadingText = "Working...") {
  const button = typeof buttonId === "string" ? $(buttonId) : buttonId;
  if (!button) return;

  if (!button.dataset.label) {
    button.dataset.label = button.textContent;
  }

  button.disabled = Boolean(isLoading);
  button.classList.toggle("is-loading", Boolean(isLoading));
  button.textContent = isLoading ? loadingText : button.dataset.label;
}

function searchRecents(query, source = getAllRecents()) {
  const list = Array.isArray(source) ? source : [];
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return list;

  return list.filter((item) => {
    const haystack = [
      item.title,
      item.question,
      item.type
    ]
      .map(normalizeText)
      .join(" ");

    return haystack.includes(normalizedQuery);
  });
}

function formatResult(item) {
  return `
    <article class="recent-item">
      <div class="recent-meta">
        <span class="badge">${escapeHtml(item.type || "activity")}</span>
        <span class="small">${escapeHtml(item.time || "")}</span>
      </div>
      <h3>${escapeHtml(item.title || item.question || "Untitled")}</h3>
      ${item.question ? `<p class="small">${escapeHtml(item.question)}</p>` : ""}
    </article>
  `;
}

function stripCodeFences(text) {
  return String(text || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonObject(text) {
  const clean = stripCodeFences(text);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI returned an invalid JSON response.");
  }

  return clean.slice(start, end + 1);
}

function renderEmptyState(title, subtitle, actionHtml = "") {
  return `
    <div class="hero-card compact">
      <h2>${escapeHtml(title)}</h2>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      ${actionHtml}
    </div>
  `;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read file: ${file?.name || "unknown"}`));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read file: ${file?.name || "unknown"}`));
    reader.readAsDataURL(file);
  });
}

function resizeImageFileAsDataUrl(file, maxSize = 256, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const longestSide = Math.max(image.width, image.height) || 1;
        const scale = Math.min(1, maxSize / longestSide);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process avatar image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.onerror = () => reject(new Error(`Unable to process file: ${file?.name || "unknown"}`));
      image.src = String(reader.result || "");
    };

    reader.onerror = () => reject(new Error(`Unable to read file: ${file?.name || "unknown"}`));
    reader.readAsDataURL(file);
  });
}

function downloadTextFile(filename, content) {
  const blob = new Blob([String(content || "")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

let sessionExpiredNoticeShown = false;

function getBackendBaseUrl() {
  if (window.UYS_BACKEND_URL) {
    return String(window.UYS_BACKEND_URL).trim().replace(/\/+$/, "");
  }

  if (window.location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return window.location.origin.replace(/\/+$/, "");
}

function buildAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function handleUnauthorizedResponse(response) {
  if (response?.status !== 401) return false;

  removeAuthToken();
  removeUser();

  if (!sessionExpiredNoticeShown) {
    sessionExpiredNoticeShown = true;
    showToast("Session expired. Please login again.", "error");
    window.setTimeout(() => {
      sessionExpiredNoticeShown = false;
    }, 1500);
  }

  if (typeof loadAuthUI === "function") {
    loadAuthUI();
  }

  return true;
}

async function saveToBackend(payload) {
  const backendUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${backendUrl}/api/save`, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Backend save failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend sync skipped:", error.message);
    return null;
  }
}

async function syncUserProfileToBackend(user = getStoredUserRecord()) {
  const backendUrl = getBackendBaseUrl();
  const email = String(user?.email || "").trim().toLowerCase();

  if (!email) return null;

  try {
    const response = await fetch(`${backendUrl}/api/user/upsert`, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        name: String(user?.name || "Student").trim() || "Student",
        email,
        password: String(user?.password || "").trim()
      })
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Unable to sync user profile");
    }

    return await response.json();
  } catch (error) {
    console.warn("User profile sync skipped:", error.message);
    return null;
  }
}

async function syncAIConfigToBackend(config = getAIConfig(), user = getStoredUserRecord()) {
  const backendUrl = getBackendBaseUrl();
  const email = String(user?.email || "").trim().toLowerCase();
  const provider = String(config?.provider || "").trim().toLowerCase();
  const model = String(config?.model || "").trim();
  const apiKey = String(config?.apiKey || "").trim();

  if (!email || !provider || !model || !apiKey) return null;

  try {
    const response = await fetch(`${backendUrl}/api/user/ai-config`, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        name: String(user?.name || "Student").trim() || "Student",
        provider,
        model,
        apiKey
      })
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Unable to sync AI config");
    }

    return payload;
  } catch (error) {
    console.warn("AI config sync skipped:", error.message);
    return null;
  }
}

async function fetchAIConfigFromBackend(user = getStoredUserRecord()) {
  const backendUrl = getBackendBaseUrl();
  if (!getAuthToken()) return null;

  try {
    const response = await fetch(`${backendUrl}/api/user/ai-config`, {
      headers: buildAuthHeaders()
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Unable to fetch AI config");
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch (error) {
    console.warn("AI config fetch skipped:", error.message);
    return null;
  }
}

async function requestAIThroughBackend(prompt, options = {}, config = getAIConfig(), user = getStoredUserRecord()) {
  const backendUrl = getBackendBaseUrl();

  const response = await fetch(`${backendUrl}/api/ai/generate`, {
    method: "POST",
    headers: buildAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      provider: String(config?.provider || "").trim().toLowerCase(),
      model: String(config?.model || "").trim(),
      apiKey: String(config?.apiKey || "").trim(),
      prompt,
      expectJson: Boolean(options.expectJson),
      imageDataUrl: String(options.imageDataUrl || "").trim()
    })
  });

  if (await handleUnauthorizedResponse(response)) {
    throw new Error("Session expired. Please login again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !String(payload?.text || "").trim()) {
    throw new Error(payload?.message || "Backend AI request failed");
  }

  return String(payload.text).trim();
}

async function fetchBackendHistory(query = "") {
  const backendUrl = getBackendBaseUrl();
  const endpoint = query
    ? `${backendUrl}/api/search?q=${encodeURIComponent(query)}`
    : `${backendUrl}/api/all`;

  try {
    const response = await fetch(endpoint, {
      headers: buildAuthHeaders()
    });

    if (await handleUnauthorizedResponse(response)) {
      return [];
    }

    if (!response.ok) {
      throw new Error("Backend history fetch failed");
    }

    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    console.warn("Backend history unavailable:", error.message);
    return [];
  }
}

function getCurrentUserEmail() {
  return getUser()?.email || "";
}

async function logActivityToBackend(payload) {
  const backendUrl = getBackendBaseUrl();
  if (!getAuthToken()) return null;

  try {
    const response = await fetch(`${backendUrl}/api/activity`, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Backend activity save failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend activity skipped:", error.message);
    return null;
  }
}

async function fetchBehaviorContext() {
  const backendUrl = getBackendBaseUrl();
  if (!getAuthToken()) {
    return null;
  }

  try {
    const response = await fetch(`${backendUrl}/api/context`, {
      headers: buildAuthHeaders()
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Backend context fetch failed");
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch (error) {
    console.warn("Behavior context unavailable:", error.message);
    return null;
  }
}

async function signupWithBackend(payload) {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Signup failed");
  }

  return data;
}

async function loginWithBackend(payload) {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
}

async function fetchCurrentBackendUser() {
  const backendUrl = getBackendBaseUrl();
  if (!getAuthToken()) return null;

  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: buildAuthHeaders()
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.warn("Backend auth restore skipped:", error.message);
    return null;
  }
}

async function fetchProfileFromBackend() {
  const backendUrl = getBackendBaseUrl();
  if (!getAuthToken()) return null;

  try {
    const response = await fetch(`${backendUrl}/api/user/profile`, {
      headers: buildAuthHeaders()
    });

    if (await handleUnauthorizedResponse(response)) {
      return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success || !data?.data) {
      throw new Error(data?.message || "Unable to fetch profile");
    }

    return data.data;
  } catch (error) {
    console.warn("Profile fetch skipped:", error.message);
    return null;
  }
}

async function updateProfileInBackend(payload) {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/user/profile`, {
    method: "PUT",
    headers: buildAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  });

  if (await handleUnauthorizedResponse(response)) {
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success || !data?.data) {
    throw new Error(data?.message || "Unable to update profile");
  }

  return data;
}

async function changePasswordInBackend(payload) {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/user/password`, {
    method: "PUT",
    headers: buildAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  });

  if (await handleUnauthorizedResponse(response)) {
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Unable to change password");
  }

  return data;
}

function normalizeBackendHistoryItem(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: `db-${item._id || uid("db")}`,
    source: "backend",
    type: String(item.type || "backend").trim().toLowerCase(),
    title: String(item.query || "Saved backend entry").trim(),
    question: String(item.response || "").trim(),
    time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    createdAt: item.createdAt || new Date().toISOString()
  };
}
