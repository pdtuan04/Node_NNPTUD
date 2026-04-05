const mongoose = require("mongoose");

const statisticSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            default: ""
        },
        serviceName: {
            type: String,
            required: [true, "Tên dịch vụ là bắt buộc"]
        },
        bookingCount: {
            type: Number,
            default: 0
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
module.exports = mongoose.model("statistic", statisticSchema);
