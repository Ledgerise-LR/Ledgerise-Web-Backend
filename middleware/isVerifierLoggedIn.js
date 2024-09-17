const jwt = require('jsonwebtoken');
const Company = require("../models/Company");

module.exports = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) return res.status(401).json({ success: false, err: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, err: "Failed to authenticate token" });

    Company.authenticateVerifier(decoded.companyId, (err, company) => {
      if (err || !company) return res.status(401).json({ success: false, err: "Unauthorized" });
      return next();
    });
  });
};
