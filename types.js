


class AtUser{
    /**
     * 
     * @param {string} user_id 
     * @param {string} nickname 
     */
    constructor(user_id, nickname){
        this.user_id = user_id;
        this.nickname = nickname;
    }
}

class PostComment{
    /**
     * 
     * @param {string} noteId 
     * @param {string} content 
     * @param {string} targetCommentId 
     * @param {[AtUser]} atUsers 
     */
    constructor(noteId, content, targetCommentId, atUsers){
        this.noteId = noteId;
        this.content = content;
        this.targetCommentId = targetCommentId;
        this.atUsers = atUsers;
    }
}

module.exports = {
    AtUser,
    PostComment
}
