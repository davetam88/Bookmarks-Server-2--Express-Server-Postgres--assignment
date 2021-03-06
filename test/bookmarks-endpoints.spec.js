const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function () {

  before('BEFORE: make knex instance', () => {

    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })

    app.set('db', db)
  })

  after('AFTER: disconnect from db', () => db.destroy())

  before('BEFORE: clean the table', () => {
    db('bookmark_items').truncate()
  })

  afterEach('cleanup', () => db('bookmark_items').truncate())

  // for get /bookmarks  branch
  describe(`GET /bookmarks`, () => {
    context(`Given no bookmarks`, () => {
      it(`GET /bookmarks : responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks
        = makeBookmarksArray()

      beforeEach('GET /bookmarks : insert bookmarks', () => {
        return db
          .into('bookmark_items')
          .insert(testBookmarks)
      })

      it('GET /bookmarks : responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks)
      })
    })
  })

  // for get /bookmarks with ID
  describe(`GET /bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()
      beforeEach('GET /bookmarks(ID) : insert bookmarks', () => {
        return db
          .into('bookmark_items')
          .insert(testBookmarks)
      })

      it('GET /bookmarks(ID) : responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })
    })
  })

  // for post /bookmarks with data
  describe(`POST /bookmarks`, () => {
    context('Given Post of an bookmarks to the database', () => {
      it(`creates an bookmark, responding with 201 and the new bookmark`, function () {
        const newBookmark = {
          title: 'title 1',
          url: 'url 1',
          description: 'description 1',
          rating: '1'
        }
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title)
            expect(res.body.url).to.eql(newBookmark.url)
            expect(res.body.description).to.eql(newBookmark.description)
            expect(res.body.rating).to.eql(newBookmark.rating)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
          })
          .then(postRes =>
            supertest(app)
              .get(`/bookmarks/${postRes.body.id}`)
              .expect(postRes.body)
          )
      })
    })

    context('Given Post with an invalid rating range (not 1 to 5)', () => {
      it(`It will responding with 400 and a message`,
        function () {
          const newBookmark = {
            title: 'title 1',
            url: 'url 1',
            description: 'description 1',
            rating: '9'
          }
          return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .expect(400, {
              error: { message: `Rating must be a number between 1 to 5` }
            })
        })
    })
  })

  // for delete
  describe(`DELETE /bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {

      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .expect(404, {
            error: { message: `Bookmark doesn't exist` }
          })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_items')
          .insert(testBookmarks)
      })

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)

        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/bookmarks`)
              .expect(expectedBookmarks)
          )
      })
    })
  })
})

