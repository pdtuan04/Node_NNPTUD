let express = require("express");
let router = express.Router();
let petController = require('../controllers/pets');

router.get("/user/:userId", async function (req, res) {
    let pets = await petController.GetPetsByUser(req.params.userId);
    res.send({ success: true, data: pets });
});

router.post("/", async function (req, res) {
    let pet = await petController.CreatePet(
        req.body.user,
        req.body.name,
        req.body.petType,
        req.body.age
    );
    if (!pet) return res.status(400).send({ success: false, message: "Lỗi tạo thú cưng" });
    res.send({ success: true, data: pet });
});

module.exports = router;