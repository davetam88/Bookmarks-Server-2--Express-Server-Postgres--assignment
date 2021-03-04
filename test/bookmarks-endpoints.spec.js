const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function () {

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
  })
})
