const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user has specific role
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};
