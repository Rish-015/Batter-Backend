const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("+password is_active role phone name email addresses");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
