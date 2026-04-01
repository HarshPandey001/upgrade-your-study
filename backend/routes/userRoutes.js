const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserProfile = require("../models/UserProfile");
const { AI_MODEL_MAP, normalizeGeminiModel } = require("../services/aiService");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAuthPayload(user) {
  return {
    id: String(user._id),
    name: String(user.name || "Student").trim() || "Student",
    email: normalizeEmail(user.email)
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

function sanitizeAiConfig(config = {}) {
  const provider = String(config.provider || "").trim().toLowerCase();
  const model = provider === "gemini"
    ? normalizeGeminiModel(config.model)
    : String(config.model || "").trim();
  const apiKey = String(config.apiKey || "").trim();

  if (!provider && !model && !apiKey) {
    return null;
  }

  if (!provider || !model || !apiKey) {
    throw new Error("Provider, model, and API key are all required.");
  }

  if (!AI_MODEL_MAP[provider]) {
    throw new Error("Unsupported AI provider.");
  }

  if (!AI_MODEL_MAP[provider].includes(model)) {
    throw new Error(`The selected model was not found for ${provider}. Please choose a different model.`);
  }

  return {
    provider,
    model,
    apiKey,
    updatedAt: new Date()
  };
}

function validateProfileName(name) {
  const normalizedName = String(name || "").trim();
  const namePattern = /^[A-Za-z][A-Za-z\s]{1,48}[A-Za-z]$/;

  if (!normalizedName) {
    throw new Error("Full name is required.");
  }

  if (normalizedName.length < 3) {
    throw new Error("Full name must be at least 3 characters long.");
  }

  if (!namePattern.test(normalizedName)) {
    throw new Error("Full name should contain only letters and spaces.");
  }

  return normalizedName;
}

function validateEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!/[a-z]/i.test(normalizedEmail)) {
    throw new Error("Email must include at least one letter.");
  }

  return normalizedEmail;
}

function validateAvatarUrl(avatarUrl) {
  const normalizedAvatarUrl = String(avatarUrl || "").trim();
  if (!normalizedAvatarUrl) return "";

  if (!/^data:image\//i.test(normalizedAvatarUrl)) {
    throw new Error("Avatar must be a valid image file.");
  }

  if (normalizedAvatarUrl.length > 2_000_000) {
    throw new Error("Avatar image is too large. Please choose a smaller file.");
  }

  return normalizedAvatarUrl;
}

router.post("/user/upsert", requireAuth, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const name = String(req.body.name || "Student").trim() || "Student";
    const password = String(req.body.password || "").trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required"
      });
    }

    const user = await UserProfile.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          password
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        avatarUrl: String(user.avatarUrl || "").trim(),
        hasAiConfig: Boolean(user.aiConfig?.provider && user.aiConfig?.model && user.aiConfig?.apiKey)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save user profile"
    });
  }
});

router.get("/user/profile", requireAuth, async (req, res) => {
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
      data: {
        name: user.name,
        email: user.email,
        avatarUrl: String(user.avatarUrl || "").trim(),
        hasAiConfig: Boolean(user.aiConfig?.provider && user.aiConfig?.model && user.aiConfig?.apiKey),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch profile"
    });
  }
});

router.put("/user/profile", requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const name = validateProfileName(req.body.name);
    const email = validateEmail(req.body.email);
    const avatarUrl = validateAvatarUrl(req.body.avatarUrl);

    const existing = await UserProfile.findOne({ email, _id: { $ne: user._id } }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Another account already uses this email"
      });
    }

    user.name = name;
    user.email = email;
    user.avatarUrl = avatarUrl;
    await user.save();

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      data: {
        name: user.name,
        email: user.email,
        avatarUrl: String(user.avatarUrl || "").trim(),
        hasAiConfig: Boolean(user.aiConfig?.provider && user.aiConfig?.model && user.aiConfig?.apiKey),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update profile"
    });
  }
});

router.put("/user/password", requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const currentPassword = String(req.body.currentPassword || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
    }

    let validPassword = false;
    if (String(user.password || "").startsWith("$2")) {
      validPassword = await bcrypt.compare(currentPassword, user.password);
    } else {
      validPassword = user.password === currentPassword;
    }

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update password"
    });
  }
});

router.post("/user/ai-config", requireAuth, async (req, res) => {
  try {
    const aiConfig = sanitizeAiConfig(req.body);
    const user = await UserProfile.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          email: req.user.email,
          name: req.user.name || String(req.body.name || "Student").trim() || "Student",
          aiConfig
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return res.json({
      success: true,
      data: {
        email: user.email,
        aiConfig: user.aiConfig
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to save AI config"
    });
  }
});

router.get("/user/ai-config", requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findOne({ email: req.user.email }).lean();
    if (!user?.aiConfig?.provider || !user?.aiConfig?.model || !user?.aiConfig?.apiKey) {
      return res.json({
        success: true,
        data: null
      });
    }

    return res.json({
      success: true,
      data: user.aiConfig
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch AI config"
    });
  }
});

module.exports = router;
