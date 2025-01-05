const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({message: 'authMiddleware/not authorized!'});
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({message: 'authMiddleware/invalid token!'});
    }

    req.user = user;

    next();
  });
}

module.exports = authMiddleware;