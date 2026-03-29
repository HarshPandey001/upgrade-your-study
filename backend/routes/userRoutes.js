const express = require("express");
const UserProfile = require("../models/UserProfile");
const { AI_MODEL_MAP, normalizeGeminiModel } = require("../services/aiService");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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
