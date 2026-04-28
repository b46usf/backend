const { sendCreated, sendSuccess } = require('../../shared/response');
const asyncHandler = require('../../shared/asyncHandler');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return sendCreated(res, 'User registered successfully', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getProfile(req.user.id);

  return sendSuccess(res, {
    message: 'Profile fetched successfully',
    data: result,
  });
});

const registerWithGoogle = asyncHandler(async (req, res) => {
  const result = await authService.registerWithGoogle(req.body);

  return sendCreated(res, 'Google registration submitted for admin verification', result);
});

const verifyUserByAdmin = asyncHandler(async (req, res) => {
  const result = await authService.verifyUserByAdmin(req.params.id);

  return sendSuccess(res, {
    message: 'User verified successfully',
    data: result,
  });
});

module.exports = {
  login,
  me,
  register,
  registerWithGoogle,
  verifyUserByAdmin,
};
