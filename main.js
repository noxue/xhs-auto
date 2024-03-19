const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const {Db, Note, Comment, Like, Collect} = require('./db.js');
const {PostComment, AtUser} = require('./types.js');


function createWindow() {

	const db = new Db('xhs_test.db');

	const mainWindow = new BrowserWindow({
		width: 1024,
		height: 768,
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


	view.webContents.on('did-finish-load', () => {

		// 注入js 到网页中
		view.webContents.executeJavaScript(fs.readFileSync('./encrypt.js', 'utf8'));

	});

	ipcMain.on('search', (event, arg) => {
		// https://www.xiaohongshu.com/user/profile/633a6c5c000000001802dfaa
		// if contains xiaohongshu.com then loadURL
		if (arg.includes('xiaohongshu.com')) {
			view.webContents.loadURL(arg);
			return;
		}
		// https://www.xiaohongshu.com/search_result?keyword=%25E4%25BD%25A0%25E5%25A5%25BD
		view.webContents.loadURL(`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(arg)}`);
	});

	let collect_search_stop = false;
	ipcMain.on('collect_search_stop', (event, arg) => {
		collect_search_stop = true;
	});


	ipcMain.on('collect_search', (event, arg) => {
		collect_search_stop = false;
		// console.log('page loaded');
		// 记录当前页面的坐标，页面滚动到最后，如果坐标有变化，就继续滚动，一直到滚动后的坐标不变
		let lastY = 0;
		let currentY = 0;

		// 创建一个hashmap，用于存储笔记的信息
		
		const getPage = async () => {

			// 滚动一个屏幕的高度
			if(collect_search_stop){
				return;
			}

			setTimeout(async() => {
				currentY = await view.webContents.executeJavaScript(`window.scrollY`);
				// console.log("currentY", currentY, "lastY", lastY)

				if (lastY!=0 && lastY == currentY) {
					// console.log("滚动到底了")
					
					return;
				}

				try{
					let notes = await getSearchedList();
					notes = extractNotesInfoFromHtml(notes);
					notes.forEach(note => {
						// console.log(note.noteId)
						db.insertNoteData(new Note(note.noteId, note.title, note.link, note.coverImage, note.author.name, note.author.imageUrl, note.author.profileLink, note.author.userId, arg, new Date().getTime().toString()));
					});
					

				}catch(e){
					// console.log("eeeeeeeeeeeeee:"+e)
				}

				lastY = currentY;

				await view.webContents.executeJavaScript(`window.scrollTo(0, window.scrollY + window.innerHeight-140)`); 

				await getPage();

			}, 500);

			

		}

		getPage();		
	});

    const jsdom = require("jsdom");
    const { JSDOM } = jsdom;

	function extractNotesInfoFromHtml(htmlString) {
		const dom = new JSDOM(htmlString);
		const doc = dom.window.document;
	
		// 获取所有笔记项
		const noteItems = doc.querySelectorAll('.note-item'); 
		const notesData = [];
	
		// 遍历每个笔记项，提取信息
		noteItems.forEach(item => {
			const titleElement = item.querySelector('.title span');
			const linkElement = item.querySelector('a.cover');

			if(!linkElement) return;
	
			const authorElement = item.querySelector('.author');
			const authorProfileLinkElement = authorElement ? authorElement.href : null;
			const authorImageElement = item.querySelector('.author-avatar'); 
			const authorNameElement = item.querySelector('.name');
	
			// 提取封面图URL
			let itemHtml = item.outerHTML;
			// background: url(&quot;http://sns-webpic-qc.xhscdn.com/202403161608/50ae116387d0e772b054b6235cd4bfbb/1000g0082f3q8mt4ha0005ok36ur8cl1kiom0cgo!nc_n_webp_mw_1&quot;)
			// 正则提取出图片地址
			const imageUrlMatch = itemHtml.match(/background: url\(&quot;(.+?)&quot;\)/);
			const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;
	
			// 提取用户编号
			const userIdMatch = authorProfileLinkElement ? authorProfileLinkElement.match(/\/user\/profile\/([^\s\/]+)$/) : null;
			const userId = userIdMatch ? userIdMatch[1] : null;
	
			// 提取笔记编号
			let noteIdMatch = linkElement ? linkElement.href.match(/\/search_result\/([^\s\/]+)$/) : null;
			let noteId = noteIdMatch ? noteIdMatch[1] : null;

			if(!noteId){
				// 从个人主页获取的，就要根据这个格式提取 <a data-v-2edb3dac="" href="/explore/65f328190000000013026bd8" style="display: none;"></a> 
				noteIdMatch = itemHtml.match(/\/explore\/([^\s\/]+)\"/);
				noteId = noteIdMatch ? noteIdMatch[1] : null;
			}
	
			const noteData = {
			title: titleElement ? titleElement.textContent : '',
			link: linkElement ? linkElement.href : '',
			coverImage: imageUrl,
			noteId: noteId,
			author: {
				name: authorNameElement ? authorNameElement.textContent : '',
				imageUrl: authorImageElement ? authorImageElement.src : '',
				profileLink: authorProfileLinkElement,
				userId: userId
			}
			};
	
			notesData.push(noteData);
		});
	
		return notesData;
	}
	

      

    const getSearchedList = async () => {
        // document.getElementsByClassName('feeds-container')[0].innerHTML
        let html = await view.webContents.executeJavaScript(`document.getElementsByClassName('feeds-container')[0].innerHTML`);
        return html
    }

	ipcMain.on('follow', async (event, uid) => {
		let res = await follow(uid);
		console.log("follow result:"+JSON.stringify(res))
		event.sender.send('follow-result', {uid:uid, res:res});
	}); 
	
	ipcMain.on('comment', async (event, arg) => {

		let res = await comment("65f11f2c000000000d00e048");
		let comments = res.data.comments;
		// console.log(JSON.stringify(comments))
		event.sender.send('comment-data', comments);
	});

	
	ipcMain.on('post-comment', 
	/**
	 * 
	 * @param {*} event 
	 * @param {PostComment} arg 
	 */
	async (event, arg) => {
		// let at_user = {
		// 	user_id: "593766f182ec397e73c90f85",
		// 	nickname: "你好啊"
		// }
		// let at_users = []
		// at_users.push(at_user)
		// await post_comment("65e6dae40000000003034fcf", "222233", "", [at_user])
		let res = await post_comment(arg.noteId, arg.content, arg.targetCommentId, arg.atUsers);
		console.log("post comment result:"+JSON.stringify(res))
	});

	ipcMain.on('like', async (event, noteId) => {
		let res = await like(noteId);
		console.log("like:"+noteId+"    "+JSON.stringify(res))
	});

	ipcMain.on('unlike', async (event, noteId) => {
		let res = await unlike(noteId);
		console.log("like:"+noteId+"    "+JSON.stringify(res))
	});

	ipcMain.on('collect', async (event, arg) => {
		await collect("65e27e950000000003030b89");
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
		// // console.log(body)
		// 获取url的path部分
		let path = new URL(url).pathname;

		let executeRes = await view.webContents.executeJavaScript(`window._webmsxyw("${path}", ${body})`);
		// // console.log(executeRes)
		// // console.log(executeRes['X-s'])
		// // console.log(executeRes['X-t'])
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

		// console.log(followRes.statusText)
		let res = await followRes.json();
		return res
	}

	/*** 成功则返回所有评论
		格式:
		{code:0, data:{comments:[]}, cursor:"xxxxxx",has_more:true }
		*/
	const comment = async (note_id, cursor = "") => {

		let commentRes = await request("get", `https://edith.xiaohongshu.com/api/sns/web/v2/comment/page?note_id=${note_id}&cursor=${cursor}&top_comment_id=&image_formats=jpg,webp,avif`, null)


		// console.log(commentRes.statusText)
		let res = await commentRes.json();

		// let content = iconv.decode(res.data.comments[0].content, 'utf-8');
		// // console.log(content)
		if (res.code == 0) {
			// // console.log("get comment success")
			return res
		}
		console.error("get comment fail:" + res.msg)

		return false

	}

	let isStopComment = false;

	ipcMain.on('stopComment', (event, arg) => {
		isStopComment = true;
	});

	// 采集评论
	ipcMain.on('getComment', async (event, noteId) => {
		isStopComment = false;
		console.log("get comment noteId:"+noteId)
		let res = await comment(noteId);
		if (res.code != 0) {
			console.log("get comment failed")
			return;
		}
		let comments = res.data.comments;
		console.log("get comments:"+ res.data.comments.length)
		event.sender.send('comment-data', comments);
		while (!isStopComment && res.data.has_more) {
			console.log("get more comments:noteId, res.cursor:"+noteId, res.data.cursor)
			res = await comment(noteId, res.data.cursor);
			if (res.code != 0) {
				console.log("get comment failed")
				return;
			}
			console.log("get more comments:"+ res.data.comments.length)
			event.sender.send('comment-data', comments);
		}

		
	});

	/**
		* 评论笔记
		* @param {string} note_id 笔记编号
		* @param {string} content 评论内容
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

		// console.log(body)

		let postCommentRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/comment/post", body)




		// console.log(postCommentRes.statusText)
		let res = await postCommentRes.json();
		// console.log(res)
		if (res.code == 0) {
			// console.log("post comment success")
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

		// console.log(body)

		let likeRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/note/like", body)

		// console.log(likeRes.statusText)
		let res = await likeRes.json();
		// console.log(res)
		
		return res
	}

	const unlike = async (note_oid) => {

		let body = { "note_oid": note_oid }

		body = JSON.stringify(body)

		// console.log(body)

		let unlikeRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/note/dislike", body)

		// console.log(likeRes.statusText)
		let res = await unlikeRes.json();
		// console.log(res)
		
		return res
	}

	const collect = async (note_id) => {
		let body = { "note_id": note_id }

		body = JSON.stringify(body)

		// console.log(body)

		let collectRes = await request("post", "https://edith.xiaohongshu.com/api/sns/web/v1/note/collect", body)

		// console.log(collectRes.statusText)
		let res = await collectRes.json();
		// console.log(res)
		if (res.code == 0) {
			// console.log("collect success")
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
		// console.log('HTML 已保存到桌面的 1.html 文件中。');
	});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
