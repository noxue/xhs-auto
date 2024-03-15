const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');



function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile('index.html')

    const view = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setBrowserView(view);

    view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
    view.webContents.loadURL('https://www.xiaohongshu.com');
    // 注入./test.js 到网页中
    view.webContents.executeJavaScript(fs.readFileSync('./encrypt.js', 'utf8'));

    view.webContents.on('did-finish-load', () => {
    

    });

    ipcMain.on('follow', (event, arg) => {

        follow("5e91ab090000000001005db6");

    });


    ipcMain.on('comment', async (event, arg) => {

        let res = await comment("65f11f2c000000000d00e048");
        let comments = res.data.comments;
        console.log(JSON.stringify(comments))
        fs.writeFile("./1.json", JSON.stringify(comments), (err) => {
            if (err) throw err;
            console.log('已保存。');
        });

        event.sender.send('comment-data', comments);
    });

    ipcMain.on('post_comment', async (event, arg) => {
        let at_user = {
            user_id: "593766f182ec397e73c90f85",
            nickname: "你好啊"
        }
        let at_users = []
        at_users.push(at_user)
        await post_comment("65e6dae40000000003034fcf", "222233", "", [at_user])
    });

    ipcMain.on('test', async (event, arg) => {



    });

    const getCookieStr = async () => {
        let cookies = await view.webContents.session.cookies.get({});

        let cookieStr = cookies.map((cookie) => {
            return `${cookie.name}=${cookie.value}`;
        }).join('; ');
        return cookieStr;
    }

    /**
     * 发起请求
     * @param {string} method 请求方法
     * @param {string} url 请求的地址
     * @param {string} body 请求内容
     */
    const request = async (method, url, body) => {
        let cookieStr = await getCookieStr();
        console.log(body)
        // 获取url的path部分
        let path = new URL(url).pathname;

        let executeRes = await view.webContents.executeJavaScript(`window._webmsxyw("${path}", ${body})`);
        console.log(executeRes)
        console.log(executeRes['X-s'])
        console.log(executeRes['X-t'])
        let x_s = executeRes['X-s'];
        let x_t = executeRes['X-t'];

        let xscommon = await view.webContents.executeJavaScript(`XSCommon("${x_s}", ${x_t})`);
        return await fetch(url, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN",
                "content-type": "application/json;charset=UTF-8",
                "sec-ch-ua": "\"Not(A:Brand\";v=\"24\", \"Chromium\";v=\"122\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "x-s": `"${x_s}"`,
                "x-s-common": `"${xscommon}"`,
                "x-t": `"${x_t}"`,
                "cookie": `"${cookieStr}"`,
                "Referer": "https://www.xiaohongshu.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": body,
            "method": method.toUpperCase()
        });
    }

    const follow = async (uid) => {

        let body = { target_user_id: uid }
        let followRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/user/follow", JSON.stringify(body))

        console.log(followRes.statusText)
        let res = await followRes.json();
        console.log(res)
        if (res.code == 0) {
            console.log("关注成功")
            return true
        }
        console.error("关注失败:" + res.msg)

        return false
    }

    /***  成功则返回所有评论
     格式:
     {code:0, data:{comments:[]}, cursor:"xxxxxx",has_more:true  }
     */
    const comment = async (note_id, cursor = "") => {

        let commentRes = await request("get", `https://edith.xiaohongshu.com/api/sns/web/v2/comment/page?note_id=${note_id}&cursor=${cursor}&top_comment_id=&image_formats=jpg,webp,avif`, null)


        console.log(commentRes.statusText)
        let res = await commentRes.json();

        // let content = iconv.decode(res.data.comments[0].content, 'utf-8');
        // console.log(content)
        if (res.code == 0) {
            console.log("get comment success")
            return res
        }
        console.error("get comment fail:" + res.msg)

        return false

    }

    /**
     * 评论笔记
     * @param {string} note_id  笔记编号
     * @param {string} content  评论内容
     * @returns 
     */
    const post_comment = async (note_id, content, target_comment_id = "", at_users = []) => {




        let body = { "note_id": note_id, "content": content, "target_comment_id": target_comment_id, "at_users": at_users }
        if (target_comment_id == "") {
            body = { "note_id": note_id, "content": content, "at_users": at_users }
        }

        // 把 at_users 循环 把他的nickname 用 @nickname 连起来 用空格分隔
        let at_users_content = ""
        at_users.forEach(user => {
            at_users_content += `@${user.nickname} `
        });
        body.content = at_users_content + body.content

        body = JSON.stringify(body)

        console.log(body)

        let postCommentRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/comment/post", body)




        console.log(postCommentRes.statusText)
        let res = await postCommentRes.json();
        console.log(res)
        if (res.code == 0) {
            console.log("post comment success")
            return true
        }
        console.error("post comment error:" + res.msg)

        return false
    }

    /**
     * 
     * @param {string} note_oid 笔记编号
     * @returns 
     */
    const like = async (note_oid) => {

        let body = { "note_oid": note_oid }

        body = JSON.stringify(body)

        console.log(body)

        let likeRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/note/like", body)

        console.log(likeRes.statusText)
        let res = await likeRes.json();
        console.log(res)
        if (res.code == 0) {
            console.log("like success")
            return true
        }
        console.error("like error:" + res.msg)

        return false
    }

    const collect = async (note_id) => {
        let body = { "note_id": note_id }

        body = JSON.stringify(body)

        console.log(body)

        let collectRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/note/collect", body)

        console.log(collectRes.statusText)
        let res = await collectRes.json();
        console.log(res)
        if (res.code == 0) {
            console.log("collect success")
            return true
        }
        console.error("collect error:" + res.msg)

        return false

    }

  
}

function saveHTML(html) {
    const filePath = path.join(app.getPath('desktop'), '1.html'); // 定义文件路径
    fs.writeFile(filePath, html, (err) => {
        if (err) throw err;
        console.log('HTML 已保存到桌面的 1.html 文件中。');
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
