const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên thú cưng là bắt buộc"]
    },
    age: {
      type: Number,
      default: 0,
      min: [0, "Tuổi không được âm"]
    },
    imageUrl: {
      type: String,
      default: ""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Phải có chủ sở hữu (User)"]
    },
    petType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "petType",
      required: [true, "Phải chọn loại thú cưng"]
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("pet", petSchema);