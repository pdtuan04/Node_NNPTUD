let express = require("express");
let router = express.Router();
let serviceController = require("../controllers/services");
let { CheckLogin, checkRole } = require("../utils/authHandler");

// Public API - Get all active services (for users)
router.get("/", async function (req, res) {
  try {
    const services = await serviceController.GetAllActiveServices();
    res.send({
      success: true,
      message: "Lấy danh sách dịch vụ thành công.",
      data: services,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

// Public API - Get services by pet type (for users)
router.get("/pet-type/:petTypeId", async function (req, res) {
  try {
    let services = await serviceController.GetServicesByPetType(
      req.params.petTypeId,
    );
    res.send({ success: true, data: services });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN only - Get paginated services for management
router.get(
  "/paginated",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const search = req.query.search || "";
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const sortBy = req.query.sortBy || "name";
      const sortDir = req.query.sortDir || "Ascending";

      const result = await serviceController.GetAllServicesPaginated(
        search,
        pageNumber,
        pageSize,
        sortBy,
        sortDir,
      );

      res.send({
        success: true,
        data: {
          items: result.services,
          totalCount: result.totalCount,
          pageNumber: pageNumber,
          pageSize: pageSize,
        },
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// ADMIN only - Get deleted services
router.get(
  "/deleted",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await serviceController.GetDeletedServices(
        pageNumber,
        pageSize,
      );

      res.send({
        success: true,
        data: {
          items: result.services,
          totalCount: result.totalCount,
          pageNumber: pageNumber,
          pageSize: pageSize,
        },
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// ADMIN only - Toggle active status
router.patch(
  "/toggle-active",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      if (!req.query.id) {
        return res.status(400).send({
          success: false,
          message: "ID dịch vụ là bắt buộc",
        });
      }

      await serviceController.ToggleActiveService(req.query.id);
      res.send({
        success: true,
        message: "Cập nhật trạng thái thành công",
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// ADMIN only - Soft delete service
router.patch(
  "/soft-delete",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      if (!req.query.id) {
        return res.status(400).send({
          success: false,
          message: "ID dịch vụ là bắt buộc",
        });
      }

      await serviceController.SoftDeleteService(req.query.id);
      res.send({
        success: true,
        message: "Vô hiệu hóa dịch vụ thành công",
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// ADMIN only - Restore deleted service
router.patch(
  "/restore",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      if (!req.query.id) {
        return res.status(400).send({
          success: false,
          message: "ID dịch vụ là bắt buộc",
        });
      }

      await serviceController.RestoreService(req.query.id);
      res.send({
        success: true,
        message: "Khôi phục dịch vụ thành công",
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
);

// ADMIN only - Get service by ID (for management) - MUST be after specific routes
router.get("/:id", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const service = await serviceController.GetServiceById(req.params.id);
    res.send({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(404).send({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN only - Create new service
router.post("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const service = await serviceController.CreateService(req.body);
    res.send({
      success: true,
      message: "Thêm dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN only - Update service
router.put("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    if (!req.body.id) {
      return res.status(400).send({
        success: false,
        message: "ID dịch vụ là bắt buộc",
      });
    }

    const service = await serviceController.UpdateService(
      req.body.id,
      req.body,
    );
    res.send({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
