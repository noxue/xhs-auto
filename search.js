const { ipcRenderer } = require('electron');


document.getElementById("search-button").addEventListener('click', () => {
    // search-input
    let keyword = document.getElementById("search-input").value;
    if (!keyword) {
        alert("请输入关键词")
        return;
    }
    ipcRenderer.send('search', keyword);
})

document.getElementById("collect-button").addEventListener('click', () => {
    // search-input
    let keyword = document.getElementById("search-input").value;
    if (!keyword) {
        alert("请输入关键词")
        return;
    }
    ipcRenderer.send('collect_search', keyword);
})


ipcRenderer.on('search-data', (event, data) => {
    const searchContainer = document.getElementById('search-container');
    searchContainer.innerHTML = "";
    let searchs = data;
    /*
    {
    title: '馃殑杩欐牱璁㈢伀杞︾エ鍙互绔嬪噺15r',
    link: '/search_result/65e5a00f0000000001028a7b',
    coverImage: null,
    noteId: '65e5a00f0000000001028a7b',
    author: {
      name: '鍚岀▼鏃呰绉嶈崏鏈?,
      imageUrl: 'https://sns-avatar-qc.xhscdn.com/avatar/645c946916d44a000170c5a5.jpg?imageView2/2/w/80/format/jpg?imageView2/2/w/60/format/webp|imageMogr2/strip',
      profileLink: '/user/profile/60c988c3000000000101daf9',
      userId: '60c988c3000000000101daf9'
    }
  },*/
    searchs.forEach(search => {
        const div = document.createElement('div');
        div.className = 'search';

        const img = document.createElement('img');
        img.src = search.coverImage;

        const title = document.createElement('h4');
        title.textContent = search.title;

        const author = document.createElement('p');
        author.textContent = search.author.name;

        div.appendChild(img);
        div.appendChild(title);
        div.appendChild(author);

        searchContainer.appendChild(div);
    });
});