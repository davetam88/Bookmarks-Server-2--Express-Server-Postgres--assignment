const BookmarkService = {
  getAllBookmarks(db) {
    return db('bookmark_items')
      .select('*');
  },

  insertBookmark(db, data) {
    return db('bookmark_items')
      .insert(data)
      .returning('*')
      .then(rows => ({
        ...data, id: rows[0].id
      }))
  },

  getById(db, id) {
    return db('bookmark_items')
      .select('*')
      .where({ id })
      .first();
  },
  // .first, select the first item found.

  deleteBookmark(db, id) {
    return db('bookmark_items')
      .where({ id })
      .delete();
  },

  updateBookmark(db, id, data) {
    return db('bookmark_items')
      .where({ id })
      .update(data);
  }
};

module.exports = BookmarkService;


