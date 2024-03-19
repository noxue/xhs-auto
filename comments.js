const {Db, Note, Comment, Like, Collect} = require('./db.js');
const {ipcRenderer} = require('electron');
const {PostComment, AtUser} = require('./types.js');

let db = new Db('xhs_test.db');

let page = 1;
let pageSize = 30;
let totalPage = 0;

db.getAllCommentsCount((counts)=>{
    console.log("counts:"+counts)
    totalPage = Math.ceil(counts/pageSize);
    document.getElementById('comments-counts').innerHTML = counts;
    let currentPage = document.getElementById('current-page');
    currentPage.innerHTML = `${page}/${totalPage}`;
})

// 列表所有的评论，使用表格，显示 评论内容，评论人昵称，评论时间，
// db.run('CREATE TABLE IF NOT EXISTS comments (noteId TEXT, commentId TEXT, content TEXT, commentTime TEXT, userId TEXT, userName TEXT, userImageUrl TEXT, userProfileLink TEXT, isAuthor INTEGER)');

function listAllComments(page, pageSize) {
    db.queryAllCommentsPagination(page, pageSize, (err, rows) => {
        if (err) {
            console.error("errrrrrrr:"+err);
            return;
        }

        console.log(rows)
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = "";
        let comments = rows;

        // 创建表格 和 thead
        const table = document.createElement('table');
        table.className = 'table-striped';
        commentsContainer.appendChild(table);

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
        <th>评论人</th>
        <th>打开笔记</th>
        <th>是否是作者</th>
        <th>评论时间</th>
        <th>评论内容</th>
        </tr>`;
        table.appendChild(thead);

        
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        comments.forEach(comment => {
            //CREATE TABLE IF NOT EXISTS comments (noteId TEXT, commentId TEXT, content TEXT, commentTime TEXT, userId TEXT, userName TEXT, userImageUrl TEXT, userProfileLink TEXT, isAuthor INTEGER)
            // 显示 评论内容，评论人昵称，评论时间，评论人昵称变成超链接通过外部浏览器打开，用表格显示
            const tr = document.createElement('tr');
            tr.className = 'comment';
            const content = document.createElement('td');
            content.textContent = comment.content;
            const userName = document.createElement('td');
            userName.innerHTML = `<a href="${"https://www.xiaohongshu.com/user/profile/"+comment.userId}" target="_blank">${comment.userName}</a>`;
            const commentTime = document.createElement('td');
            // 时间戳转yydd hh:mm:ss
            commentTime.textContent =  new Date(parseInt(comment.commentTime)).toLocaleString();
            const openNote = document.createElement('td');
            openNote.innerHTML = `<a href="${"https://www.xiaohongshu.com/explore/"+comment.noteId}" target="_blank">打开笔记</a>`;
            const isAuthor = document.createElement('td');
            isAuthor.textContent = comment.isAuthor==1?"是":"-";

            tr.appendChild(userName);
            tr.appendChild(openNote);
            tr.appendChild(isAuthor);
            tr.appendChild(commentTime);
            tr.appendChild(content);
            tbody.appendChild(tr);
        });
        

    });
}

listAllComments(page, pageSize);

// 第一页
document.getElementById('first').addEventListener('click', ()=>{
    page = 1;
    listAllComments(page, pageSize);
    document.getElementById('current-page').innerHTML = `${page}/${totalPage}`;
})

// 上一页
document.getElementById('prev').addEventListener('click', ()=>{
    if(page>1){
        page--;
        listAllComments(page, pageSize);
        document.getElementById('current-page').innerHTML = `${page}/${totalPage}`;
    }
})

// 下一页
document.getElementById('next').addEventListener('click', ()=>{
    if(page<totalPage){
        page++;
        listAllComments(page, pageSize);
        document.getElementById('current-page').innerHTML = `${page}/${totalPage}`;
    }
})

// 最后一页
document.getElementById('last').addEventListener('click', ()=>{
    page = totalPage;
    listAllComments(page, pageSize);
    document.getElementById('current-page').innerHTML = `${page}/${totalPage}`;
})

// 删除所有评论
document.getElementById('delete-comments').addEventListener('click', ()=>{
    if(confirm("确定删除所有评论吗？")){
        db.deleteAllCommentData()
        listAllComments(page, pageSize);
         document.getElementById('comments-counts').innerHTML = 0;
    }
})


// follow
document.getElementById('follow').addEventListener('click', ()=>{
    let page = 1;
    let pageSize = 1;

    setInterval(() => {
        db.selectCommentUserDataPagination(page, pageSize, (err, rows) => {
            if (err) {
                console.error("errrrrrrr:"+err);
                return;
            }
            console.log(rows)
            let users = rows;
            users.forEach(user => {
                ipcRenderer.send('follow', user.userId);
            });
        });
        page++;
    }, 200);  
})

// event.sender.send('follow-result', {uid:uid, res:res});
ipcRenderer.on('follow-result', (event, arg) => {
    console.log(arg);
});


document.getElementById('post-comment').addEventListener('click', ()=>{
    let page = 1;
    let pageSize = 1;

    setInterval(() => {
        db.selectNoteDataPaginationByNotHasComments(page, pageSize, (err, rows) => {
            if (err) {
                console.error("errrrrrrr:"+err);
                return;
            }
            let notes = rows;
            notes.forEach(note => {
                let comment = new PostComment(note.noteId, "有需要直接私信我", "", [new AtUser("5b9c666e398e4d000138dcb2","点击这里私信我，买同款软件")]);
                ipcRenderer.send('post-comment', comment);
            });
        });
        page++;
    }, 3000);  
})