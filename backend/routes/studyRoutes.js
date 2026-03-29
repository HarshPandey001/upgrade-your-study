const express = require("express");
const StudyEntry = require("../models/StudyEntry");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save", requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const query = String(req.body.query || "").trim();
    const response = String(req.body.response || "").trim();
    const type = String(req.body.type || "ai").trim().toLowerCase();
    const meta = req.body.meta && typeof req.body.meta === "object" ? req.body.meta : {};

    if (!query || !response) {
      return res.status(400).json({
        success: false,
        message: "query and response are required"
      });
    }

    const existing = await StudyEntry.findOne({ userEmail, query, response, type }).lean();
    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        data: existing
      });
    }

    const entry = await StudyEntry.create({ userEmail, query, response, type, meta });
    return res.status(201).json({
      success: true,
      duplicate: false,
      data: entry
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await StudyEntry.findOne({
        query: String(req.body.query || "").trim(),
        response: String(req.body.response || "").trim(),
        type: String(req.body.type || "ai").trim().toLowerCase(),
        userEmail: String(req.body.userEmail || "").trim().toLowerCase()
      }).lean();

      return res.json({
        success: true,
        duplicate: true,
        data: existing
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save study entry"
    });
  }
});

router.get("/search", requireAuth, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const userEmail = req.user.email;
    const filter = query
      ? {
          userEmail,
          query: {
            $regex: query,
            $options: "i"
          }
        }
      : { userEmail };

    const entries = await StudyEntry.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to search study entries"
    });
  }
});

router.get("/all", requireAuth, async (req, res) => {
  try {
    const entries = await StudyEntry.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch study entries"
    });
  }
});

module.exports = router;
