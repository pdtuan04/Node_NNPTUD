let mongoose = require('mongoose');

let commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Nội dung bình luận không được để trống"]
    },
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'article',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment',
        default: null
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('comment', commentSchema);