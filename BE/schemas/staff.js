const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    staffCode: {
      type: String,
      required: [true, "Mã nhân viên là bắt buộc"],
      unique: true,
      length: 20,
    },

    fullName: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      maxlength: [100, "Họ tên không được vượt quá 100 ký tự"],
    },

    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      maxlength: 100,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: "Số điện thoại phải có 10 chữ số",
      },
    },

    address: {
      type: String,
      maxlength: 255,
    },

    dateOfBirth: {
      type: Date,
    },

    hireDate: {
      type: Date,
      default: Date.now,
    },

    department: {
      type: String,
      maxlength: 50,
    },

    position: {
      type: String,
      maxlength: 50,
    },

    specialization: {
      type: String,
      maxlength: 255,
    },

    profilePictureUrl: {
      type: String,
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("staff", staffSchema);
