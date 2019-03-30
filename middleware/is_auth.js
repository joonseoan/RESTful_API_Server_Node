const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader) {
        const error = new Error('Not able to get token from your browser.');
        error.statusCode = 401;
        throw error;
    }    
    // req.get(): This is a way to get header data
    const token = authHeader.split(' ')[1];

    let decodedToken;
    
    try {
        decodedToken = jwt.verify(token, 'xxxx');
    } catch(e) {
        e.statusCode = 500;
        throw e;
    }
    
    if(!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }

    /* 
        decoded:
        { 
            userId : 'afdafafadf, 
            email: 'aaa@aaa.com'
        }
    */
    req.userId = decodedToken.userId;
    
    next();
};