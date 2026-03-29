// =======================================
// 🔐 AUTH MODULE (Upgrade Your Study)
// =======================================

// Load Auth UI
function loadAuthUI() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>Upgrade Your Study 🚀</h1>

      <div class="card">
        <h2 id="authTitle">Login</h2>
        <p class="subtitle">Enter your details to continue</p>

        <input type="text" id="name" placeholder="Full Name (Signup only)" style="display:none;">
        <input type="email" id="email" placeholder="Email">
        <input type="password" id="password" placeholder="Password">

        <button onclick="handleAuth()">Continue</button>

        <p class="small" style="margin-top:10px;">
          <span id="toggleText">Don't have an account?</span>
          <a href="#" onclick="toggleAuthMode()">Signup</a>
        </p>
      </div>
    </div>
  `;
}

// Track mode
let isSignup = false;

// Toggle Login/Signup
function toggleAuthMode() {
  isSignup = !isSignup;

  document.getElementById("authTitle").innerText = isSignup ? "Signup" : "Login";
  document.getElementById("name").style.display = isSignup ? "block" : "none";
  document.getElementById("toggleText").innerText = isSignup
    ? "Already have an account?"
    : "Don't have an account?";
}

// Handle Auth
function handleAuth() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // Validation
  if (!email || !password || (isSignup && !name)) {
    alert("Please fill all required fields");
    return;
  }

  // Create user object
  const userData = {
    name: name || "User",
    email: email
  };

  // Save user
  saveUser(userData);

  // Go next
  reloadApp();
}