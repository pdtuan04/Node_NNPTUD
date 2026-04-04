let mongoose = require('mongoose');

let bookingSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        required: [true, "Mã booking là bắt buộc"],
        unique: true
    },
    scheduledAt: {
        type: Date,
        required: [true, "Thời gian đặt lịch là bắt buộc"]
    },
    expectedEndTime: {
        type: Date,
        required: [true, "Thời gian dự kiến kết thúc là bắt buộc"]
    },
    totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Tổng tiền không được âm"]
    },
    notes: {
        type: String,
        default: ""
    },
    bookingStatus: {
        type: String,
        enum: [
            "PENDING", 
            "PENDING_PAYMENT", 
            "CONFIRMED", 
            "IN_PROGRESS", 
            "COMPLETED",
            "CANCELLED", 
            "NO_SHOW"
        ],
        default: "PENDING"
    },
    holdExpiredAt: {
        type: Date,
        required: [true, "Thời gian hết hạn giữ chỗ là bắt buộc"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', 
        required: [true, "Thông tin khách hàng là bắt buộc"]
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'pet', 
        required: [true, "Thông tin thú cưng là bắt buộc"]
    },
    services: [{
        service: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'service' 
        },
        priceAtTime: Number
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('booking', bookingSchema);