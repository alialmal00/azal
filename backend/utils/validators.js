// utils/validators.js
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().reduce((acc, err) => {
        acc[err.path] = err.msg;
        return acc;
      }, {})
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .notEmpty().withMessage('نام و نام خانوادگی الزامی است')
    .isLength({ min: 3 }).withMessage('نام باید حداقل ۳ کاراکتر باشد'),
  
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('ایمیل معتبر نیست')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است')
    .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  
  validateRequest
];

const loginValidation = [
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('ایمیل معتبر نیست')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است'),
  
  validateRequest
];

const updateRoleValidation = [
  body('role')
    .notEmpty().withMessage('نقش کاربری الزامی است')
    .isIn(['student', 'teacher', 'organization']).withMessage('نقش نامعتبر است'),
  
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  updateRoleValidation
};