let express = require("express");
let router = express.Router();
let articleController = require('../controllers/articles');
let { CreateArticleValidator, validatedResult } = require('../utils/validator');
let { CheckLogin, checkRole } = require('../utils/authHandler');

router.get("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    let articles = await articleController.GetAllArticles();
    res.send(articles);
});
router.get("/public", async function (req, res) {
    let articles = await articleController.GetPublishedArticles();
    res.send(articles);
});
router.get("/:id", async function (req, res) {
    let result = await articleController.GetArticleById(req.params.id);
    if (result) {
        res.send(result);
    } else {
        res.status(404).send({ message: "id not found" });
    }
});
router.post("/", CheckLogin, checkRole("ADMIN"), CreateArticleValidator, validatedResult, async function (req, res) {
    try {
        let article = await articleController.CreateAnArticle(
            req.body.title, 
            req.body.summary,
            req.body.content, 
            req.body.imageUrl,
            req.body.isPublished
        );
        console.log(article);
        res.send(article);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});
router.put("/:id", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    try {
        let id = req.params.id;
        let updatedItem = await articleController.UpdateArticle(id, req.body);
        if (!updatedItem) return res.status(404).send({ message: "id not found" });
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});
router.delete("/:id", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    try {
        let id = req.params.id;
        let updatedItem = await articleController.DeleteArticle(id);
        if (!updatedItem) return res.status(404).send({ message: "id not found" });
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;