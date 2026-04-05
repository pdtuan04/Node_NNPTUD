const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenue");
const { CheckLogin, checkRole } = require("../utils/authHandler");

router.get("/summary", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const data = await revenueController.getSummary(req.query.from, req.query.to);
    res.send({ success: true, data });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.get("/by-day", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const data = await revenueController.getRevenueByGroup(req.query.from, req.query.to, "day");
    res.send({ success: true, data });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.get("/by-month", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const data = await revenueController.getRevenueByGroup(req.query.from, req.query.to, "month");
    res.send({ success: true, data });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

router.get("/transactions", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    const data = await revenueController.getTransactions(req.query.from, req.query.to);
    res.send({ success: true, data });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

module.exports = router;