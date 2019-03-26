const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {

    // Don't be confused with res.json(nothing)!!!!!
    // It is to make the json format into javascript plain object provided by javascript engine, not from express

    // json({}): express's built-in method to convert the object to json format.
    //  because http can't recognize object format, but json format.

    // json({}) automatically sets up Content-Type: application/json!!!!!!!!!!***********************************
    // res.json({ posts: [{ title: 'First Post', content: 'This is the first post.'}]})

    // json({}) is only for responding(sending) toward the client.!!!!!!
    //   not receiving the request from the client

    // shall add status code if it is not "200" which is default value.
    res.status(200).json({ 
        posts: [
            {
                _id: '1', 
                title: 'First Post', 
                content: 'This is the first post.',
                imageUrl: 'images/lady.PNG',
                creator: {
                    name: 'Joon'
                },
                createdAt: new Date()
            }
        ]
    });
};

// body-parsor needed to get the client's request.
//  because req's feields is always json in RESTUL API.
// like in axios and fetch.
// Remember, RESTFUL API does not use "form" in HTML
//  which requires urlencoded in body-parser.
exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    /* 
        [errors] with methods
        errors:  { isEmpty: [Function],
        array: [Function],
        mapped: [Function],
        formatWith: [Function],
        throw: [Function] }
    
    */
    // console.log('errors: ', errors);
    
    // isEmpty is a method of "errors"
    if(!errors.isEmpty()) {

        // No need next(error) here because it is nto promise error.
        // It is an error at expres routes
        console.log('errors from validation: ', errors);

        // 2) centralized error handling
        const error = new Error('Validation Failed. Entered data is incorrect.');
        error.statusCode = 422;
        throw error;



        // 1) each error handling
        // return res.status(422).json(
        //     { 
    
        //         message: 'Validation failed. Entered data is incorrect.',
        //         // array() : a method of "errors" to extract error message out of array.
        //         errors: errors.array()
        //     }
        // );
    }
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title,
        imageUrl: 'images/lady.PNG', // for the moment
        content,
        creator: { name: 'Max' }
    });

    post.save()
        .then(post => {

            console.log('post: ', post)
            res.status(201).json({
                message: 'Post created successfully',
                post 
                //{
                //     _id: post._id,
                //     title: post.title,
                //     content: post.content,
                //     "creator.name": post.creator.name,
                //     createdAt: post.createdAt
                // }
            });
        })
        .catch(e => {
            
            console.log('e at catch:', e);

            if(!e.statusCode) {
                // server side error
                e.statusCode = 500;
            }

            // need next to get to central errorhanding at routes.
            next(e);

            // 1)
            // throw new Error(e);
        });

    // 201: success and resource was created.
    // 200: success! only.
//     res.status(201).json({
//         message: 'Post created successfully',
//         post: {
//             _id: new Date().toISOString(),
//             title,
//             content,
//             creator: { name: 'Max' },
//             createdAt: new Date()
//         }
//     });
}
