var express = require('express'),
      exphbs = require('express-handlebars'),
      morgan = require('morgan'),
      mongoose = require('mongoose'),
    methodOverride = require('method-override');
var path = require('path');
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");


// set up express app
// =============================================================
var PORT = process.env.PORT || 3000;
var app = express();

app
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(methodOverride('_method'))
    .use(morgan('dev'))
    .use(express.static("public"))
    .engine('handlebars', exphbs.engine({ defaultLayout: 'main'}))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'handlebars')
    .use(require('./controllers'));


// configure mongoose and start the server
// =============================================================
// set mongoose to leverage promises
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

require("dotenv").config();

// mongoose.connect(MONGODB_URI, { useUnifiedTopology: true });

mongoose.Promise = Promise;
console.log("process.env.MONGODB_URI: " + process.env.MONGODB_URI);
var dbURI = process.env.MONGODB_URI || "mongodb://127.0.0.1/news";
console.log("dbURI: " + dbURI);

// Database configuration with mongoose
//mongoose.connect(dbURI, { useUnifiedTopology: true }, { useNewUrlParser: true }, { dbName: "news" });
mongoose.connect(dbURI);

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
    console.log("Mongoose connection successful.");
    // start the server, listen on port 3000
    app.listen(PORT, function () {
        console.log("App running on port" + PORT);
    });
});

//module.exports = app;
