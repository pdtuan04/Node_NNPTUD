let mongoose = require('mongoose');

let articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Tiêu đề không được để trống"]
    },
    summary: {
        type: String,
        default: ""
    },
    content: {
        type: String,
        required: [true, "Nội dung không được để trống"]
    },
    imageUrl: {
        type: String,
        default: ""
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('article', articleSchema);