const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const BookmarksService = require('./bookmarks-service')
const { getBookmarkValidationError } = require('./bookmark-validator')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})


// for / get and post 
bookmarksRouter
  .route('/')
  .get((req, res, next) => {

    BookmarksService.getAllBookmarks(
      req.app.get('db')
    )
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, rating }

    // check for required fields
    for (const [key, value] of Object.entries(newBookmark))
    {
      if (value == null)
      {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    const error = getBookmarkValidationError(newBookmark)


    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        // console.log(`bookmark :>> `, bookmark) ||
        res
          .status(201)
          // .location(`/bookmarks/${bookmark.id}`)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark)
      })
      .catch(next)
  })

// for / get with route id : get, delete and patch
bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(bookmark => {
        if (!bookmark)
        {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark // save the bookmark for the next middleware
        next() // don't forget to call next so the next middleware happens!
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      title: xss(res.bookmark.title), // sanitize title
      url: xss(res.bookmark.url), // sanitize url
      description: xss(res.bookmark.description), // sanitize description
      rating: res.bookmark.rating,
    })
  })

  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url } = req.body
    const bookmarkToUpdate = { title, url }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
    {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title' or 'url'`
        }
      })
    }
    const error = getBookmarkValidationError(bookmarkToUpdate)
    if (error) return res.status(400).send(error)

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })


module.exports = bookmarksRouter

