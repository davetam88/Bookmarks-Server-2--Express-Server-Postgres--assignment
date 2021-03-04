require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const BookmarksService = require('./bookmarks-service')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

// http://localhost:8000/
app.get('/', (req, res) => {
  res.send('Hello, world!')
})

// GET /bookmarks endpoint via  BookmarksService
app.get('/bookmarks', (req, res, next) => {

  const knexInstance = req.app.get('db')
  BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      return (res.json(bookmarks))
    })
    .catch(next)
})


app.get('/bookmarks/:bookmark_id', (req, res, next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getById(knexInstance, req.params.bookmark_id)
    .then(bookmark => {
      if (!bookmark)
      {
        return res.status(404).json({
          error: { message: `Bookmark doesn't exist` }
        })
      }
      // replace next line with code 1 below if there is date issue with window OS.
      res.json(bookmark)
    })
    .catch(next)
})

app.use(function errorHandler(error, req, res, next) {
  let response
  if (process.env.NODE_ENV === 'production')
  {
    response = { error: { message: 'server error' } }
  } else
  {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app

