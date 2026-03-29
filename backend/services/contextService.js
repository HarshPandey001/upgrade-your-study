const StudyEntry = require("../models/StudyEntry");
const UserActivity = require("../models/UserActivity");

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toTopList(counts, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function uniqueStrings(values, limit = 5) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function getWeakAreas(activities) {
  const wrongQuestions = activities
    .filter((item) => item.action === "test_result")
    .flatMap((item) => Array.isArray(item.details?.incorrectQuestions) ? item.details.incorrectQuestions : []);

  return uniqueStrings(wrongQuestions, 5);
}

function getPreferredSetting(activities, key) {
  const values = activities
    .map((item) => item.details?.[key])
    .filter(Boolean);

  const ranked = toTopList(countBy(values, (value) => String(value)), 1);
  return ranked[0]?.label || "";
}

function getLikelyNextQuestions(entries, activities) {
  const recentQuestionQueries = entries
    .filter((item) => item.type === "question" || item.type === "assistant")
    .map((item) => item.query);

  const recentSearches = activities
    .filter((item) => item.action === "search")
    .map((item) => item.title);

  const weakAreas = getWeakAreas(activities);

  return uniqueStrings([
    ...recentQuestionQueries,
    ...recentSearches.map((item) => `More about ${item}`),
    ...weakAreas.map((item) => `Explain ${item}`)
  ], 5);
}

async function buildUserContext(userEmail) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      userEmail: "",
      summary: "No user context is available yet.",
      recentActivities: [],
      recentQueries: [],
      topInteractionTypes: [],
      weakAreas: [],
      predictedNextQuestions: [],
      preferences: {}
    };
  }

  const [entries, activities] = await Promise.all([
    StudyEntry.find({ userEmail: normalizedEmail }).sort({ createdAt: -1 }).limit(50).lean(),
    UserActivity.find({ userEmail: normalizedEmail }).sort({ createdAt: -1 }).limit(100).lean()
  ]);

  const topInteractionTypes = toTopList(
    countBy(entries, (item) => item.type),
    6
  );

  const recentQueries = uniqueStrings(entries.map((item) => item.query), 8);
  const weakAreas = getWeakAreas(activities);
  const predictedNextQuestions = getLikelyNextQuestions(entries, activities);
  const preferences = {
    preferredLanguage: getPreferredSetting(activities, "language"),
    preferredAnswerLength: getPreferredSetting(activities, "length")
  };

  const summaryParts = [
    recentQueries.length ? `Recent focus areas: ${recentQueries.slice(0, 4).join(", ")}` : "",
    topInteractionTypes.length ? `Top interaction types: ${topInteractionTypes.map((item) => `${item.label} (${item.count})`).join(", ")}` : "",
    weakAreas.length ? `Weak areas from tests: ${weakAreas.join(", ")}` : "",
    preferences.preferredLanguage ? `Preferred language: ${preferences.preferredLanguage}` : "",
    preferences.preferredAnswerLength ? `Preferred answer length: ${preferences.preferredAnswerLength}` : ""
  ].filter(Boolean);

  return {
    userEmail: normalizedEmail,
    summary: summaryParts.join(". ") || "Not enough user history yet.",
    recentActivities: activities.slice(0, 20),
    recentQueries,
    topInteractionTypes,
    weakAreas,
    predictedNextQuestions,
    preferences
  };
}

module.exports = {
  buildUserContext
};
