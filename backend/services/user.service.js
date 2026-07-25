const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');

class UserService {
  static async createUser(userData, adminId) {
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userId = await UserModel.create({ ...userData, password: hashedPassword });
    
    await ActivityModel.log(adminId, 'User Created', 'user', userId, { email: userData.email, role: userData.role });
    return userId;
  }

  static async getAllUsers() {
    return await UserModel.findAll();
  }

  static async getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}

module.exports = UserService;
