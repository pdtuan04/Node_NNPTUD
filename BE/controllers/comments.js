let commentModel = require("../schemas/comments");

module.exports = {
    GetCommentsByArticle: async function (articleId) {
        return await commentModel
            .find({ article: articleId }) 
            .populate('user', 'username')
            .sort({ createdAt: -1 });
    },
    CreateComment: async function (articleId, userId, content, parentId) {
        let newComment = new commentModel({
            article: articleId,
            user: userId,  
            content: content,
            parentId: parentId || null
        });
        
        await newComment.save();
        return await newComment.populate('user', 'username'); 
    }
}