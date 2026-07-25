const catchAsync = require('../utils/catchAsync');
const UserService = require('../services/user.service');

const createUser = catchAsync(async (req, res) => {
  const userId = await UserService.createUser(req.body, req.user.id);
  res.status(201).send({ id: userId, message: 'User created successfully' });
});

const getUsers = catchAsync(async (req, res) => {
  const users = await UserService.getAllUsers();
  res.send(users);
});

module.exports = {
  createUser,
  getUsers
};
