let express = require("express");
let router = express.Router();
let petTypeController = require('../controllers/petTypes');

router.get("/", async function (req, res) {
    let petTypes = await petTypeController.GetAllPetTypes();
    res.send({ success: true, data: petTypes });
});

module.exports = router;