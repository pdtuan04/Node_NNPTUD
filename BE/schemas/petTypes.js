const mongoose = require("mongoose");

const petTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên loại thú cưng là bắt buộc"]
    },
    description: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
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
module.exports = mongoose.model("petType", petTypeSchema);