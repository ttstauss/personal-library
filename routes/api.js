/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict'

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const mongoose = require('mongoose')

const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

// connect to db
mongoose.connect(process.env.DB)

// set up mongoose schema & model
const Schema = mongoose.Schema

const bookSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  commentcount: {
    type: Number,
    default: 0
  }
})

const commentsSchema = new Schema({
  comments: [{
    type: String
  }],
  book: {
    type: mongoose.Schema.ObjectId,
    ref: 'Book'
  }
})

const Book = mongoose.model('Book', bookSchema)
const Comments = mongoose.model('Comments', commentsSchema)

// set up db functions
const getBooks = done => {
  Book.find({}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const createAndSaveBook = (title, done) => {
  const book = new Book({title})
  book.save((err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const deleteBooks = done => {
  Book.deleteMany({}, {}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const getBook = (bookId, done) => {
  Book.findOne({_id: bookId}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const addComment = (bookId, newComment, done) => {
  Comments.findOne({book: bookId}, (err, data) => {
    if(!data) {
      const comment = new Comments({book: bookId})
      comment.comments.push(newComment)
      comment.save((err, data) => {
        if(err) return done(err)
        Book.findOne({_id: bookId}, (err, data) => {
          if(err) return done(err)
          data.commentcount++
          data.save((err, data) => {
            if(err) return done(err)
            return done(null, {
              _id: data._id,
              title: data.title,
              comments: [newComment]
            })
          })
        })
      })
    } else {
      data.comments.push(newComment)
      const allComments = data.comments
      data.save((err, data) => {
        if(err) return done(err)
        Book.findOne({_id: bookId}, (err, data) => {
          if(err) return done(err)
          data.commentcount++
          data.save((err, data) => {
            if(err) return done(err)
            return done(null, {
              _id: data._id,
              title: data.title,
              comments: allComments
            })
          })
        })
      })
    }
  })
}

const getComments = (bookId, done) => {
  Comments.findOne({book: bookId}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const deleteBook = (bookId, done) => {
  Book.findOneAndDelete(bookId, (err, data) => {
    if(err) return done(err)
    Comments.findOneAndDelete({book: bookId}, (err, data) => {
      if(err) return done(err)
      return done(null, data)
    })
  })
}

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      getBooks((err, data) => {
        res.json(data)
      })
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
    })
    
    .post(function (req, res){
      var title = req.body.title;
      if (!title) { return res.json('title required') }
      createAndSaveBook(title, (err, data) => {
        res.json(data)
      })
      //response will contain new book object including atleast _id and title
    })
    
    .delete(function(req, res){
      deleteBooks((err, data) => {
        res.json('complete delete successful')
      })
      //if successful response will be 'complete delete successful'
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookId = req.params.id;
      getBook(bookId, (err, data) => {
        if (!data) {
          return res.json('no book exists')
        }
        const bookData = data
        getComments(bookId, (err, data) => {
          if(!data) {
            res.json({
              _id: bookData._id,
              title: bookData.title,
              comments: []
            })
          } else {
            res.json({
              _id: bookData._id,
              title: bookData.title,
              comments: data.comments
            })
          }
        })
      })
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    
    .post(function(req, res){
      var bookId = req.params.id;
      var comment = req.body.comment;
      getBook(bookId, (err, data) => {
        const bookData = data
        addComment(bookId, comment, (err, data) => {
          res.json({
            _id: bookData._id,
            title: bookData.title,
            comments: data.comments
          })
        })
      })
      //json res format same as .get
    })
    
    .delete(function(req, res){
      var bookId = req.params.id;
      if(!bookId) { return res.json('invalid ID') }
      deleteBook(bookId, (err, data) => {
        res.json('delete successful')
      })
      //if successful response will be 'delete successful'
    });
  
};
