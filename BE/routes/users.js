var express = require("express");
var router = express.Router();
let bcrypt = require('bcrypt')
let userModel = require("../schemas/users");
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userController = require('../controllers/users')
let { CheckLogin, checkRole } = require('../utils/authHandler')


router.get("/me", CheckLogin, async function (req, res) {
  res.send({ data: req.user });
});

router.put("/me", CheckLogin, async function (req, res) {
  try {
    const { email, phone } = req.body;
    const updated = await require("../schemas/users").findByIdAndUpdate(
      req.user._id,
      { email, phone },
      { new: true }
    );
    res.send({ data: updated, message: "Cập nhật thành công" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.get("/", CheckLogin, checkRole("ADMIN","MODERATOR"), async function (req, res, next) {//ADMIN
  let users = await userController.GetAllUser()
  res.send(users);
});
router.get("/search", async function (req, res) {
    try {
        const keyword = req.query.email || req.query.q || "";
        let user = await userController.GetUserByEmail(keyword);
        if (!user) {
            // thử tìm partial match theo username hoặc email
            const userModel = require("../schemas/users");
            const users = await userModel.find({
                isDeleted: false,
                $or: [
                    { email: { $regex: keyword, $options: "i" } },
                    { username: { $regex: keyword, $options: "i" } }
                ]
            }).limit(5);
            if (users.length === 0) return res.status(404).send({ success: false, message: "Không tìm thấy khách hàng" });
            return res.send({ success: true, data: users.map(u => ({ id: u._id.toString(), username: u.username, email: u.email })) });
        }
        res.send({ success: true, data: { id: user._id.toString(), username: user.username, email: user.email } });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});
router.get("/:id", async function (req, res, next) {
  let result = await userController.GetUserById(
    req.params.id
  )
  if (result) {
    res.send(result);
  } else {
    res.status(404).send({ message: "id not found" })
  }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  
  try {
    let user = await userController.CreateAnUser(
      req.body.username, req.body.password,
      req.body.email, req.body.role
    )
    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate
      (id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;