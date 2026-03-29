const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

userActivitySchema.index({ userEmail: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
