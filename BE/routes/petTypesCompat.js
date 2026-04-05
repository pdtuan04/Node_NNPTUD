const express = require("express");
const router = express.Router();
const petTypeModel = require("../schemas/petTypes");
const { presentPetType } = require("../utils/frontendPresenters");

router.get("/", async function (req, res) {
  try {
    const petTypes = await petTypeModel
      .find({ isDeleted: false, isActive: true })
      .sort({ name: 1 });

    res.send({
      success: true,
      data: petTypes.map(presentPetType),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;