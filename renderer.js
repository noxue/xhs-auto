const { ipcRenderer } = require('electron');


document.getElementById("follow").addEventListener('click', () => {
    ipcRenderer.send('follow', '');
})

document.getElementById("getComment").addEventListener('click', () => {
    ipcRenderer.send('comment', '');
})

 
ipcRenderer.on('comment-data', (event, data) => {
    const commentsContainer = document.getElementById('comments');
    console.log("xxxxxxxxxxxxxxx")
    let comments = data;
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment';

        const img = document.createElement('img');
        img.src = comment.user_info.image;

        const nickname = document.createElement('h4');
        nickname.textContent = comment.user_info.nickname;

        const content = document.createElement('p');
        content.textContent = comment.content;

        div.appendChild(img);
        div.appendChild(nickname);
        div.appendChild(content);

        commentsContainer.appendChild(div);
    });
});

document.getElementById("like").addEventListener('click', () => {
    ipcRenderer.send('like', '');
})

document.getElementById("collect").addEventListener('click', () => {
    ipcRenderer.send('collect', '');
})


document.getElementById("postComment").addEventListener('click', () => {
    ipcRenderer.send('post_comment', '');
})
