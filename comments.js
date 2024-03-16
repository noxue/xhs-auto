const {Db, Note, Comment, Like, Collect} = require('./db.js');
const {ipcRenderer} = require('electron');


let db = new Db('xhs_test.db');

/*
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="xel-theme" content="node_modules/xel/themes/cupertino.css">
		<meta name="xel-accent-color" content="orange">
		<meta name="xel-iconsets" content="node_modules/xel/iconsets/fluent.svg">
	<title>评论列表</title>
	<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
    <link rel = "stylesheet" type = "text/css" href = "comments.css" />
	<!-- 列表添加样式 -->
	<style>
		#search-container img{
			height:50px;
		}
	</style>
</head>
<body>
	<a href="./index.html">首页</a>
    <div class="header">
        <div>评论总数：<span id="comments-counts"></span></div>
        <div>当前页：<span id="current-page"></span></div>
        
        <x-buttons id="pagination">
            <!-- 第一页 -->
            <x-button id="first">
                <x-label>第一页</x-label>
            </x-button>
            <x-button id="prev">
                <x-label>上一页</x-label>
            </x-button>
            <x-button id="next">
                <x-label>下一页</x-label>
            </x-button>
            <x-button id="last">
                <x-label>最后一页</x-label>
            </x-button>
        </x-buttons>
        <!-- 删除按钮 -->
        <x-buttons id="delete">
            <x-button id="delete-comments">
                <x-label>删除所有评论</x-label>
            </x-button>
        </x-buttons>
    </div>
    
	<div id="comments-container"></div>
    
	<script src="node_modules/xel/xel.js" type="module"></script>
	<script src="./comments.js"></script>
</body>
</html>

参考下面代码

// 分页列出所有的笔记
function listAllNotes(page, pageSize) {

    db.queryAllNotes(page, pageSize, (err, rows) => {
        if (err) {
            console.error("errrrrrrr:"+err);
            return;
        }

        console.log(rows)
        const notesContainer = document.getElementById('notes-container');
        notesContainer.innerHTML = "";
        let notes = rows;

        // 创建表格 和 thead
        const table = document.createElement('table');
        table.className = 'table';
        notesContainer.appendChild(table);

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
        <th>标题</th>
        <th>作者</th>
        <th>关键词</th>
        <th>采集时间</th>
        </tr>`;
        notesContainer.appendChild(thead);

        notes.forEach(note => {
            //CREATE TABLE IF NOT EXISTS notes (noteId TEXT KEY, title TEXT, link TEXT, coverImage TEXT, authorId TEXT, authorName TEXT, authorImageUrl TEXT, authorProfileLink TEXT, keyword TEXT, collectTime TEXT)
            // 显示 标题，作者，关键词，作者编号，采集时间，标题变成超链接通过外部浏览器打开，用表格显示
            const tr = document.createElement('tr');
            tr.className = 'note';
            const title = document.createElement('td');
            title.innerHTML = `<a href="${"https://www.xiaohongshu.com"+note.link}" target="_blank">${note.title?note.title:"无标题"}</a>`;
            const author = document.createElement('td');
            author.innerHTML = `<a href="${"https://www.xiaohongshu.com/user/profile/"+note.authorProfileLink}" target="_blank">${note.authorId}</a>`;
            const keyword = document.createElement('td');
            keyword.textContent = note.keyword;
            const authorId = document.createElement('td');
            authorId.textContent = note.authorProfileLink;
            const collectTime = document.createElement('td');
            // 时间戳转yydd hh:mm:ss
            collectTime.textContent =  new Date(parseInt(note.collectTime)).toLocaleString();
            tr.appendChild(title);
            tr.appendChild(author);
            tr.appendChild(keyword);
            tr.appendChild(collectTime);
            notesContainer.appendChild(tr);
        });
        

    });
}

listAllNotes(page, pageSize);

*/

let page = 1;
let pageSize = 10;
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
        table.className = 'table';
        commentsContainer.appendChild(table);

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
        <th>评论人</th>
        <th>打开笔记</th>
        <th>评论内容</th>
        <th>评论时间</th>
        </tr>`;
        commentsContainer.appendChild(thead);

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
            tr.appendChild(userName);
            tr.appendChild(openNote);
            tr.appendChild(content);
            tr.appendChild(commentTime);
            commentsContainer.appendChild(tr);
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