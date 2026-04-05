const mongoose = require("mongoose");

const bookingVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      default: null,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "USED", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
    source: {
      type: String,
      default: "BOOKING_CANCELLATION",
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("bookingVoucher", bookingVoucherSchema);