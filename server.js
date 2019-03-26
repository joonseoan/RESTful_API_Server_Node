const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');


const feedRoutes = require('./routes/feed');
const { mongoKey } = require('./config/keys');
const Mongo_URI = `mongodb+srv://joon:${mongoKey}@firstatlas-drwhc.mongodb.net/messages`;


const app = express();
// for incomming data!!!! based on json.
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    // Access-Control-Allow-Origin: set up that client allows cross origin resource sharing
    //  "*":  any clients or we can specify like "codepen.io"
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    // make the client set Content-Type and Authorization (to be discussed)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

// errors because of "next(e)"
app.use((error, req, res, next) => {
    console.log('error in server.js', error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message });
});

mongoose
  .connect(Mongo_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('Server is up!');
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });
