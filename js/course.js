// =======================================
// 📚 COURSE MODULE (Course Selection)
// =======================================

// Load Course UI
function loadCourseUI() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>Select Your Learning Path 📚</h1>
      <p class="subtitle">Choose how you want to study</p>

      <div class="card">

        <button onclick="selectBCA()">🎓 BCA (DDU)</button>

        <button onclick="selectCustom()">🧠 Other Course</button>

        <button onclick="openAssistant()">🤖 AI Assistant</button>

        <button class="btn-secondary" onclick="goBackToSetup()">Back</button>

      </div>
    </div>
  `;
}

// ===============================
// 🎓 BCA FLOW
// ===============================

function selectBCA() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>BCA Selection 🎓</h1>

      <div class="card">
        <h2>Select Semester</h2>

        <select id="semester">
          <option value="">Choose Semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
          <option value="5">Semester 5</option>
          <option value="6">Semester 6</option>
        </select>

        <button onclick="confirmBCA()">Continue</button>

        <button class="btn-secondary" onclick="loadCourseUI()">Back</button>
      </div>
    </div>
  `;
}

function confirmBCA() {
  const sem = document.getElementById("semester").value;

  if (!sem) {
    alert("Please select semester");
    return;
  }

  const course = {
    type: "bca",
    semester: sem
  };

  saveCourse(course);

  reloadApp();
}

// ===============================
// 🧠 CUSTOM COURSE FLOW
// ===============================

function selectCustom() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>Custom Course 🧠</h1>

      <div class="card">
        <input type="text" id="courseName" placeholder="Enter course name">
        <input type="text" id="subjects" placeholder="Enter subjects (comma separated)">

        <button onclick="confirmCustom()">Continue</button>

        <button class="btn-secondary" onclick="loadCourseUI()">Back</button>
      </div>
    </div>
  `;
}

function confirmCustom() {
  const name = document.getElementById("courseName").value.trim();
  const subjects = document.getElementById("subjects").value.trim();

  if (!name || !subjects) {
    alert("Please fill all fields");
    return;
  }

  const course = {
    type: "custom",
    name,
    subjects: subjects.split(",").map(s => s.trim())
  };

  saveCourse(course);

  reloadApp();
}

// ===============================
// 🤖 AI ASSISTANT MODE
// ===============================

function openAssistant() {
  const course = {
    type: "assistant"
  };

  saveCourse(course);

  reloadApp();
}

// ===============================
// 🔙 NAVIGATION
// ===============================

function goBackToSetup() {
  removeApiKey();
  localStorage.removeItem("uys_ai_config");
  reloadApp();
}