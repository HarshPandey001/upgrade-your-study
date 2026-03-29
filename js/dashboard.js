function loadDashboardUI() {
  const app = document.getElementById("app");
  const data = getAIResult();

  const { topics, questions, studyPlan } = data;

  app.innerHTML = `
    <div class="container">
      <h1>Dashboard 📊</h1>

      <div class="card">
        <h2>Topics</h2>
        ${topics.map(t => `<div class="list-item">${t}</div>`).join("")}
      </div>

      <div class="card">
        <h2>Questions</h2>
        ${questions.map(q => `
          <div class="list-item" onclick="getAnswer('${q}')">
            ${q}
          </div>
        `).join("")}
      </div>

      <div class="card">
        <h2>Study Plan</h2>
        ${studyPlan.map(d => `<div class="list-item">${d}</div>`).join("")}
      </div>

      <div class="card">
        <button onclick="startTest()">Start Test 🧠</button>
        <button onclick="openSettings()">⚙️ AI Settings</button>
        <button class="btn-secondary" onclick="resetApp()">Reset</button>
      </div>
    </div>
  `;
}