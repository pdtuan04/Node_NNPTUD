var express = require("express");
var router = express.Router();
let staffController = require("../controllers/staff");
let { CheckLogin, checkRole } = require("../utils/authHandler");


router.get(
  "/paginated",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || "";
      const sortBy = req.query.sortBy || "fullName";
      const sortDir = req.query.sortDir || "Ascending";

      const result = await staffController.GetAllStaff(
        pageNumber,
        pageSize,
        search,
        sortBy,
        sortDir,
      );

      res.send({
        success: true,
        message: "Lấy danh sách nhân viên thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error in GET /paginated:", error);
      res.status(400).send({
        success: false,
        message: "Lỗi khi tải danh sách nhân viên: " + error.message,
      });
    }
  },
);

// Count active staff
router.get(
  "/count-active",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const count = await staffController.CountActiveStaff();
      res.send({
        success: true,
        message: "Lấy số lượng nhân viên đang hoạt động thành công",
        data: count,
      });
    } catch (error) {
      console.error("Error in GET /count-active:", error);
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// Get deleted staff - MUST be before /:id
router.get(
  "/deleted",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await staffController.GetDeletedStaff(
        pageNumber,
        pageSize,
      );

      res.send({
        success: true,
        message: "Lấy danh sách nhân viên đã xóa thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error in GET /deleted:", error);
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// Get staff by ID - MUST be after specific routes like /count-active, /deleted
router.get("/:id", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const staff = await staffController.GetStaffById(req.params.id);
    res.send({
      success: true,
      message: "Lấy thông tin nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    console.error("Error in GET /:id:", error);
    res.status(404).send({
      success: false,
      message: error.message,
    });
  }
});

// Create new staff
router.post("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const result = await staffController.CreateStaff(req.body);
    res.send({
      success: true,
      message:
        "Tạo tài khoản nhân viên thành công. Email đăng nhập đã được gửi.",
      data: result,
    });
  } catch (error) {
    console.error("Error in POST /:", error);
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

// Update staff
router.put("/:id", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const result = await staffController.UpdateStaff(req.params.id, req.body);
    res.send({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in PUT /:id:", error);
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

// Toggle active status
router.patch(
  "/toggle-active",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).send({
          success: false,
          message: "ID nhân viên là bắt buộc",
        });
      }

      await staffController.ToggleActive(id);
      res.send({
        success: true,
        message: "Cập nhật trạng thái nhân viên thành công",
      });
    } catch (error) {
      console.error("Error in PATCH /toggle-active:", error);
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// Restore deleted staff
router.patch(
  "/restore",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).send({
          success: false,
          message: "ID nhân viên là bắt buộc",
        });
      }

      await staffController.RestoreStaff(id);
      res.send({
        success: true,
        message: "Khôi phục nhân viên thành công",
      });
    } catch (error) {
      console.error("Error in PATCH /restore:", error);
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// Delete staff (soft delete)
router.delete(
  "/:id",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      await staffController.DeleteStaff(req.params.id);
      res.send({
        success: true,
        message: "Xóa nhân viên thành công",
      });
    } catch (error) {
      console.error("Error in DELETE /:id:", error);
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

module.exports = router;
