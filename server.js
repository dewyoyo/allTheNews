'use strict';

/**
 * 
 * Homework Assignment 18 - All the News That's Fit to Scrape
 * Jarrett Tolman - server.js
 * 
 */

// dependencies
// =============================================================
var express = require('express'),
      exphbs = require('express-handlebars'),
      bodyParser = require('body-parser'),
      logger = require('morgan'),
      mongoose = require('mongoose'),
      methodOverride = require('method-override');

// set up express app
// =============================================================
var PORT = process.env.PORT || 3000;
var app = express();

app
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended:true }))
    .use(bodyParser.text())
    .use(bodyParser.json({ type: 'application/vnd.api+json' }))
    .use(methodOverride('_method'))
    .use(logger('dev'))
    .use(express.static(__dirname + '/public'))
    .engine('handlebars', exphbs({ defaultLayout: 'main' }))
    .set('view engine', 'handlebars')
    .use(require('./controllers'));

// configure mongoose and start the server
// =============================================================
// set mongoose to leverage promises
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// mongoose.connect(MONGODB_URI);

mongoose.Promise = Promise;

var dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/news";

// Database configuration with mongoose
mongoose.connect(dbURI);

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
    // start the server, listen on port 3000
    app.listen(PORT, function() {
        console.log("App running on port" + PORT);
    });
});

module.exports = app;
