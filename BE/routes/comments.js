let express = require("express");
let router = express.Router(); 
let commentController = require('../controllers/comments');
let { CheckLogin } = require('../utils/authHandler');

router.get("/article/:articleId", async function (req, res) {
    try {
        let comments = await commentController.GetCommentsByArticle(req.params.articleId);
        res.status(200).send({ success: true, data: comments });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});

router.post("/", CheckLogin, async function (req, res) {
    try {
        let comment = await commentController.CreateComment(
            req.body.article, 
            req.user.id, 
            req.body.content,
            req.body.parentId
        );
        res.status(200).send({ success: true, data: comment });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});

module.exports = router;