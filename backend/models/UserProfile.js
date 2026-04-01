const mongoose = require("mongoose");

const aiConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: ""
    },
    model: {
      type: String,
      default: ""
    },
    apiKey: {
      type: String,
      default: ""
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const userProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Student"
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      default: "",
      trim: true
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true
    },
    aiConfig: {
      type: aiConfigSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
