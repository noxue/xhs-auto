const sqlite3 = require('sqlite3').verbose();

// 打开一个数据库,如果没有就创建
let db = new sqlite3.Database('test.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// 创建表
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS search (title TEXT, link TEXT, coverImage TEXT, noteId TEXT, authorName TEXT, authorImageUrl TEXT, authorProfileLink TEXT, authorUserId TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS comment (user_info TEXT, content TEXT)');
});

// 插入数据
db.serialize(() => {
    let stmt = db.prepare('INSERT INTO search VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run('馃殑杩欐牱璁㈢伀杞︾エ鍙互绔嬪噺15r', '/search_result/65e5a00f0000000001028a7b', null, '65e5a00f0000000001028a7b', '鍚岀▼鏃呰绉嶈崏鏈?', 'https://sns-avatar-qc.xhscdn.com/avatar/645c946916d44a000170c5a5.jpg?imageView2/2/w/80/format/jpg?imageView2/2/w/60/format/webp|imageMogr2/strip', '/user/profile/60c988c3000000000101daf9', '60c988c3000000000101daf9');
    stmt.finalize();
});

// 查询数据
db.all('SELECT * FROM search', (err, rows) => {
    if (err) {
        throw err;
    }
    rows.forEach((row) => {
        console.log(row.title);
    });
});