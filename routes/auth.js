const express = require('express');
const { body } = require('express-validator/check');

const router = express.Router();

const User = require('../models/user');
const authControllers = require('../controllers/auth');

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        // callback!
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                // callback
                .then(user => {
                    // throw new Error() can be used but
                    // here, we do not have catch() statement.
                    // The catch statement is in custom() {} function
                    if(user) return Promise.reject('Email address already exists.');
                });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 4 }),
    body('name')
        .trim()
        //  must not be blank or empty.
        .not()
        .isEmpty()

], authControllers.signup);

module.exports = router;