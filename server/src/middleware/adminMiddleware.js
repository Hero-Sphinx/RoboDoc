function isAdmin(req, res, next) {
  // The 'req.user' is populated by your authenticateToken middleware
  if (req.user && req.user.role === 'ADMIN') {
    next(); // They are the boss, let them through
  } else {
    return res.status(403).json({ 
      error: "Access denied. Only the Medical Director can onboard new staff." 
    });
  }
}

module.exports = isAdmin; 