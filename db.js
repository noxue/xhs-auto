
const sqlite3 = require('sqlite3').verbose();

// 定义 note 对象
class Note {
	constructor(noteId, title, link, coverImage, authorId, authorName, authorImageUrl, authorProfileLink, keyword, collectTime) {
		this.noteId = noteId;
		this.title = title;
		this.link = link;
		this.coverImage = coverImage;
		this.authorId = authorId;
		this.authorName = authorName;
		this.authorImageUrl = authorImageUrl;
		this.authorProfileLink = authorProfileLink;
		this.keyword = keyword;
		this.collectTime = collectTime;
	}
}

// 定义 comment 对象
class Comment {
	constructor(noteId, commentId, content, commentTime, userId, userName, userImageUrl, userProfileLink, isAuthor) {
		this.noteId = noteId;
		this.commentId = commentId;
		this.content = content;
		this.commentTime = commentTime;
		this.userId = userId;
		this.userName = userName;
		this.userImageUrl = userImageUrl;
		this.userProfileLink = userProfileLink;
		this.isAuthor = isAuthor;
	}
}

// 定义 like 对象
class Like {
	constructor(noteId, userId, likeTime) {
		this.noteId = noteId;
		this.userId = userId;
		this.likeTime = likeTime;
	}
}

// 定义 collect 对象
class Collect {
	constructor(noteId, userId, collectTime) {
		this.noteId = noteId;
		this.userId = userId;
		this.collectTime = collectTime;
	}
}

class Db {
	/**
		* create and connect to the database
		* @param {string} dbFile db file path
	*/
	constructor(dbFile) {
		this.db = new sqlite3.Database(dbFile, (err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Connected to the database.');
		});
		initDb(this.db);
	}

		/**
			* insert note data
			* @param {Note} note note object
		*/
		insertNoteData(note) {
            console.log(note)
			this.db.serialize(() => {
				this.db.get('SELECT * FROM notes WHERE noteId = ?', [note.noteId], (err, row) => {
					if (err) {
						throw err;
					}
					if (row) {
						console.log('已存在');
						return;
					} else {
						console.log('不存在');
                        // return;
                        
						this.db.run('INSERT INTO notes (noteId, title, link, coverImage, authorId, authorName, authorImageUrl, authorProfileLink, keyword, collectTime) VALUES ($noteId, $title, $link, $coverImage, $authorId, $authorName, $authorImageUrl, $authorProfileLink, $keyword, $collectTime)', {
                            $noteId: note.noteId,
                            $title: note.title,
                            $link: note.link,
                            $coverImage: note.coverImage,
                            $authorId: note.authorId,
                            $authorName: note.authorName,
                            $authorImageUrl: note.authorImageUrl,
                            $authorProfileLink: note.authorProfileLink,
                            $keyword: note.keyword,
                            $collectTime: note.collectTime
                        }, function(err) {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log('Insert successful');
                            }
                        });
                        

					}
				});
			});
		}

		/**
			* insert comment data
			* @param {Comment} comment comment object
			*/
		insertCommentData(comment) {
			this.db.serialize(() => {
				let stmt = this.db.prepare('INSERT INTO comments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
				stmt.run(comment.noteId, comment.commentId, comment.content, comment.commentTime, comment.userId, comment.userName, comment.userImageUrl, comment.userProfileLink, comment.isAuthor);
				stmt.finalize();
			});
		}

		/**
			* insert like data
			* @param {string} noteId note id
			* @param {string} userId user id
			* @param {string} likeTime like time
			*/
		insertLikeData(noteId, userId, likeTime) {
			this.db.serialize(() => {
				let stmt = this.db.prepare('INSERT INTO likes VALUES (?, ?, ?)');
				stmt.run(noteId, userId, likeTime);
				stmt.finalize();
			});
		}

		/**
			* insert collect data
			* @param {string} noteId note id
			* @param {string} userId user id
			* @param {string} collectTime collect time
			*/
		insertCollectData(noteId, userId, collectTime) {
			this.db.serialize(() => {
				let stmt = this.db.prepare('INSERT INTO collects VALUES (?, ?, ?)');
				stmt.run(noteId, userId, collectTime);
				stmt.finalize();
			});
		}

        queryAllNotes(page=1, pageSize=100, callback) {
            this.db.serialize(() => {
                let sql = 'SELECT * FROM notes LIMIT ? OFFSET ?';
                this.db.all(sql, [pageSize, (page - 1) * pageSize], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    callback(err, rows);
                });
            });
        }

        // select note total count
        /**
            * select note total count
            * @param {function} callback callback function
            * @returns {number} note total count
            **/
        selectNoteTotalCount(callback) {
            this.db.serialize(() => {
                let sql = 'SELECT COUNT(*) AS count FROM notes';
                this.db.get(sql, [], (err, row) => {
                    if (err) {
                        throw err;
                    }
                    callback(row.count);
                });
            });
        }
			// select note data by keyword pagination
			/**
				* select note data by keyword pagination
				* @param {string} keyword keyword
				* @param {number} page page number
				* @param {number} pageSize page size
				* @param {function} callback callback function
				* @returns {Array} note data
				**/
			selectNoteDataByKeywordPagination(keyword, page, pageSize, callback) {
				this.db.serialize(() => {
					let sql = 'SELECT * FROM notes WHERE keyword = ? LIMIT ? OFFSET ?';
					this.db.all(sql, [keyword, pageSize, (page - 1) * pageSize], (err, rows) => {
						if (err) {
							throw err;
						}
						callback(rows);
					});
				});
			}


				// 列出表中的所有关键字，不重复
				/**
					* 列出表中的所有关键字，不重复
					* @param {function} callback callback function
					* @returns {Array} keyword data
					* **/
				selectKeywordData(callback) {
					this.db.serialize(() => {
						let sql = 'SELECT DISTINCT keyword FROM notes';
						this.db.all(sql, [], (err, rows) => {
							if (err) {
								throw err;
							}
							callback(rows);
						});
					});
				}




			// select note data by note id
			/**
				* select note data by note id
				* @param {string} noteId note id
				* @param {function} callback callback function
				* @returns {Note} note data
				**/
			selectNoteDataByNoteId(noteId, callback) {
				this.db.serialize(() => {
					let sql = 'SELECT * FROM notes WHERE noteId = ?';
					this.db.get(sql, [noteId], (err, row) => {
						if (err) {
							throw err;
						}
						callback(row);
					});
				});
			}

			// select comment data by note id pagination
			/**
				* select comment data by note id pagination
				* @param {string} noteId note id
				* @param {number} page page number
				* @param {number} pageSize page size
				* @param {function} callback callback function
				* @returns {Array} comment data
				**/
			selectCommentDataByNoteIdPagination(noteId, page, pageSize, callback) {
				this.db.serialize(() => {
					let sql = 'SELECT * FROM comments WHERE noteId = ? LIMIT ? OFFSET ?';
					this.db.all(sql, [noteId, pageSize, (page - 1) * pageSize], (err, rows) => {
						if (err) {
							throw err;
						}
						callback(rows);
					});
				});
			}

            // query all comments pagination
            /**
                * query all comments pagination
                * @param {number} page page number
                * @param {number} pageSize page size
                * @param {function} callback callback function
                * @returns {Array} comment data
                **/
            queryAllCommentsPagination(page, pageSize, callback) {
                this.db.serialize(() => {
                    let sql = 'SELECT * FROM comments LIMIT ? OFFSET ?';
                    this.db.all(sql, [pageSize, (page - 1) * pageSize],callback);
                });
            }

            // get all comments count
            /**
                * get all comments count
                * @param {function} callback callback function
                * @returns {number} comment count
                **/
            getAllCommentsCount(callback) {
                this.db.serialize(() => {
                    let sql = 'SELECT COUNT(*) AS count FROM comments';
                    this.db.get(sql, [], (err, row) => {
                        if (err) {
                            throw err;
                        }
                        callback(row.count);
                    });
                });
            }


			// select like data pagination
			/**
				* select like data pagination
				* @param {number} page page number
				* @param {number} pageSize page size
				* @param {function} callback callback function
				* @returns {Array} like data
				**/
			selectLikeDataPagination(page, pageSize, callback) {
				this.db.serialize(() => {
					let sql = 'SELECT * FROM likes LIMIT ? OFFSET ?';
					this.db.all(sql, [pageSize, (page - 1) * pageSize], (err, rows) => {
						if (err) {
							throw err;
						}
						callback(rows);
					});
				});
			}

				// select collect data pagination
				/**
					* select collect data pagination
					* @param {number} page page number
					* @param {number} pageSize page size
					* @param {function} callback callback function
					* @returns {Array} collect data
					**/
				selectCollectDataPagination(page, pageSize, callback) {
					this.db.serialize(() => {
						let sql = 'SELECT * FROM collects LIMIT ? OFFSET ?';
						this.db.all(sql, [pageSize, (page - 1) * pageSize], (err, rows) => {
							if (err) {
								throw err;
							}
							callback(rows);
						});
					});
				}

					// delete all note data
					/**
						* delete all note data
						*/
					deleteAllNoteData() {
						this.db.serialize(() => {
							let sql = 'DELETE FROM notes';
							this.db.run(sql, [], (err) => {
								if (err) {
									throw err;
								}
							});
						});
					}

					// delete all comment data
					/**
						* delete all comment data
						*/
					deleteAllCommentData() {
						this.db.serialize(() => {
							let sql = 'DELETE FROM comments';
							this.db.run(sql, [], (err) => {
								if (err) {
									throw err;
								}
							});
						});
					}

					// delete all like data
					/**
						* delete all like data
						*/
					deleteAllLikeData() {
						this.db.serialize(() => {
							let sql = 'DELETE FROM likes';
							this.db.run(sql, [], (err) => {
								if (err) {
									throw err;
								}
							});
						});
					}

					// delete all collect data
					/**
						* delete all collect data
						*/
					deleteAllCollectData() {
						this.db.serialize(() => {
							let sql = 'DELETE FROM collects';
							this.db.run(sql, [], (err) => {
								if (err) {
									throw err;
								}
							});
						});
					}

}


function initDb(db) {
	// 创建表
	db.serialize(() => {
		// 创建一个表来获取采集的数据，
		/*
		字段：
			1. 笔记编号 唯一索引
			2. 笔记标题
			3. 笔记链接
			4. 笔记封面
			5. 作者编号
			6. 作者昵称
			7. 作者头像
			8. 作者主页链接
			9. 采集用的关键词
			10. 采集时间
            noteId, title, link, coverImage, authorId, authorName, authorImageUrl, authorProfileLink, keyword, collectTime
		*/
		db.run('CREATE TABLE IF NOT EXISTS notes (noteId TEXT KEY, title TEXT, link TEXT, coverImage TEXT, authorId TEXT, authorName TEXT, authorImageUrl TEXT, authorProfileLink TEXT, keyword TEXT, collectTime TEXT)');
		// 创建一个表来获取评论的数据
		/*
		字段：
			1. 笔记编号
			2. 评论编号
			3. 评论内容
			4. 评论时间
			5. 评论用户编号
			6. 评论用户昵称
			7. 评论用户头像
			8. 评论用户主页链接
			9. 是否是作者
		*/
		db.run('CREATE TABLE IF NOT EXISTS comments (noteId TEXT, commentId TEXT, content TEXT, commentTime TEXT, userId TEXT, userName TEXT, userImageUrl TEXT, userProfileLink TEXT, isAuthor INTEGER)');
		// 创建一个点赞表，记录当前登录的用户是否点赞了某个笔记
		/*
		字段：
			1. 笔记编号
			2. 用户编号
			3. 点赞时间
		*/
		db.run('CREATE TABLE IF NOT EXISTS likes (noteId TEXT, userId TEXT, likeTime TEXT)');
		// 创建一个收藏表，记录当前登录的用户是否收藏了某个笔记
		/*
		字段：
			1. 笔记编号
			2. 用户编号
			3. 收藏时间
		*/
		db.run('CREATE TABLE IF NOT EXISTS collects (noteId TEXT, userId TEXT, collectTime TEXT)');
	});
}


// 导出模块
module.exports = {
	Db,
	Note,
	Comment,
	Like,
	Collect
}
