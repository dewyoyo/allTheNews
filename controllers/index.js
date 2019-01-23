const express = require('express'),
    router = express.Router(),
    request = require('request'),
    cheerio = require('cheerio'),
    Article = require('../models/article'),
    Note = require('../models/note');

    
   
// root route
router.get('/', function(req, res) {
    Article
        .find({})
        .where('saved').equals(false)
        .where('deleted').equals(false)
        .sort('-date')
        .limit(20)
        .exec(function(error, articles) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                console.log(articles);
                let hbsObj = {
                    title: 'All the News That\'s Fit to Scrape',
                    subtitle: 'NPR News',
                    articles: articles
                };
                res.render('index', hbsObj);
            }
        });
});

// saved articles
router.get('/saved', function(req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(false)
        .populate('notes')
        .sort('-date')
        .exec(function(error, articles) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                console.log(articles);
                let hbsObj = {
                    title: 'All the News That\'s Fit to Scrape',
                    subtitle: 'NPR News',
                    articles: articles
                };
                res.render('saved', hbsObj);
            }
        });
});



// deleted articles
router.get('/deleted', function(req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(true)
        .populate('notes')
        .sort('-date')
        .exec(function(error, articles) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                console.log(articles);
                let hbsObj = {
                    title: 'All the News That\'s Fit to Scrape',
                    subtitle: 'NPR News',
                    articles: articles
                };
                res.render('deleted', hbsObj);
            }
        });
});


//=======================api/articles==============================

// get all articles from database
router.get('/api/articles', function(req, res) {
    Article
        .find({})
        .exec(function(error, docs) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.status(200).json(docs);
            }
        });
});

// get all saved articles
router.get('/api/articles/saved', function(req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(false)
        .populate('notes')
        .exec(function(error, docs) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.status(200).json(docs);
            }
        });
});


// save an article
router.post('/api/articles/save/:id', function(req, res) {
    Article.findByIdAndUpdate(req.params.id, {
        $set: { saved: true}
        },
        { new: true },
        function(error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/');
            }
        });
});

// // dismiss a scraped article
// router.delete('/api/articles/dismiss/:id', function(req, res) {
//     Article.findByIdAndUpdate(req.params.id,
//         { $set: { deleted: true } },
//         { new: true },
//         function(error, doc) {
//             if (error) {
//                 console.log(error);
//                 res.status(500);
//             } else {
//                 res.redirect('/');
//             }
//         });
// });

// delete a saved article
router.delete('/api/articles/:id', function(req, res) {
    Article.findByIdAndUpdate(req.params.id,
        { $set: { deleted: true} },
        { new: true },
        function(error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/saved');
            }
        }
    );
});

// restore a saved article-------chris
router.post('/api/restore/:id', function(req, res) {
    Article.findByIdAndUpdate(req.params.id,
        { $set: { deleted: false} },
        { new: true },
        function(error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/saved');
            }
        }
    );
});

// scrape articles
router.get('/api/articles/scrape', function(req, res, next) {
    request('https://www.npr.org/sections/news/', function(error, response, html) {
        let $ = cheerio.load(html);
        let results = [];
        $('article').each(function(i, e) {
            // Add the text and href of every link, and save them as properties of the result object
        // result.title = $(this).children('.item-info').children('.title').children('a').text();
        // result.link = $(this).children('.item-info').children('.title').children('a').attr('href');

            // let summary = $(this).children('.item-info').children('.teaser').children('a').text()
            
            let title = $(this).children('.item-info').children('.title').children('a').text(),
                link = $(this).children('.item-info').children('.title').children('a').attr('href'),
                single = {};
            if (link !== undefined && link.includes('http') &&  title !== '') {
                single = {
                    title: title,
                    link: link
                };
                // create new article
                let entry = new Article(single);
                // save to database
                entry.save(function(err, doc) {
                    if (err) {
                        if (!err.errors.link) {
                            console.log(err);
                        }
                    } else {
                        console.log('new article added');
                    }
                });
            }
        });
        next();
    });
}, function(req, res) {
    res.redirect('/');
});


//===========================api/notes====================

// get all notes
router.get('/api/notes', function(req, res) {
    Note
        .find({})
        .exec(function(err, notes) {
            if (err) {
                console.log(err);
                res.status(500);
            } else {
                res.status(200).json(notes);
            }
        });
});




// add a note to a saved article
router.post('/api/notes/:id', function(req, res) {
    let newNote = new Note(req.body);
    console.log(req.body);
    newNote.save(function(err, doc) {
        if (err) {
            console.log(err);
            res.status(500);
        } else {
            Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { 'notes': doc.id } },
                function(error, newDoc) {
                    if (error) {
                        console.log(error);
                        res.status(500);
                    } else {
                        res.redirect('/saved');
                    }
                }
            );
        }
    });
});

// delete a note from a saved article
router.delete('/api/notes/:id', function(req, res) {
    Note.findByIdAndRemove(req.params.id, function(err, note) {
        if (err) {
            console.log(err);
            res.status(500);
        } else {
            res.redirect('/saved');
        }
    });
});



module.exports = router;
