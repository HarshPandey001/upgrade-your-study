const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      [
        "MONGODB_URI is missing.",
        "Create backend/.env and add:",
        "MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority",
        "Also make sure your backend server is started from the backend folder."
      ].join(" ")
    );
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    const message = String(error.message || "");

    if (/authentication failed/i.test(message)) {
      throw new Error("MongoDB authentication failed. Check username/password in backend/.env.");
    }

    if (/ENOTFOUND|getaddrinfo/i.test(message)) {
      throw new Error("MongoDB cluster host was not found. Check your Atlas connection string.");
    }

    if (/IP.*not allowed|whitelist/i.test(message)) {
      throw new Error("MongoDB Atlas blocked this connection. Add your IP address in Atlas Network Access.");
    }

    throw new Error(`MongoDB connection failed: ${message}`);
  }
}

module.exports = connectDB;
