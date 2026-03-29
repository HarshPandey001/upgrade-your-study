const express = require("express");
const rateLimit = require("express-rate-limit");
const UserProfile = require("../models/UserProfile");
const { requestAiText } = require("../services/aiService");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please wait a minute and try again."
  }
});

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

router.post("/ai/generate", requireAuth, aiLimiter, async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    const expectJson = Boolean(req.body.expectJson);
    const imageDataUrl = String(req.body.imageDataUrl || "").trim();

    let provider = String(req.body.provider || "").trim().toLowerCase();
    let model = String(req.body.model || "").trim();
    let apiKey = String(req.body.apiKey || "").trim();

    if (!provider || !model || !apiKey) {
      const user = await UserProfile.findOne({ email: req.user.email }).lean();
      if (user?.aiConfig) {
        provider = provider || user.aiConfig.provider || "";
        model = model || user.aiConfig.model || "";
        apiKey = apiKey || user.aiConfig.apiKey || "";
      }
    }

    const text = await requestAiText(
      {
        provider,
        model,
        apiKey
      },
      prompt,
      {
        expectJson,
        imageDataUrl
      }
    );

    return res.json({
      success: true,
      text
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "AI request failed"
    });
  }
});

module.exports = router;
