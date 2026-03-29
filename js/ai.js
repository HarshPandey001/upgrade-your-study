const AI_MODEL_MAP = Object.freeze({
  gemini: [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro"
  ],
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4.1"
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ]
});

let bcaSyllabusCache = null;

function normalizeGeminiModel(model) {
  const value = String(model || "").trim();
  const legacyMap = {
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.0-pro": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-flash"
  };

  return legacyMap[value] || value;
}

function getModelsForProvider(provider) {
  return AI_MODEL_MAP[String(provider || "").toLowerCase()] || [];
}

function validateAIConfig(config = getAIConfig()) {
  if (!config) {
    throw new Error("AI setup is missing. Please add your provider, model, and API key.");
  }

  const provider = String(config.provider || "").toLowerCase();
  const model = provider === "gemini"
    ? normalizeGeminiModel(config.model)
    : String(config.model || "");
  const apiKey = String(config.apiKey || "");

  if (!provider || !model || !apiKey) {
    throw new Error("AI setup is incomplete. Please fill provider, model, and API key.");
  }

  if (!AI_MODEL_MAP[provider]) {
    throw new Error("Unsupported AI provider. Please choose Gemini, OpenAI, or Groq.");
  }

  return { provider, model, apiKey };
}

function getCourseMaterialsSummary(course = getCourse()) {
  if (!course) return "";

  const materialSummary = Array.isArray(course.materials)
    ? course.materials
        .map((item, index) => {
          const content = String(item.content || "").trim().slice(0, 2200);
          return `Material ${index + 1}: ${item.name || "Uploaded file"}\n${content}`;
        })
        .join("\n\n")
    : "";

  const notes = course.notes ? `Student notes: ${course.notes}` : "";
  return [notes, materialSummary].filter(Boolean).join("\n\n");
}

async function getBcaSyllabusData() {
  if (bcaSyllabusCache) return bcaSyllabusCache;

  try {
    const response = await fetch("data/syllabus.json");
    if (!response.ok) throw new Error("Unable to load BCA syllabus.");
    bcaSyllabusCache = await response.json();
  } catch (error) {
    bcaSyllabusCache = null;
  }

  return bcaSyllabusCache;
}

function formatBcaSubjectContext(subject) {
  if (!subject || typeof subject !== "object") return "";

  const header = `${subject.code || ""} ${subject.name || ""}`.trim();
  const marks = subject.total ? `Marks: Internal ${subject.internal || 0}, External ${subject.external || 0}, Total ${subject.total}.` : "";
  const units = Array.isArray(subject.units)
    ? subject.units
        .map((unit) => `${unit.title}: ${(unit.topics || []).join(", ")}`)
        .join("\n")
    : "";
  const tasks = Array.isArray(subject.tasks) ? `Practical tasks: ${subject.tasks.join(", ")}` : "";
  const breakup = subject.breakup
    ? `Breakup: ${Object.entries(subject.breakup).map(([key, value]) => `${key} ${value}`).join(", ")}.`
    : "";

  return [header, marks, breakup, units, tasks, subject.note || ""].filter(Boolean).join("\n");
}

async function buildCourseContext(course = getCourse()) {
  if (!course) return "No course selected.";

  const parts = [];

  if (course.type === "bca") {
    parts.push(`Course: BCA (DDU). Semester: ${course.semester}.`);
    const syllabus = await getBcaSyllabusData();
    const semesterData = syllabus?.semesters?.[String(course.semester)];
    const practicalInfo = syllabus?.program?.evaluation?.practicalSemesters1to5;
    const divisionRules = Array.isArray(syllabus?.program?.divisionRules)
      ? syllabus.program.divisionRules.map((item) => `${item.division}: ${item.rule}`).join("; ")
      : "";

    if (semesterData?.subjects?.length) {
      const selectedNames = new Set(course.subjects || []);
      const selectedSubjects = semesterData.subjects.filter((subject) => selectedNames.size === 0 || selectedNames.has(subject.name));
      parts.push(`Semester total marks: ${semesterData.totalMarks || 500}.`);
      parts.push(selectedSubjects.map(formatBcaSubjectContext).filter(Boolean).join("\n\n"));
    }

    if (practicalInfo && Number(course.semester) <= 5) {
      parts.push(`Practical evaluation for semesters 1 to 5: Practical ${practicalInfo.practical}, Record ${practicalInfo.record}, Viva ${practicalInfo.vivaVoce}, Total ${practicalInfo.total}.`);
    }

    if (Number(course.semester) === 6) {
      const project = syllabus?.program?.evaluation?.projectSemester6;
      if (project) {
        parts.push(`Project evaluation in semester 6: Project Report ${project.projectReport}, Presentation/Viva ${project.presentationViva}, Total ${project.total}.`);
      }
    }

    if (divisionRules) {
      parts.push(`Division rules: ${divisionRules}`);
    }
  } else if (course.type === "custom") {
    parts.push(`Course: ${course.name}.`);
  } else if (course.type === "assistant") {
    parts.push(`Mode: study assistant. Focus topic: ${course.prompt || "general study support"}.`);
  } else {
    parts.push(`Course label: ${course.label || "Unknown course"}.`);
  }

  if (course.subjects?.length) {
    parts.push(`Subjects: ${course.subjects.join(", ")}.`);
  }

  const materials = getCourseMaterialsSummary(course);
  if (materials) {
    parts.push(materials);
  }

  return parts.join("\n");
}

async function buildStudyPrompt(course) {
  return `
You are an expert academic mentor for a web app called "Upgrade Your Study".

Generate a practical study package for this learner.
${await buildCourseContext(course)}

Rules:
- Return valid JSON only.
- Keep the content exam-focused and easy to revise.
- Topics should be concise and clear.
- Questions should be dashboard-friendly and meaningful.
- MCQs must each have exactly 4 options.
- "answer" must be the zero-based index of the correct option.
- Study plan must be a 7-day roadmap.

JSON schema:
{
  "summary": "short overview",
  "topics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6"],
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6"],
  "mcqs": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "why the answer is correct"
    }
  ],
  "studyPlan": ["Day 1: ...", "Day 2: ...", "Day 3: ...", "Day 4: ...", "Day 5: ...", "Day 6: ...", "Day 7: ..."]
}

Return exactly 6 topics, 6 questions, 5 MCQs, and 7 study plan steps.
  `.trim();
}

async function buildMoreMcqsPrompt(course, currentResult) {
  const topics = (currentResult?.topics || []).join(", ");

  return `
You are generating fresh practice MCQs for a study app.
${await buildCourseContext(course)}
Existing topics: ${topics || "general revision"}.

Return valid JSON only using this schema:
{
  "mcqs": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "why the answer is correct"
    }
  ]
}

Generate 5 new MCQs with varied difficulty and without repeating previous questions.
  `.trim();
}

function buildAnswerCacheKey(question, options = {}) {
  const length = String(options.length || "medium").toLowerCase();
  const language = String(options.language || "English");
  return `${question}::${length}::${language}`;
}

async function buildAnswerPrompt(course, question, currentResult, options = {}) {
  const length = String(options.length || "medium").toLowerCase();
  const language = String(options.language || "English");
  const lengthGuide = {
    short: "around 80-120 words",
    medium: "around 150-220 words",
    long: "around 250-350 words"
  };

  return `
You are answering a student's study question inside a dashboard.
${await buildCourseContext(course)}
Known topics: ${(currentResult?.topics || []).join(", ") || "not available"}.

Question:
${question}

Instructions:
- Respond in ${language}.
- Keep the answer ${lengthGuide[length] || lengthGuide.medium}.
- Start with a direct answer.
- Then explain simply.
- End with one quick revision tip.
  `.trim();
}

async function buildAssistantPrompt(message, course = getCourse(), behaviorContext = null) {
  const behaviorSummary = behaviorContext
    ? `
Behavior summary:
${behaviorContext.summary || "No strong behavior pattern yet."}
Recent queries: ${(behaviorContext.recentQueries || []).join(", ") || "none"}
Weak areas: ${(behaviorContext.weakAreas || []).join(", ") || "none"}
Predicted next questions: ${(behaviorContext.predictedNextQuestions || []).join(", ") || "none"}
Preferences: language=${behaviorContext.preferences?.preferredLanguage || "not set"}, answerLength=${behaviorContext.preferences?.preferredAnswerLength || "not set"}
`
    : "Behavior summary: not available.";

  return `
You are an AI study assistant inside a browser app.
${await buildCourseContext(course)}
${behaviorSummary}

Student message:
${message}

Respond helpfully with:
1. A direct answer
2. Actionable study advice
3. A short next step
4. If possible, anticipate one likely follow-up question the user may ask next
  `.trim();
}

async function requestAIText(prompt, options = {}) {
  const config = validateAIConfig();

  try {
    return await requestAIThroughBackend(prompt, options, config);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error while contacting the backend AI service. Please check your connection.");
    }

    throw error;
  }
}

async function requestAIJson(prompt, options = {}) {
  const text = await requestAIText(prompt, { ...options, expectJson: true });
  const jsonText = extractJsonObject(text);
  const parsed = safeParse(jsonText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned unreadable data. Please try again.");
  }

  return parsed;
}

function normalizeStudyPlan(studyPlan, topics = []) {
  const cleaned = Array.isArray(studyPlan)
    ? studyPlan.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const fallback = topics.slice(0, 7).map((topic, index) => `Day ${index + 1}: Revise ${topic}`);
  const base = cleaned.length ? cleaned : fallback;

  while (base.length < 7) {
    base.push(`Day ${base.length + 1}: Revise weak areas and attempt MCQs.`);
  }

  return base.slice(0, 7);
}

function stringifyBackendPayload(value) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value || "");
  }
}

async function generateStudyContent(course = getCourse()) {
  if (!course) {
    throw new Error("Choose a course before starting AI processing.");
  }

  const existing = getAIResult();
  const result = normalizeAIResult(await requestAIJson(await buildStudyPrompt(course)));
  if (!result) {
    throw new Error("AI returned an incomplete study package.");
  }

  result.studyPlan = normalizeStudyPlan(result.studyPlan, result.topics);
  result.meta = {
    ...(existing?.meta || {}),
    provider: getAIConfig()?.provider || "",
    model: getAIConfig()?.model || "",
    generatedAt: new Date().toISOString(),
    courseSignature: courseSignature(course),
    assistantMessages: existing?.meta?.assistantMessages || []
  };

  saveAIResult(result);
  saveRecent({
    id: uid("recent-ai"),
    type: "ai-result",
    title: `AI study pack ready for ${course.label}`,
    time: nowLabel()
  });

  void saveToBackend({
    userEmail: getCurrentUserEmail(),
    query: course.label || buildCourseContext(course),
    response: stringifyBackendPayload(result),
    type: "ai",
    meta: {
      courseLabel: course.label || "",
      topics: result.topics || [],
      questions: result.questions || []
    }
  });

  void logActivityToBackend({
    action: "ai_result_generated",
    title: course.label || "AI study pack",
    details: {
      type: "ai",
      topics: result.topics || [],
      questions: result.questions || [],
      provider: getAIConfig()?.provider || ""
    }
  });

  return result;
}

async function generateAdditionalMcqs() {
  const course = getCourse();
  const currentResult = getAIResult();

  if (!course || !currentResult) {
    throw new Error("Study content is missing. Generate your AI study pack first.");
  }

  const payload = await requestAIJson(await buildMoreMcqsPrompt(course, currentResult));
  const newMcqs = Array.isArray(payload.mcqs) ? payload.mcqs.map(normalizeMcq).filter(Boolean) : [];

  if (!newMcqs.length) {
    throw new Error("The AI did not return any new MCQs.");
  }

  const merged = saveAIResult({
    ...currentResult,
    mcqs: [...currentResult.mcqs, ...newMcqs]
  });

  saveRecent({
    id: uid("recent-mcq"),
    type: "mcq-generation",
    title: `Generated ${newMcqs.length} more MCQs`,
    time: nowLabel()
  });

  void saveToBackend({
    userEmail: getCurrentUserEmail(),
    query: `Generate more MCQs for ${course.label || "study pack"}`,
    response: stringifyBackendPayload(newMcqs),
    type: "mcq",
    meta: {
      count: newMcqs.length,
      courseLabel: course.label || ""
    }
  });

  void logActivityToBackend({
    action: "mcq_generated",
    title: `Generated ${newMcqs.length} MCQs`,
    details: {
      count: newMcqs.length,
      courseLabel: course.label || ""
    }
  });

  return merged;
}

async function getAnswer(question, options = {}) {
  const course = getCourse();
  const result = getAIResult();
  const answerKey = buildAnswerCacheKey(question, options);

  if (!question) {
    throw new Error("Question is missing.");
  }

  if (result?.answers?.[answerKey]) {
    return result.answers[answerKey];
  }

  const text = await requestAIText(await buildAnswerPrompt(course, question, result, options));
  const nextResult = {
    ...(result || {}),
    answers: {
      ...(result?.answers || {}),
      [answerKey]: text.trim()
    },
    meta: {
      ...(result?.meta || {})
    }
  };

  saveAIResult(nextResult);
  saveRecent({
    id: uid("recent-question"),
    type: "question-click",
    title: "Question opened",
    question,
    time: nowLabel()
  });

  void saveToBackend({
    userEmail: getCurrentUserEmail(),
    query: question,
    response: text.trim(),
    type: "question",
    meta: {
      length: options.length || "medium",
      language: options.language || "English"
    }
  });

  void logActivityToBackend({
    action: "question_answer_generated",
    title: question,
    details: {
      length: options.length || "medium",
      language: options.language || "English"
    }
  });

  return text.trim();
}

async function askAssistant(message, options = {}) {
  if (!message && !options.imageDataUrl) {
    throw new Error("Write a message or attach an image first.");
  }

  const current = getAIResult() || normalizeAIResult({});
  const assistantMessages = Array.isArray(current?.meta?.assistantMessages)
    ? [...current.meta.assistantMessages]
    : [];

  const userMessage = {
    role: "user",
    text: String(message || "").trim() || "Please analyze the attached study image.",
    imageDataUrl: options.imageDataUrl || "",
    time: nowLabel()
  };

  assistantMessages.push(userMessage);

  const behaviorContext = await fetchBehaviorContext();
  const reply = await requestAIText(await buildAssistantPrompt(userMessage.text, getCourse(), behaviorContext), {
    imageDataUrl: options.imageDataUrl || ""
  });

  assistantMessages.push({
    role: "assistant",
    text: reply.trim(),
    time: nowLabel()
  });

  saveAIResult({
    ...current,
    meta: {
      ...(current?.meta || {}),
      assistantMessages,
      latestPredictedNextQuestions: behaviorContext?.predictedNextQuestions || []
    }
  });

  saveRecent({
    id: uid("recent-assistant"),
    type: "assistant-chat",
    title: "Assistant message",
    question: userMessage.text,
    time: nowLabel()
  });

  void saveToBackend({
    userEmail: getCurrentUserEmail(),
    query: userMessage.text,
    response: reply.trim(),
    type: "assistant",
    meta: {
      predictedNextQuestions: behaviorContext?.predictedNextQuestions || []
    }
  });

  void logActivityToBackend({
    action: "assistant_message",
    title: userMessage.text,
    details: {
      hasImage: Boolean(options.imageDataUrl),
      predictedNextQuestions: behaviorContext?.predictedNextQuestions || []
    }
  });

  return reply.trim();
}
