const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || "").trim();
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const secret = String(process.env.JWT_SECRET || "").trim();
    if (!secret) {
      throw new Error("JWT_SECRET is missing in backend/.env");
    }

    const payload = jwt.verify(token, secret);
    req.user = {
      id: String(payload.id || ""),
      email: String(payload.email || "").trim().toLowerCase(),
      name: String(payload.name || "").trim()
    };

    if (!req.user.id || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      });
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}

module.exports = {
  requireAuth
};
