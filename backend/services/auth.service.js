const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

class AuthService {
  static async login(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = jwt.sign({ sub: user.id }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    const refreshToken = jwt.sign({ sub: user.id }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

    try {
      await ActivityModel.log(user.id, 'Logged in', 'user', user.id);
    } catch (_) {
      // activity logging is non-critical; don't fail login if it errors
    }

    return { 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token, 
      refreshToken 
    };
  }

  static async refreshToken(token) {
    try {
      const payload = jwt.verify(token, env.jwt.refreshSecret);
      const user = await UserModel.findById(payload.sub);
      if (!user) {
        throw new ApiError(401, 'User not found');
      }
      
      const newToken = jwt.sign({ sub: user.id }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
      return { token: newToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }
}

module.exports = AuthService;
