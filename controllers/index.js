const express = require('express'),
    router = express.Router(),
    request = require('request'),
    cheerio = require('cheerio'),
    exphbs = require('express-handlebars'),
    Article = require('../models/article'),
    Note = require('../models/note');
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");


// root route
router.get('/', function (req, res) {
    Article
        .find({})
        .where('saved').equals(false)
        .where('deleted').equals(false)
        .sort('-date')
        .limit(30)
//        .exec(function (error, articles) {
//            if (error) {
//                console.log(error);
//                res.status(500);
//            } else {
//                console.log(articles);
//                    let hbsObj = {
//                        title: 'All the News That\'s Fit to Scrape',
//                        subtitle: 'NPR News',
//                        articles: articles
//                    };
        .then((articles) => {
            //console.log("getarticles:" + articles);
            let hbsObj = {
                title: 'All the News That\'s Fit to Scrape',
                subtitle: 'NPR News',
                articles: articles.map(article => article.toJSON())
            };
            console.log(res);

            res.render('index', hbsObj);
            
        }).catch((err) => {
            //catch error
            console.log(err);
        });
});

// saved articles
router.get('/saved', function (req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(false)
        .populate('notes')
        .sort('-date')
        .then((articles) => {
            console.log(articles);
            let hbsObj = {
                title: 'All the News That\'s Fit to Scrape',
                subtitle: 'NPR News',
                articles: articles.map(article => article.toJSON())
            };
            res.render('saved', hbsObj);

        }).catch((err) => {
            //catch error
            console.log(err);
        });
});



// deleted articles
router.get('/deleted', function (req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(true)
        .populate('notes')
        .sort('-date')
        .then((articles) => {
            console.log(articles);
            let hbsObj = {
                title: 'All the News That\'s Fit to Scrape',
                subtitle: 'NPR News',
                articles: articles.map(article => article.toJSON())
            };
            res.render('deleted', hbsObj);
        }).catch((err) => {
            console.log(err);
        });
});


//=======================api/articles==============================

// get all articles from database
router.get('/api/articles', function (req, res) {
    Article
        .find({})
        .then((docs) => {

            res.status(200).json(docs);

        }).catch((err) => {
            console.log(err);
        });
});

// get all saved articles
router.get('/api/articles/saved', function (req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(false)
        .populate('notes')
        .then((docs) => {
            res.status(200).json(docs);
        }).catch((err) => {
            console.log(err);
        });
});


// save an article
router.post('/api/articles/save/:id', function (req, res) {
 //   Article.findByIdAndUpdate(req.params.id, {
 //       $set: { saved: true }
//    },
//        { new: true },
//        function (error, doc) {
//            if (error) {
//                console.log(error);
//                res.status(500);
//            } else {
//                res.redirect('/');
//            }
//        });

    Article.findByIdAndUpdate(req.params.id, { $set: { saved: true } }, { new: true }).then((docs) => {
        if (docs) {
            console.log("success");
            res.redirect('/saved');
        } else {
            console.log("no such article exist");
        }
    }).catch((err) => {
        console.log(err);
    })


});


// delete a saved article
router.delete('/api/articles/:id', function (req, res) {
    Article.findByIdAndUpdate(req.params.id, { $set: { deleted: true } }, { new: true }).then((error) => {
            res.redirect('/saved');
    }).catch((err) => {
        console.log(err);
        res.status(500);
    })

});

// restore a saved article
router.post('/api/restore/:id', function (req, res) {
    Article.findByIdAndUpdate(req.params.id, { $set: { deleted: false } }, { new: true }).then((error) => {
            res.redirect('/deleted');
    }).catch((err) => {
        consosle.log(err);
        res.status(500);
    })

});

// scrape articles
router.get('/api/articles/scrape', function (req, res, next) {
    // First, we grab the body of the html with axios
    axios.get("https://www.npr.org/sections/news/").then((response) => {
        // Then, we load that into cheerio and save it to $ for a shorthand selector

        //console.log(response);
        var $ = cheerio.load(response.data);
        //console.log("response.data:" + response.data);

        //console.log($("article"));

        //let article = $('article');
        //console.log(article.text());

        // Now, we grab every h2 within an article tag, and do the following:
        $("article").each((i, element) => {
            // Save an empty result object
            var result = {};
            //$("article").children('.item-image').children('.imagewrap').children('a').children('img').children('src');

            if ($(element).children('.item-image').children('.imagewrap').children('a').children('picture').children('img').attr('src') == null) {
                next();
            }
            else {
                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(element).children('.item-info-wrap').children('.item-info').children('.title').children('a').text();
                result.link = $(element).children('.item-info-wrap').children('.item-info').children('.teaser').children('a').attr('href');
                result.summary = $(element).children('.item-info-wrap').children('.item-info').children('.teaser').children('a').text();
                result.imageURL = $(element).children('.item-image').children('.imagewrap').children('a').children('picture').children('img').attr('src');

                //console.log(result.imageURL);
                // create new article
                let entry = new Article(result);
                //console.log(entry);
                // save to database
                entry.save().then((doc) => {
                    console.log('new article added');
                }).catch((err) => {
                    console.log(err.message);
                });

            }

        }).catch((err) => {
            console.log(err);
        });
        next();
    }).catch((err) => {
        console.log(err);
    });


}, function (req, res) {
    res.redirect('/');
});


//===========================api/notes====================

// get all notes
router.get('/api/notes', function (req, res) {
    Note
        .find({})
        .then((notes) => {
            res.status(200).json(notes);
        }).catch((err) => {
            console.log(err);
        });
});




// add a note to a saved article
router.post('/api/notes/:id', function (req, res) {
    let newNote = new Note(req.body);
    console.log(req.body);
//    newNote.save(function (err, doc) {
//        if (err) {
//            console.log(err);
//            res.status(500);
//        } else {
//            Article.findOneAndUpdate(
//                { _id: req.params.id },
//                { $push: { 'notes': doc.id } },
//                function (error, newDoc) {
//                    if (error) {
//                        console.log(error);
//                        res.status(500);
//                    } else {
//                        res.redirect('/saved');
//                    }
//                }
//            );
//        }
//    });

    // save to database
    newNote.save().then((doc) => {
        console.log('new note added');

        //if the new note created, then update the article
        Article.findByIdAndUpdate(req.params.id, { $push: { 'notes': doc.id } }).then((docs) => {
            if (docs) {
                console.log("success");
                res.redirect('/saved');
            } else {
                console.log("no such article exist");
            }
        }).catch((err) => {
            console.log(err);
        });

    }).catch((err) => {
        console.log(err.message);
    });



});

// delete a note from a saved article
router.delete('/api/notes/:id', function (req, res) {
    Note.findByIdAndRemove(req.params.id).then((note) => {

        if (note) {
            console.log("success");
            res.redirect('/saved');
        } else {
            console.log("no such article exist");
        }

    }).catch((err) => {
        console.log(err);
        res.status(500);
    });
});



module.exports = router;
