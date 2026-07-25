const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const { userValidation } = require('../middleware/validations');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth('admin'), validate(userValidation.createUser), userController.createUser);
router.get('/', auth('admin'), userController.getUsers);

module.exports = router;
