const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    // add req to validationProcess and the get a result.
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed.');
        error.StatusCode = 422;
        // errors.array(): make the error objects stored in an array
        error.data = errors.array();
        throw error;
    }

    const { email, password, name } = req.body;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email,
                password: hashedPassword,
                name           
            })
            return user.save();
        })
        .then(newUser => {
            if(!newUser) {
                const error = new Error('Unable to save the user.');
                error.statusCode = 422;
                throw error;
            }
            res.status(201).json({
                message: 'User is created.',
                userId: newUser._id
            });
        })
        .catch(e => {
            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        });
}