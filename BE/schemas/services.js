const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên dịch vụ là bắt buộc"]
    },
    description: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Giá tiền không được âm"]
    },
    durationInMinutes: {
      type: Number,
      default: 1,
      min: [1, "Thời gian thực hiện tối thiểu là 1 phút"]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    petTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "petType"
      }
    ],
    imageUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("service", serviceSchema);