const mongoose = require("mongoose");

const studyEntrySchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    response: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    meta: {
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

studyEntrySchema.index({ userEmail: 1, query: 1, response: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("StudyEntry", studyEntrySchema);
