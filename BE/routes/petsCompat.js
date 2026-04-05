const express = require("express");
const router = express.Router();
const petModel = require("../schemas/pets");
const petTypeModel = require("../schemas/petTypes");
const petController = require("../controllers/pets");
const { CheckLogin } = require("../utils/authHandler");
const { legacyIdMatches } = require("../utils/compatIds");
const { presentPet } = require("../utils/frontendPresenters");

function getRequestUserId(req) {
  return req.user && req.user.role && req.user.role.name === "ADMIN" && req.params.userId && req.params.userId !== "0"
    ? req.params.userId
    : req.user.id;
}

async function resolvePetTypeId(rawPetTypeId) {
  if (!rawPetTypeId) return null;

  const direct = await petTypeModel.findOne({
    _id: rawPetTypeId,
    isDeleted: false,
    isActive: true,
  }).catch(() => null);
  if (direct) return direct._id;

  const petTypes = await petTypeModel.find({ isDeleted: false, isActive: true });
  const matched = petTypes.find((item) => legacyIdMatches(item._id, rawPetTypeId));
  return matched ? matched._id : null;
}

router.get("/user/:userId", CheckLogin, async function (req, res) {
  try {
    const pets = await petController.GetPetsByUser(getRequestUserId(req));
    res.send({
      success: true,
      data: pets.map(presentPet),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/user/:userId", CheckLogin, async function (req, res) {
  try {
    const petTypeId = await resolvePetTypeId(req.body.petTypeId);
    if (!petTypeId) {
      return res.status(400).send({
        success: false,
        message: "Loại thú cưng không hợp lệ.",
      });
    }

    const pet = await petController.CreatePet(
      getRequestUserId(req),
      req.body.name,
      petTypeId,
      Number(req.body.age || 0),
      req.body.imageUrl,
    );

    if (!pet) {
      return res.status(400).send({
        success: false,
        message: "Không thể thêm thú cưng.",
      });
    }

    res.send({
      success: true,
      data: presentPet(pet),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;