let express = require("express");
let router = express.Router();
let serviceController = require('../controllers/services');

router.get("/pet-type/:petTypeId", async function (req, res) {
    let services = await serviceController.GetServicesByPetType(req.params.petTypeId);
    res.send({ success: true, data: services });
});

module.exports = router;