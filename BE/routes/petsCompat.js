const express = require("express");
const router = express.Router();
const petModel = require("../schemas/pets");
const petTypeModel = require("../schemas/petTypes");
const petController = require("../controllers/pets");
const { CheckLogin } = require("../utils/authHandler");
const { legacyIdMatches } = require("../utils/compatIds");
const { presentPet } = require("../utils/frontendPresenters");

function getRequestUserId(req) {
  const roleName = req.user && req.user.role ? req.user.role.name : "";
  const isAdmin = ["ADMIN", "Admin", "admin"].includes(roleName);
  return isAdmin && req.params.userId && req.params.userId !== "0"
    ? req.params.userId
    : req.user.id;
}

async function resolvePetId(userId, rawPetId) {
  if (!rawPetId) return null;
  const direct = await petModel.findOne({ _id: rawPetId, user: userId, isDeleted: false }).catch(() => null);
  if (direct) return direct._id;
  const pets = await petModel.find({ user: userId, isDeleted: false });
  const matched = pets.find((item) => legacyIdMatches(item._id, rawPetId));
  return matched ? matched._id : null;
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

router.get("/all", CheckLogin, async function (req, res) {
  try {
    const pets = await petController.GetAllPets();
    res.send({ success: true, data: pets.map(presentPet) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

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

router.put("/user/:userId/:petId", CheckLogin, async function (req, res) {
  try {
    const roleName = req.user && req.user.role ? req.user.role.name : "";
    const isAdmin = ["ADMIN", "Admin", "admin"].includes(roleName);

    const petTypeId = await resolvePetTypeId(req.body.petTypeId);
    if (!petTypeId) {
      return res.status(400).send({ success: false, message: "Loại thú cưng không hợp lệ." });
    }

    // Admin tìm pet theo petId trực tiếp, không cần check owner
    let mongoId;
    if (isAdmin) {
      const direct = await petModel.findOne({ _id: req.params.petId, isDeleted: false }).catch(() => null);
      mongoId = direct ? direct._id : null;
    } else {
      const userId = getRequestUserId(req);
      mongoId = await resolvePetId(userId, req.params.petId);
    }

    if (!mongoId) return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });

    // Nếu admin đổi owner thì update trực tiếp
    const newOwnerId = isAdmin && req.body.ownerId ? req.body.ownerId : null;

    const pet = await petModel.findById(mongoId);
    if (!pet) return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });

    pet.name = req.body.name;
    pet.petType = petTypeId;
    pet.age = Number(req.body.age || 0);
    if (req.body.imageUrl !== undefined) pet.imageUrl = req.body.imageUrl || "";
    if (newOwnerId) pet.user = newOwnerId;
    await pet.save();
    const populated = await pet.populate(['petType', 'user']);

    res.send({ success: true, data: presentPet(populated) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.delete("/user/:userId/:petId", CheckLogin, async function (req, res) {
  try {
    const userId = getRequestUserId(req);
    const mongoId = await resolvePetId(userId, req.params.petId);
    if (!mongoId) return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });

    const result = await petController.DeletePet(userId, mongoId);
    if (!result) return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });
    res.send({ success: true, message: "Xóa thú cưng thành công." });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

module.exports = router;