let express = require("express");
let router = express.Router();
let petTypeService = require('../controllers/petTypes');


router.get("/", async function (req, res) {
    try {
        let result = await petTypeService.getActivePetTypes();
        res.status(200).json({ success: true, message: "Lấy danh sách loại thú cưng thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi tải loại thú cưng: " + e.message });
    }
});
router.get("/paginated", async function (req, res) {
    try {
        let Search = req.query.Search || "";
        let SortBy = req.query.SortBy || "id";
        let SortDir = req.query.SortDir || "Ascending";
        let PageNumber = parseInt(req.query.PageNumber) || 1;
        let PageSize = parseInt(req.query.PageSize) || 10;

        let result = await petTypeService.getPaginatedList(Search, SortBy, SortDir, PageNumber, PageSize);
        res.status(200).json({ success: true, message: "Lấy dữ liệu thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi lấy dữ liệu: " + e.message });
    }
});
router.get("/:id", async function (req, res) {
    try {
        let result = await petTypeService.getPetTypeById(req.params.id);
        res.status(200).json({ success: true, message: "Lấy dữ liệu thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi lấy dữ liệu: " + e.message });
    }
});
router.post("/", async function (req, res) {
    try {
        let result = await petTypeService.createPetType(req.body);
        res.status(200).json({ success: true, message: "Thêm loại thú cưng thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi thêm: " + e.message });
    }
});
router.put("/", async function (req, res) {
    try {
        let result = await petTypeService.updatePetType(req.body);
        res.status(200).json({ success: true, message: "Cập nhật loại thú cưng thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi cập nhật: " + e.message });
    }
});
router.patch("/inactive", async function (req, res) {
    try {
        await petTypeService.inactivePetType(req.query.id);
        res.status(200).json({ success: true, message: "Vô hiệu hóa thành công." });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi vô hiệu hóa: " + e.message });
    }
});
router.patch("/active", async function (req, res) {
    try {
        await petTypeService.activePetType(req.query.id);
        res.status(200).json({ success: true, message: "Kích hoạt thành công." });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi kích hoạt: " + e.message });
    }
});
router.delete("/:id", async function (req, res) {
    try {
        await petTypeService.deletePetType(req.params.id);
        res.status(200).json({ success: true, message: "Xóa loại thú cưng thành công." });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi xóa: " + e.message });
    }
});

module.exports = router;