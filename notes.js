const { ipcRenderer } = require('electron');
const {Db, Note, Comment, Like, Collect} = require('./db.js');

let db = new Db('xhs_test.db');

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
        notes.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note';
            const title = document.createElement('h4');
            title.textContent = note.title;
            const content = document.createElement('p');
            content.textContent = note.content;
            div.appendChild(title);
            div.appendChild(content);
            notesContainer.appendChild(div);
        });
    });
}

listAllNotes(1, 10);