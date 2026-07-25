const catchAsync = require('../utils/catchAsync');
const AuthService = require('../services/auth.service');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  res.send(result);
});

const refreshToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  const result = await AuthService.refreshToken(token);
  res.send(result);
});

const getMe = catchAsync(async (req, res) => {
  res.send(req.user);
});

module.exports = {
  login,
  refreshToken,
  getMe
};
