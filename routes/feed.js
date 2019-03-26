const express = require('express');
const { body } = require('express-validator/check');
const router = express.Router();

const feedControllers = require('../controllers/feed');

router.get('/posts', feedControllers.getPosts);
router.post('/createPost', 
    [
        body('title')
            .trim()
            .isLength({ min: 7 }),
        body('content')
            .trim()
            .isLength({ min: 5 }),
    ], 
    feedControllers.createPost);

module.exports = router;
