let currentQuestionIndex = 0;
let userAnswers = [];

function getCurrentMcqs() {
  return getResultForCurrentCourse()?.mcqs || getAIResult()?.mcqs || [];
}

function startTest() {
  loadTestUI();
}

function loadTestUI(preserveProgress = false) {
  const mcqs = getCurrentMcqs();

  if (!mcqs.length) {
    showToast("No MCQs found yet. Generate study content first.", "error");
    loadDashboardUI();
    return;
  }

  if (!preserveProgress) {
    currentQuestionIndex = 0;
    userAnswers = new Array(mcqs.length).fill(null);
  } else if (userAnswers.length < mcqs.length) {
    userAnswers = [...userAnswers, ...new Array(mcqs.length - userAnswers.length).fill(null)];
  }

  renderQuestion();
}

function renderQuestion() {
  const mcqs = getCurrentMcqs();
  const question = mcqs[currentQuestionIndex];

  if (!question) {
    loadDashboardUI();
    return;
  }

  const isLastQuestion = currentQuestionIndex === mcqs.length - 1;

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <div class="top-bar">
          <div>
            <p class="eyebrow">Skill Test View</p>
            <h1>Question ${currentQuestionIndex + 1} of ${mcqs.length}</h1>
          </div>
          <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Back</button>
        </div>
        <p class="subtitle">Select the best answer, keep moving, or extend the test with new AI-generated MCQs.</p>
      </section>

      <section class="panel-card">
        <h2>${escapeHtml(question.question)}</h2>
        <div class="option-list">
          ${question.options
            .map((option, index) => {
              const selected = userAnswers[currentQuestionIndex] === index ? "selected" : "";
              return `
                <button
                  class="option-card ${selected}"
                  onclick="selectOption(${index})"
                  type="button"
                >
                  <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                  <span>${escapeHtml(option)}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        <div class="action-row">
          <button class="btn-secondary inline-btn" onclick="previousQuestion()" ${currentQuestionIndex === 0 ? "disabled" : ""}>Previous</button>
          <button class="inline-btn" onclick="nextQuestion()">${isLastQuestion ? "Submit Test" : "Next Question"}</button>
          <button id="more-mcqs-btn" class="btn-secondary inline-btn" onclick="generateMoreMCQs()">More MCQs</button>
        </div>
      </section>
    </div>
  `;
}

function selectOption(index) {
  userAnswers[currentQuestionIndex] = index;
  renderQuestion();
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    renderQuestion();
  }
}

function nextQuestion() {
  if (userAnswers[currentQuestionIndex] === null || userAnswers[currentQuestionIndex] === undefined) {
    showToast("Please select an option before continuing.", "error");
    return;
  }

  const mcqs = getCurrentMcqs();
  if (currentQuestionIndex < mcqs.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  submitTest();
}

function submitTest() {
  const mcqs = getCurrentMcqs();
  let score = 0;

  mcqs.forEach((mcq, index) => {
    if (userAnswers[index] === mcq.answer) {
      score += 1;
    }
  });

  showResult(score, mcqs.length);
}

function showResult(score, total) {
  const mcqs = getCurrentMcqs();
  const percent = total ? Math.round((score / total) * 100) : 0;
  const reviewItems = mcqs
    .map((mcq, index) => ({
      mcq,
      index,
      isCorrect: userAnswers[index] === mcq.answer
    }))
    .slice(0, Math.min(mcqs.length, 6));

  saveRecent({
    id: uid("recent-test"),
    type: "test-result",
    title: `Scored ${score}/${total} (${percent}%)`,
    time: nowLabel()
  });

  void saveToBackend({
    userEmail: getCurrentUserEmail(),
    query: `Skill test result for ${getCourse()?.label || "study pack"}`,
    response: JSON.stringify({
      score,
      total,
      percent
    }),
    type: "test",
    meta: {
      incorrectQuestions: reviewItems.filter((item) => !item.isCorrect).map((item) => item.mcq.question)
    }
  });

  void logActivityToBackend({
    action: "test_result",
    title: `Scored ${score}/${total}`,
    details: {
      score,
      total,
      percent,
      incorrectQuestions: reviewItems.filter((item) => !item.isCorrect).map((item) => item.mcq.question)
    }
  });

  $("app").innerHTML = `
    <div class="container app-shell">
      <section class="hero-card compact">
        <p class="eyebrow">Result View</p>
        <h1>${score} / ${total}</h1>
        <p class="subtitle">Accuracy: ${percent}%</p>
      </section>

      <section class="panel-card">
        <h2>Detailed Review</h2>
        <div class="option-list">
          ${reviewItems
            .map(({ mcq, index, isCorrect }) => `
              <article class="review-card ${isCorrect ? "selected-card" : ""}">
                <div class="recent-meta">
                  <strong>Q${index + 1}</strong>
                  <span class="badge">${isCorrect ? "Correct" : "Review"}</span>
                </div>
                <h3>${escapeHtml(mcq.question)}</h3>
                <p><strong>Your answer:</strong> ${escapeHtml(userAnswers[index] !== null && userAnswers[index] !== undefined ? mcq.options[userAnswers[index]] || "Not answered" : "Not answered")}</p>
                <p><strong>Correct answer:</strong> ${escapeHtml(mcq.options[mcq.answer] || "")}</p>
                ${mcq.explanation ? `<p class="small">${escapeHtml(mcq.explanation)}</p>` : ""}
              </article>
            `)
            .join("")}
        </div>

        <div class="action-row">
          <button class="inline-btn" onclick="loadTestUI()">Retake Test</button>
          <button class="btn-secondary inline-btn" onclick="generateMoreMCQs(true)">Generate More MCQs</button>
          <button class="btn-secondary inline-btn" onclick="loadDashboardUI()">Back to Dashboard</button>
        </div>
      </section>
    </div>
  `;
}

async function generateMoreMCQs(openTestAfter = false) {
  try {
    setButtonLoading("more-mcqs-btn", true, "Generating...");
    await generateAdditionalMcqs();
    showToast("Fresh MCQs added to your test.", "success");

    const previousLength = userAnswers.length;
    loadTestUI(true);

    if (openTestAfter) {
      currentQuestionIndex = previousLength;
      renderQuestion();
    }
  } catch (error) {
    showToast(error.message || "Unable to generate more MCQs right now.", "error");
    if (getCurrentMcqs().length) {
      renderQuestion();
    } else {
      loadDashboardUI();
    }
  }
}
