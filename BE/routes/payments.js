const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const { CheckLogin } = require("../utils/authHandler");

router.get("/booking/:bookingId/summary", CheckLogin, async function (req, res) {
  try {
    const summary = await paymentsController.getBookingPaymentSummary(req.user.id, req.params.bookingId);
    res.send({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/booking/:bookingId/init", CheckLogin, async function (req, res) {
  try {
    const result = await paymentsController.initializeBookingPayment(
      req.user.id,
      req.params.bookingId,
      req.body.paymentMethod,
      req.body.voucherCode,
      { clientIp: paymentsController.getClientIp(req) },
    );

    res.send({
      success: true,
      data: {
        id: result.booking.id,
        paymentMethod: result.paymentMethod,
        paymentUrl: result.paymentUrl,
        amount: result.amount,
        voucherDiscount: result.voucherDiscount || 0,
      },
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/momo/webhook", async function (req, res) {
  try {
    const result = await paymentsController.handleMomoWebhook(req.body || {});
    res.send(result);
  } catch (error) {
    res.status(400).send({
      resultCode: 1,
      message: error.message,
    });
  }
});

router.get("/momo/return", async function (req, res) {
  try {
    const result = await paymentsController.completeGatewayReturn("MOMO", req.query);
    res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/vnpay/return", async function (req, res) {
  try {
    const result = await paymentsController.completeGatewayReturn("VNPAY", req.query);
    res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;