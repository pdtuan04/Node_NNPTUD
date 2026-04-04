let express = require("express");
let router = express.Router();
let bookingController = require('../controllers/booking');
let { CheckLogin, checkRole } = require('../utils/authHandler');
let { validatedResult, CreateBookingValidator } = require('../utils/validator');

router.get("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    let bookings = await bookingController.GetAllBookings();
    res.send(bookings);
});
router.get("/week", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    try {
        let bookings = await bookingController.GetAllBookingsInWeek(req.query.startDate);
        res.send(bookings);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});
router.get("/me", CheckLogin, async function (req, res) {
    let bookings = await bookingController.GetUserBookings(req.user.id);
    res.send(bookings);
});

router.get("/available-slots", async function (req, res) {
    let slots = await bookingController.GetAvailableBookingSlots(req.query.duration, req.query.date);
    res.send(slots);
});

router.get("/code/:code", async function (req, res) {
    try {
        let booking = await bookingController.GetBookingDetailByCode(req.params.code);
        if (!booking) return res.status(404).send({ success: false, message: "Không tìm thấy hóa đơn" });
        res.send({ success: true, data: booking });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});

router.get("/:id", async function (req, res) {
    let booking = await bookingController.GetBookingDetail(req.params.id);
    if (!booking) return res.status(404).send({ message: "Không tìm thấy lịch hẹn" });
    res.send(booking);
});

router.post("/", CheckLogin, CreateBookingValidator, validatedResult, async function (req, res) {
    let targetUserId = req.body.userId ? req.body.userId : req.user.id;
    let booking = await bookingController.CreateBooking(
        targetUserId,
        req.body.petId,
        req.body.services,
        req.body.scheduledAt,
        req.body.notes
    );
    if (!booking) return res.status(400).send({ message: "Lỗi tạo lịch hẹn" });
    res.send(booking);
});

router.put("/:id/confirm", CheckLogin, async function (req, res) {
    let booking = await bookingController.ConfirmBooking(req.params.id);
    if (!booking) return res.status(400).send({ message: "Không thể xác nhận" });
    res.send(booking);
});

router.put("/:id/start", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    let booking = await bookingController.StartBooking(req.params.id);
    if (!booking) return res.status(400).send({ message: "Không thể bắt đầu" });
    res.send(booking);
});

router.put("/:id/complete", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    let booking = await bookingController.CompleteBooking(req.params.id, req.body.paymentMethod);
    if (!booking) return res.status(400).send({ message: "Không thể hoàn thành" });
    res.send(booking);
});

router.delete("/:id", CheckLogin, async function (req, res) {
    let success = await bookingController.DeleteBooking(req.params.id);
    if (!success) return res.status(400).send({ message: "Không thể xóa" });
    res.send({ message: "Xóa thành công" });
});

module.exports = router;