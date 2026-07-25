const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const db = require('../config/db');

const auth = (...requiredRoles) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Please authenticate');
    }

    const token = authHeader.split(' ')[1];
    
    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [payload.sub]);
    const user = rows[0];

    if (!user) {
      throw new ApiError(401, 'Please authenticate');
    }

    req.user = user;

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ApiError(403, 'Forbidden');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
