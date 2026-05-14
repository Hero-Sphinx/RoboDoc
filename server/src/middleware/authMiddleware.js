const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Add user info (id, role) to the request object
    next(); // Move to the next function (the controller)
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
}

module.exports = authenticateToken;