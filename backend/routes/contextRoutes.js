const express = require("express");
const { buildUserContext } = require("../services/contextService");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/context", requireAuth, async (req, res) => {
  try {
    const context = await buildUserContext(req.user.email);

    return res.json({
      success: true,
      data: context
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to build user context"
    });
  }
});

module.exports = router;
