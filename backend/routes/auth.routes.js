const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authValidation } = require('../middleware/validations');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', validate(authValidation.refreshToken), authController.refreshToken);
router.get('/me', auth(), authController.getMe);

module.exports = router;
