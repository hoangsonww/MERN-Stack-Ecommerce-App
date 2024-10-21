const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware for protected routes
module.exports = function (req, res, next) {
  // Get token from the header
  const token = req.header('x-auth-token');

  // Check if there's no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the user payload to the request object
    req.user = decoded.user;

    // Call next middleware
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
