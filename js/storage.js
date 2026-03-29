const UYS_KEYS = Object.freeze({
  user: "uys_user",
  token: "uys_token",
  aiConfig: "uys_ai_config",
  course: "uys_course",
  aiResult: "uys_ai_result",
  recents: "uys_recents"
});

function readStorageJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read storage key: ${key}`, error);
    return fallback;
  }
}

function writeStorageJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function normalizeUserRecord(user) {
  if (!user || typeof user !== "object") return null;

  const name = String(user.name || "Student").trim() || "Student";
  const email = String(user.email || "").trim().toLowerCase();

  return {
    name,
    email,
    password: String(user.password || ""),
    loggedIn: Boolean(user.loggedIn),
    createdAt: user.createdAt || new Date().toISOString(),
    lastLoginAt: user.lastLoginAt || null
  };
}

function saveUser(user) {
  const existing = getStoredUserRecord();
  const normalized = normalizeUserRecord({
    ...existing,
    ...user
  });

  if (!normalized) return null;
  return writeStorageJson(UYS_KEYS.user, normalized);
}

function getStoredUserRecord() {
  return normalizeUserRecord(readStorageJson(UYS_KEYS.user, null));
}

function getUser() {
  const user = getStoredUserRecord();
  return user && user.loggedIn ? user : null;
}

function removeUser() {
  const user = getStoredUserRecord();
  if (!user) {
    localStorage.removeItem(UYS_KEYS.user);
    return;
  }

  saveUser({
    ...user,
    loggedIn: false
  });
}

function clearStoredUser() {
  localStorage.removeItem(UYS_KEYS.user);
}

function saveAuthToken(token) {
  const value = String(token || "").trim();
  if (!value) {
    localStorage.removeItem(UYS_KEYS.token);
    return "";
  }

  localStorage.setItem(UYS_KEYS.token, value);
  return value;
}

function getAuthToken() {
  return String(localStorage.getItem(UYS_KEYS.token) || "").trim();
}

function removeAuthToken() {
  localStorage.removeItem(UYS_KEYS.token);
}

function normalizeAIConfig(config) {
  if (!config || typeof config !== "object") return null;

  const provider = String(config.provider || "").trim().toLowerCase();
  const model = String(config.model || "").trim();
  const apiKey = String(config.apiKey || "").trim();

  if (!provider && !model && !apiKey) return null;

  return {
    provider,
    model,
    apiKey,
    updatedAt: config.updatedAt || new Date().toISOString()
  };
}

function saveAIConfig(config) {
  const normalized = normalizeAIConfig(config);
  if (!normalized) return null;
  return writeStorageJson(UYS_KEYS.aiConfig, normalized);
}

function getAIConfig() {
  return normalizeAIConfig(readStorageJson(UYS_KEYS.aiConfig, null));
}

function removeAIConfig() {
  localStorage.removeItem(UYS_KEYS.aiConfig);
}

function removeApiKey() {
  removeAIConfig();
}

function normalizeCourse(course) {
  if (!course || typeof course !== "object") return null;

  const type = String(course.type || "").trim().toLowerCase();
  if (!type) return null;

  const subjects = Array.isArray(course.subjects)
    ? course.subjects.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const materials = Array.isArray(course.materials)
    ? course.materials
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const name = String(item.name || "").trim();
          const type = String(item.type || "").trim();
          const content = String(item.content || "").trim();
          if (!name && !content) return null;
          return { name, type, content };
        })
        .filter(Boolean)
    : [];

  const normalized = {
    type,
    name: String(course.name || "").trim(),
    semester: String(course.semester || "").trim(),
    subjects,
    prompt: String(course.prompt || "").trim(),
    notes: String(course.notes || "").trim(),
    materials,
    label: String(course.label || "").trim()
  };

  if (!normalized.label) {
    if (type === "bca") normalized.label = `BCA Semester ${normalized.semester || "1"}`;
    else if (normalized.name) normalized.label = normalized.name;
    else normalized.label = capitalize(type);
  }

  return normalized;
}

function saveCourse(course) {
  const normalized = normalizeCourse(course);
  if (!normalized) return null;
  return writeStorageJson(UYS_KEYS.course, normalized);
}

function getCourse() {
  return normalizeCourse(readStorageJson(UYS_KEYS.course, null));
}

function removeCourse() {
  localStorage.removeItem(UYS_KEYS.course);
}

function normalizeMcq(mcq) {
  if (!mcq || typeof mcq !== "object") return null;

  const options = Array.isArray(mcq.options)
    ? mcq.options.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!mcq.question || options.length < 2) return null;

  let answer = Number(mcq.answer);
  if (Number.isNaN(answer)) {
    answer = options.findIndex(
      (item) => item.toLowerCase() === String(mcq.answer || "").trim().toLowerCase()
    );
  }

  if (answer < 0 || answer >= options.length) answer = 0;

  return {
    question: String(mcq.question).trim(),
    options: options.slice(0, 4),
    answer,
    explanation: String(mcq.explanation || "").trim()
  };
}

function normalizeAIResult(result) {
  if (!result || typeof result !== "object") return null;

  return {
    summary: String(result.summary || "").trim(),
    topics: Array.isArray(result.topics)
      ? result.topics.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    questions: Array.isArray(result.questions)
      ? result.questions.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    mcqs: Array.isArray(result.mcqs)
      ? result.mcqs.map(normalizeMcq).filter(Boolean)
      : [],
    studyPlan: Array.isArray(result.studyPlan)
      ? result.studyPlan.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    answers: result.answers && typeof result.answers === "object" ? result.answers : {},
    meta: result.meta && typeof result.meta === "object" ? result.meta : {}
  };
}

function saveAIResult(result) {
  const normalized = normalizeAIResult(result);
  if (!normalized) return null;
  return writeStorageJson(UYS_KEYS.aiResult, normalized);
}

function getAIResult() {
  return normalizeAIResult(readStorageJson(UYS_KEYS.aiResult, null));
}

function removeAIResult() {
  localStorage.removeItem(UYS_KEYS.aiResult);
}

function normalizeRecentItem(item) {
  if (!item || typeof item !== "object") return null;

  const title = String(item.title || "").trim();
  const question = String(item.question || "").trim();
  const type = String(item.type || "activity").trim().toLowerCase();

  if (!title && !question) return null;

  return {
    id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    type,
    title,
    question,
    time: item.time || new Date().toLocaleString(),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function getAllRecents() {
  const list = readStorageJson(UYS_KEYS.recents, []);
  if (!Array.isArray(list)) return [];
  return list.map(normalizeRecentItem).filter(Boolean).slice(0, 50);
}

function saveRecents(recents) {
  const normalized = Array.isArray(recents)
    ? recents.map(normalizeRecentItem).filter(Boolean).slice(0, 50)
    : [];

  return writeStorageJson(UYS_KEYS.recents, normalized);
}

function saveRecent(item) {
  const nextItem = normalizeRecentItem(item);
  if (!nextItem) return null;

  const recents = getAllRecents().filter((recent) => recent.id !== nextItem.id);
  recents.unshift(nextItem);
  saveRecents(recents);
  return nextItem;
}

function clearRecents() {
  localStorage.removeItem(UYS_KEYS.recents);
}

function clearAllData() {
  Object.values(UYS_KEYS).forEach((key) => localStorage.removeItem(key));
}
