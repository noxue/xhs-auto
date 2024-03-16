const {Db, Note, Comment, Like, Collect} = require('./db.js');
const {ipcRenderer} = require('electron');


let db = new Db('xhs_test.db');


let page = 1;
let pageSize = 10;
let totalPage = 0;

// current-page
const currentPage = document.getElementById('current-page')

db.selectNoteTotalCount((counts)=>{
    console.log("counts:"+counts)
    totalPage = Math.ceil(counts/pageSize);
    document.getElementById('notes-counts').innerHTML = counts;
    currentPage.innerHTML = `${page}/${totalPage}`;
})

// first
document.getElementById("first").addEventListener('click', () => {
    page = 1;
    listAllNotes(page, pageSize);
    currentPage.innerHTML = `${page}/${totalPage}`;
})

// last
document.getElementById("last").addEventListener('click', () => {
    page = totalPage;
    listAllNotes(page, pageSize);
    currentPage.innerHTML = `${page}/${totalPage}`;
})


document.getElementById("prev").addEventListener('click', () => {
    if (page > 1) {
        page--;
        listAllNotes(page, pageSize);
        currentPage.innerHTML = `${page}/${totalPage}`;
    }
})

document.getElementById("next").addEventListener('click', () => {
    page++;
    if (page <= totalPage) {
        listAllNotes(page, pageSize);
        currentPage.innerHTML = `${page}/${totalPage}`;
    } else {
        page--;
    }
})

// delete
document.getElementById("delete").addEventListener('click', () => {
    // 弹出提示框 确认后才能删除
    let r = confirm("确认删除所有笔记?");
    if (r == true) {
        db.deleteAllNoteData();
        listAllNotes(page, pageSize);
    }
})

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
        <th>评论采集状态</th>
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

            const commentStatus = document.createElement('td');
            // 0=未采集 1=采集中 2=已采集
            commentStatus.textContent = note.hasComments// == 0?"未采集":(note.hasComments == 1?"采集中":"已采集");
            tr.appendChild(commentStatus);
            notesContainer.appendChild(tr);
        });
        

    });
}

listAllNotes(page, pageSize);




// =================笔记评论------------------------------


let currentNote = 0;
let totalNote = 0;

db.selectNoteTotalCount((counts)=>{
    totalNote = counts;
    document.getElementById('total-note').innerHTML = counts;
})

document.getElementById("collect-comment-button").addEventListener('click', () => {
    collectComment();
})

let stopComment = false;
// stop stopComment
document.getElementById("stop-comment-button").addEventListener('click', () => {
    stopComment = true;
    ipcRenderer.send('stopComment', '');
})

function collectComment(){
    let noteCommentPage = 1;
    let noteCommentPageSize = 1;
    stopComment = false;
    const timer = setInterval(() => {
        if(stopComment){
            clearInterval(timer);
            return;
        }
        db.selectNoteDataPaginationByNotHasComments(noteCommentPage, noteCommentPageSize, (err, notes)=>{
            if (err) {
               console.error("errrrrrrr:"+err);
               return;
           }
           if(notes.length == 0){
               alert("没有更多的笔记了")
               return;
           }
   
           notes.forEach(note => {
                if(stopComment){
                    clearInterval(timer);
                    return;
                }
               console.log("get comment noteId:"+note.noteId)
               // 采集评论
               ipcRenderer.send('getComment', note.noteId);
               db.updateNoteHasCommentsByNoteId(note.noteId);
               currentNote++;
           })
       })
       noteCommentPage++;


         if(currentNote >= totalNote){
              clearInterval(timer);
         }

    }, 1000);
}

let totalComment = 0;
ipcRenderer.on('comment-data', (event, data) => {
    let comments = data;
    document.getElementById('current-note').innerHTML = currentNote;
    console.log("comments:"+comments.length)
    totalComment += comments.length;
    console.log("comments.length:"+comments.length)
    document.getElementById('current-comment').innerHTML = totalComment;
    // 保存到数据库
    comments.forEach(comment => {
        db.insertCommentData(new Comment(
            comment.note_id,
            comment.id,
            comment.content,
            comment.create_time,
            comment.user_info.user_id,
            comment.user_info.nickname,
            comment.user_info.image,
            "",
            0
        ));

        if(comment.sub_comments.length > 0){
            comment.sub_comments.forEach(subComment => {
                db.insertCommentData(new Comment(
                    subComment.note_id,
                    subComment.id,
                    subComment.content,
                    subComment.create_time,
                    subComment.user_info.user_id,
                    subComment.user_info.nickname,
                    subComment.user_info.image,
                    subComment.target_comment.id,
                    0
                ));
            })
        }
    });

    // db.updateNoteHasCommentsByNoteId(note.noteId);
    if(comments.length > 0){
        db.updateNoteHasCommentsByNoteId(comments[0].note_id, 2);
    }
});

