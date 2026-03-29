const express = require("express");
const UserActivity = require("../models/UserActivity");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/activity", requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const action = String(req.body.action || "").trim();
    const title = String(req.body.title || "").trim();
    const details = req.body.details && typeof req.body.details === "object" ? req.body.details : {};

    if (!userEmail || !action) {
      return res.status(400).json({
        success: false,
        message: "userEmail and action are required"
      });
    }

    const activity = await UserActivity.create({
      userEmail,
      action,
      title,
      details
    });

    return res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save activity"
    });
  }
});

router.get("/activity", requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);

    const activities = await UserActivity.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch activity"
    });
  }
});

module.exports = router;
