const { sendCreated, sendSuccess } = require('../../shared/response');
const asyncHandler = require('../../shared/asyncHandler');
const { ForbiddenError } = require('../../shared/errors');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return sendCreated(res, 'Pendaftaran berhasil, menunggu konfirmasi admin', result);
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

const googleAuthDisabled = asyncHandler(async () => {
  throw new ForbiddenError('Login dan register via Google account sedang dinonaktifkan');
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
  googleAuthDisabled,
  verifyUserByAdmin,
};
