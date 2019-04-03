const { validationResult } = require('express-validator/check');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {

    // Don't be confused with res.json(nothing)!!!!!
    // It is to make the json format into javascript plain object, provided by javascript engine, not by express

    // json({}): express's built-in method to convert the object to json format.
    //  because http can't recognize object format, but json format.

    // json({}) automatically sets up Content-Type: application/json!!!!!!!!!!***********************************
    // res.json({ posts: [{ title: 'First Post', content: 'This is the first post.'}]})

    // json({}) is only for responding(sending) toward the client.!!!!!!
    //   not receiving the request from the client
    
    // 2) With Pagination
    // "query": built-in req method.
    // It is because requesting url in frontend
    //   is "http://localhost:8080/feed/posts?page=pageNumber"
    // "|| 1": in case that req.query.page is not definded
    const currentPage= req.query.page || 1;
    const perPage = 2;
    let totalItems;

    // Total number of documents === total posts that are posted.
    // "countDocuments" : counts the total number of posts.
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .populate('creator')
                // when currentPage 1 => skip 0 posts
                // when currentPage 2 => skip 0, 1 then starts element 2 in an array
                // when currentPage 3 => skip 0, 1, 2, 3 then starts element 4 in an arry
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(posts => {
            // console.log('posts => only 2 posts with skip number', posts)
            if(!posts) {
                const error = new Error('Unable to find the post list.');
                error.statusCode = 422;
                throw error;
            }

            res.status(200).json({
                message: 'successfully fetched the post list.',
                posts,
                // totalItems is defined in fronEnd.
                totalItems
            });
            
        })
        .catch(e => {

            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);

        });

    // 1) Since we addded pagination
    // Post.find()
    //     .then(posts => {
    //         if(!posts) {
    //             const error = new Error('Unable to find the post list.');
    //             error.statusCode = 422;
    //             throw error;
    //         }

    //         res.status(200).json({
    //             message: 'successfully fetched the post list.',
    //             posts
    //         });
    //     })
    //     .catch(e => {

    //         console.log('e at catch:', e);

    //         if(!e.statusCode) {
    //             // server side error
    //             e.statusCode = 500;
    //         }

    //         // need next to get to central errorhanding at routes.
    //         next(e);

    //     });


    // 1) with Dummy
    // shall add status code if it is not "200" which is default value.
    // res.status(200).json({ 
    //     posts: [
    //         {
    //             _id: '1', 
    //             title: 'First Post', 
    //             content: 'This is the first post.',
    //             imageUrl: 'images/lady.PNG',
    //             creator: {
    //                 name: 'Joon'
    //             },
    //             createdAt: new Date()
    //         }
    //     ]
    // });
};

// body-parsor needed to get the client's request.
//  because req's fields are always json in RESTUL API.
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
        // No need next(error) here because it is not the promise error.
        // It is an error at express routes
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

    if(!req.file) {
        const error = new Error('Unable to get image file.');
        error.statusCode = 422;
        throw error;
    }

    // console.log('req.file: ', req.file);
    const userId = req.userId;
    const title = req.body.title;
    const content = req.body.content;

    // when using OSX
    // const imageUrl = req.file.path;
    const imageUrl = req.file.path.replace("\\" ,"/");    
    let creatorProfile;

    if(!userId) {
        const error = new Error('Unable to get userId to create post.');
        error.statusCode = 422;
        throw error;
    }

    const post = new Post({
        title,
        imageUrl,
        content,
        creator: userId
    });

    post.save()
        .then(() => {
            return User.findById(userId);    
        })
        .then(user => {
            if(!user) {
                const error = new Error('Unable to find the user who posted');
                error.statusCode = 422;
                throw error;
            }
            // console.log('user: ==========> ', user)
            creatorProfile = user;
            user.posts = [ ...user.posts, post ];
            return user.save();
        })
        .then(() => {
            //console.log('user =============================> ', user)
            res.status(201).json({
                message: 'Post created successfully',
                post,
                creator: { _id: creatorProfile._id, name: creatorProfile.name }
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

exports.getPost = ((req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .populate('creator')
        .then(post => {
            // if(!post) throw new Error('Unable  to find the post.');
            if(!post) {
                const error = new Error('Unable to find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ 
                message: 'The post successfully fetched.',
                post 
            });
        })
        .catch(e => {
            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        });
});

exports.updatePost = (req, res, next) => {

    const postId = req.params.postId;
    const userId = req.userId;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed. Entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }

    const { title, content } = req.body;
    
    // when the user does not select a file (empty)
    //  but the existing image is available. (test it)

    // It is from state value of react which is stored.
    let imageUrl = req.body.image;

    console.log('imageUrl: ', imageUrl);
    // console.log('req.file.path', req.file);

    // when the user selects a new file.
    if(req.file) {
        imageUrl = req.file.path.replace("\\" ,"/");
    }

    if(!imageUrl) {
        const error = new Error('Unable to find image Error');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Unable to find the post to be updated.');
                error.statusCode = 422;
                throw error;
            }

            // Update will be enabled only with the user registered for.
            // The different logged-in user is not able to update the post.
            //  ******************************************************************************** must compare userId and id in post!!!!
            //  if it is not looking only for user by using findById(userId)
            if(post.creator.toString() !== userId) {
                const error = new Error('The post is not for the current logged-in user');
                error.statusCode = 403;
                throw error;
            }

            // the existing url should be deleted (because it is not necessary),
            //  if the new image path is entered.
            if(imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }

            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;

            return post.save();
        })
        .then(updatedPost => {

            res.status(200).json({
                message: 'successfully updated',
                post: updatedPost
            });

        })
        .catch(e => {
            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        })
};

exports.deletePost= (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.userId;

    // to verify the post is availablefirst.
    //  so that fidndByIdAndRemove is not used here.
    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Unable to find the post to delete');
                error.statusCode = 422;
                throw error;
            }

            // Update will be enabled only with the user registered for.
            // The different logged-in user is not able to update the post.
            //  ******************************************************************************** must compare userId and id in post!!!!
            //  if it is not looking only for user by using findById(userId)
            if(post.creator.toString() !== userId) {
                const error = new Error('The post is not for the current logged-in user');
                error.statusCode = 403;
                throw error;
            }

            //check logged in user later on
            clearImage(post.imageUrl);

            return Post.findOneAndDelete({_id: postId});
        
        })
        .then(() => {
            return User.findById(userId);
        })
        .then(user => {
            // *********************************
            // delete post in an array of "posts"
            //  if the "ids" in the posts array
            //  are same as "postID", an argument here. 
            user.posts.pull(postId);

            // Then, must save!!!!!!!!!!!!!!!!! again.
            return user.save();
        })
        .then(post => {
            res.status(200).json({
                message: 'successfully deleted',
               // post
            });
        })
        .catch(e => {
            if(!e.statusCode){
                e.statusCode = 500;
            }
            next(e);
        })

};

const clearImage = filePath => {
    // filePath contains /images/fileName;
    console.log('filePath argument in clearImage function', filePath)
    filePath = path.join(__dirname, '..', filePath);
    // ************** remove file!
    fs.unlink(filePath, err => {
        console.log(err);
    });
};
