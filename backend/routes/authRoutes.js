const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserProfile = require("../models/UserProfile");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAuthPayload(user) {
  return {
    id: String(user._id),
    name: String(user.name || "Student").trim() || "Student",
    email: normalizeEmail(user.email),
    avatarUrl: String(user.avatarUrl || "").trim()
  };
}

function signToken(user) {
  const secret = String(process.env.JWT_SECRET || "").trim();
  if (!secret) {
    throw new Error("JWT_SECRET is missing in backend/.env");
  }

  return jwt.sign(buildAuthPayload(user), secret, {
    expiresIn: "7d"
  });
}

router.post("/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "Student").trim() || "Student";
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    const existing = await UserProfile.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserProfile.create({
      name,
      email,
      password: hashedPassword
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create account"
    });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await UserProfile.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect"
      });
    }

    let validPassword = false;
    if (String(user.password || "").startsWith("$2")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      validPassword = user.password === password;
      if (validPassword) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect"
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to login"
    });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch current user"
    });
  }
});

module.exports = router;
