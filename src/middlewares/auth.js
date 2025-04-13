const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Access Denied: No token provided" });
    }

    const decodedData = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedData._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid Credentials: User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message || "Authentication Failed" });
  }
};

module.exports = { userAuth };
