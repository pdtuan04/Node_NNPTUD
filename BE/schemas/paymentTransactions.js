const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: [true, "Thông tin lịch hẹn là bắt buộc"]
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Thông tin người dùng là bắt buộc"]
    },
    paymentMethod: {
      type: String,
      required: [true, "Phương thức thanh toán là bắt buộc"]
    },
    paymentStatus: {
      type: String,
      required: [true, "Trạng thái thanh toán là bắt buộc"]
    },
    amount: {
      type: Number,
      required: [true, "Số tiền là bắt buộc"],
      min: [0, "Số tiền không được âm"]
    },
    transactionRef: {
      type: String,
      required: [true, "Mã giao dịch nội bộ là bắt buộc"],
      unique: true
    },
    providerTransactionId: {
      type: String,
      default: ""
    },
    paymentProvider: {
      type: String,
      default: ""
    },
    voucherCode: {
      type: String,
      default: ""
    },
    voucherDiscount: {
      type: Number,
      default: 0
    },
    rawPayload: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("paymentTransaction", paymentTransactionSchema);