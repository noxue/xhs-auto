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
