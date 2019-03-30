const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
            });
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

exports.login = (req, res, next) => {
    const { email, password } = req.body;
    let loadedUser;

    User.findOne({ email })
        .then(user => {
            if(!user) {
                const error = new Error('Unable to find your account.');
                error.statusCode = 401;
                throw error;
            }

            loadedUser = user;
            return bcrypt.compare(password, user.password);

        })
        .then(isMatched => {

            if(!isMatched) {
                const error = new Error('Password is wrong.');
                error.statusCode = 401;
                throw error;
            }

            const token = jwt.sign({
                email : loadedUser.email,
                userId: loadedUser._id.toString()
                // setup expiring time : 1hour
                // It is for security reason that the token can be stolen.
                // ************************************
            }, 'xxxx', { expiresIn : '1h' });

            res.status(200).json({
                token,
                userId: loadedUser._id.toString()
            });
        })
        .catch(e => {

            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);

        })
    
}

exports.getStatus = (req, res, next) => {
    const userId = req.userId;

    console.log('userId: ', userId)

    if(!userId) {
        const error = new Error('No logged-in user exists, now.');
        error.statusCode = 401;
        throw error;
    }

    User.findById(userId)
            .then(user => {
                if(!user) {
                    const error = new Error('No logged-in user exists, now.');
                    error.statusCode = 401;
                    throw error;
                }
                res.status(200).json({
                    status: user.status
                });
            })
            .catch(e => {
                if(!e.statusCode) {
                    e.statusCode = 500;
                }
                next(e);
            });
}

exports.updateStatus = (req, res, next) => {
    const { status } = req.body;
    User.findById(req.userId)
        .then(user => {

            if(!user) {
                const error = new Error('No logged-in user exists, now.');
                error.statusCode = 401;
                throw error;
            }
            user.status = status;
            return user.save();
            
        })
        .then(user => {
            if(!user) {
                const error = new Error('No logged-in user exists, now.');
                error.statusCode = 401;
                throw error;
            }

            res.status(200).json({
                message: 'user updated!',
                status: user.status
            });
        })
        .catch(e => {
            if(!e.statuscode){
                e.statuscode = 500;
            }
            next();
        })

}