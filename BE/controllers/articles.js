let articleModel = require("../schemas/articles");

module.exports = {
    CreateAnArticle: async function (title, summary, content, imageUrl, isPublished) {
        let newItem = new articleModel({
            title: title,
            summary: summary,
            content: content,
            imageUrl: imageUrl,
            isPublished: isPublished
        });
        await newItem.save();
        return newItem;
    },

    GetAllArticles: async function () {
        return await articleModel.find({ isDeleted: false });
    },

    GetPublishedArticles: async function () {
        return await articleModel.find({ 
            isDeleted: false, 
            isPublished: true 
        });
    },

    GetArticleById: async function (id) {
        try {
            return await articleModel.findOne({
                isDeleted: false,
                _id: id
            });
        } catch (error) {
            return false;
        }
    },

    UpdateArticle: async function (id, data) {
        return await articleModel.findByIdAndUpdate(id, data, { new: true });
    },

    DeleteArticle: async function (id) {
        return await articleModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
    }
}