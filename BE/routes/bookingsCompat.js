const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking");
const paymentsController = require("../controllers/payments");
const petModel = require("../schemas/pets");
const paymentTxModel = require("../schemas/paymentTransactions");
const { CheckLogin } = require("../utils/authHandler");
const { legacyIdMatches } = require("../utils/compatIds");
const { presentBooking, presentVoucher } = require("../utils/frontendPresenters");

async function resolveOwnedPetId(userId, rawPetId) {
  const direct = await petModel.findOne({ _id: rawPetId, user: userId, isDeleted: false }).catch(() => null);
  if (direct) return direct._id;

  const pets = await petModel.find({ user: userId, isDeleted: false });
  const matched = pets.find((item) => legacyIdMatches(item._id, rawPetId));
  return matched ? matched._id : null;
}

async function attachPaymentFlags(bookings) {
  const bookingIds = bookings.map((item) => item._id || item.id);
  const paidTransactions = await paymentTxModel.find({
    booking: { $in: bookingIds },
    paymentStatus: "SUCCESS",
  });
  const paidBookingIds = new Set(paidTransactions.map((item) => item.booking.toString()));

  return bookings.map((booking) => {
    const presented = presentBooking(booking);
    const paid = paidBookingIds.has((booking._id || booking.id).toString());
    return {
      ...presented,
      createAt: booking.createdAt,
      createdAt: booking.createdAt,
      isPaid: paid,
      paid,
    };
  });
}

router.get("/available-slots", async function (req, res) {
  try {
    const duration = req.query.durationInMinutes || req.query.duration;
    const selectedDay = req.query.selectedDay || req.query.date;
    const slots = await bookingController.GetAvailableBookingSlots(duration, selectedDay);

    res.send({
      success: true,
      data: slots,
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
    const petId = await resolveOwnedPetId(req.user.id, req.body.petId);
    if (!petId) {
      return res.status(400).send({
        success: false,
        message: "Không tìm thấy thú cưng của người dùng hiện tại.",
      });
    }

    const booking = await bookingController.CreateBooking(
      req.user.id,
      petId,
      req.body.services,
      req.body.scheduledAt,
      req.body.notes || "",
    );

    if (!booking) {
      return res.status(400).send({
        success: false,
        message: "Không thể tạo lịch hẹn. Vui lòng kiểm tra khung giờ hoặc dữ liệu đầu vào.",
      });
    }

    res.send({
      success: true,
      data: presentBooking(booking),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me/vouchers", CheckLogin, async function (req, res) {
  try {
    const vouchers = await paymentsController.getUserVouchers(req.user.id);
    res.send({
      success: true,
      data: vouchers.map(presentVoucher),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me", CheckLogin, async function (req, res) {
  try {
    let bookings = await bookingController.GetUserBookings(req.user.id);

    if (req.query.petId) {
      bookings = bookings.filter((item) => {
        const petId = item.pet && typeof item.pet === "object" ? item.pet._id || item.pet.id : item.pet;
        return legacyIdMatches(petId, req.query.petId);
      });
    }

    res.send({
      success: true,
      data: await attachPaymentFlags(bookings),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me/:id", CheckLogin, async function (req, res) {
  try {
    const booking = await paymentsController.getOwnedBooking(req.user.id, req.params.id);
    if (!booking) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy lịch hẹn.",
      });
    }

    const [presented] = await attachPaymentFlags([booking]);
    res.send({
      success: true,
      data: presented,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/me/:id/cancel", CheckLogin, async function (req, res) {
  try {
    const result = await paymentsController.cancelBookingAndIssueVoucher(req.user.id, req.params.id);

    res.send({
      success: true,
      data: {
        booking: presentBooking(result.booking),
        voucherCreated: result.voucherCreated,
        voucherCode: result.voucherCode || null,
        voucherAmount: result.voucherAmount || 0,
        message: result.message,
      },
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/all", CheckLogin, async function (req, res) {
  try {
    const bookings = await bookingController.GetAllBookings();
    res.send({ success: true, data: await attachPaymentFlags(bookings) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.get("/bookings-in-week", CheckLogin, async function (req, res) {
  try {
    const bookings = await bookingController.GetAllBookingsInWeek(req.query.startDate);
    res.send(bookings);
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.get("/:id", CheckLogin, async function (req, res) {
  try {
    const booking = await bookingController.GetBookingDetail(req.params.id);
    if (!booking) return res.status(404).send({ success: false, message: "Không tìm thấy lịch hẹn." });
    const [presented] = await attachPaymentFlags([booking]);
    res.send({ success: true, data: presented });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.post("/:id/start", CheckLogin, async function (req, res) {
  try {
    const booking = await bookingController.StartBooking(req.params.id);
    if (!booking) return res.status(400).send({ success: false, message: "Không thể bắt đầu lịch hẹn." });
    res.send({ success: true, data: presentBooking(booking) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.post("/:id/complete", CheckLogin, async function (req, res) {
  try {
    const paymentMethod = req.query.paymentMethod || req.body?.paymentMethod || "PAY_LATER";
    const booking = await bookingController.CompleteBooking(req.params.id, paymentMethod);
    if (!booking) return res.status(400).send({ success: false, message: "Không thể hoàn thành lịch hẹn." });
    res.send({ success: true, data: presentBooking(booking) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.post("/:id/noshow", CheckLogin, async function (req, res) {
  try {
    const bookingModel = require("../schemas/bookings");
    const booking = await bookingModel.findById(req.params.id);
    if (!booking) return res.status(404).send({ success: false, message: "Không tìm thấy lịch hẹn." });
    booking.bookingStatus = "NO_SHOW";
    await booking.save();
    res.send({ success: true, message: "Đã đánh dấu vắng mặt.", data: presentBooking(booking) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.post("/:id/cancel", CheckLogin, async function (req, res) {
  try {
    const result = await paymentsController.cancelBookingAndIssueVoucher(req.user.id, req.params.id);
    res.send({
      success: true,
      data: {
        booking: presentBooking(result.booking),
        voucherCreated: result.voucherCreated,
        voucherCode: result.voucherCode || null,
        voucherAmount: result.voucherAmount || 0,
        message: result.message,
      },
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.post("/:id/cash-paid", CheckLogin, async function (req, res) {
  try {
    const bookingModel = require("../schemas/bookings");
    const paymentTxModel = require("../schemas/paymentTransactions");
    const crypto = require("crypto");
    const booking = await bookingModel.findById(req.params.id);
    if (!booking) return res.status(404).send({ success: false, message: "Không tìm thấy lịch hẹn." });

    const existing = await paymentTxModel.findOne({ booking: booking._id, paymentStatus: "SUCCESS" });
    if (existing) return res.status(400).send({ success: false, message: "Lịch hẹn đã được thanh toán." });

    const tx = new paymentTxModel({
      booking: booking._id,
      user: booking.user,
      paymentMethod: "CASH",
      paymentStatus: "SUCCESS",
      amount: booking.totalPrice || 0,
      transactionRef: "CASH_" + crypto.randomBytes(6).toString("hex").toUpperCase(),
      paymentProvider: "AT_COUNTER",
    });
    await tx.save();
    res.send({ success: true, message: "Xác nhận thanh toán tiền mặt thành công." });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

module.exports = router;