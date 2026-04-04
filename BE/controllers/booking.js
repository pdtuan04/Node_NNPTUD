let bookingModel = require('../schemas/bookings');
let petModel = require('../schemas/pets');
let serviceModel = require('../schemas/services');
let paymentTxModel = require('../schemas/paymentTransactions');
let config = require('../config/bookingOptions');
let { agenda } = require('../utils/backgroundHandler');
let crypto = require('crypto');

module.exports = {
    IsSlotAvailable: function (start, end, bookingsInDay, excludeBookingId = null) {
        let checkPoint = new Date(start);
        let endTime = new Date(end);

        while (checkPoint < endTime) {
            let concurrent = 0;
            for (let b of bookingsInDay) {
                if (b.bookingStatus === 'CANCELLED') continue;
                if (excludeBookingId && b.id === excludeBookingId) continue;

                let bStart = new Date(b.scheduledAt);
                let bEnd = new Date(b.expectedEndTime);

                if (bStart <= checkPoint && bEnd > checkPoint) {
                    concurrent++;
                }
            }
            if (concurrent >= config.maxBookingsPerSlot) {
                return false;
            }
            checkPoint = new Date(checkPoint.getTime() + 5 * 60000);
        }
        return true;
    },
    GetBookingDetailByCode: async function (code) {
        try {
            return await bookingModel.findOne({ 
                bookingCode: code, 
                isDeleted: false 
            }).populate(['user', 'pet', 'services.service']);
        } catch (error) {
            return false;
        }
    },
    CreateBooking: async function (userId, petId, serviceIds, scheduledAtString, notes) {
        try {
            console.log("=== BẮT ĐẦU TẠO LỊCH HẸN ===");
            console.log("Dữ liệu nhận được:", { userId, petId, serviceIds, scheduledAtString, notes });
            let scheduledAt = new Date(scheduledAtString);
            if (scheduledAt <= new Date()) return false;

            let pet = await petModel.findById(petId);
            if (!pet) return false;

            let services = await serviceModel.find({ _id: { $in: serviceIds }, isActive: true });
            if (services.length !== serviceIds.length) return false;

            let totalMinutes = services.reduce((sum, s) => sum + s.durationInMinutes, 0);
            let expectedEndTime = new Date(scheduledAt.getTime() + totalMinutes * 60000);

            let startOfDay = new Date(scheduledAt);
            startOfDay.setHours(0, 0, 0, 0);
            let endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);

            let bookingsInDay = await bookingModel.find({
                scheduledAt: { $gte: startOfDay, $lt: endOfDay },
                isDeleted: false
            });

            if (!this.IsSlotAvailable(scheduledAt, expectedEndTime, bookingsInDay)) {
                return false;
            }

            let totalPrice = services.reduce((sum, s) => sum + s.price, 0);
            let holdExpiredAt = new Date(Date.now() + config.holdMinutes * 60000);
            let bookingCode = "BK" + Date.now().toString().slice(-6) + crypto.randomBytes(2).toString('hex').toUpperCase();

            let bookingDetails = services.map(s => ({
                service: s._id,
                priceAtTime: s.price
            }));

            let newBooking = new bookingModel({
                bookingCode: bookingCode,
                scheduledAt: scheduledAt,
                expectedEndTime: expectedEndTime,
                totalPrice: totalPrice,
                notes: notes,
                bookingStatus: 'PENDING',
                holdExpiredAt: holdExpiredAt,
                user: userId,
                pet: petId,
                services: bookingDetails
            });

            await newBooking.save();

            if (agenda) {
                await agenda.schedule(holdExpiredAt, 'expiredBooking', { bookingId: newBooking._id });
            }

            return await newBooking.populate(['user', 'pet', 'services.service']);
        } catch (error) {
            return false;
        }
    },

    ConfirmBooking: async function (bookingId) {
        try {
            let booking = await bookingModel.findById(bookingId).populate('user');
            if (!booking) return false;

            if (new Date(booking.holdExpiredAt) < new Date() && booking.bookingStatus === 'PENDING') {
                return false;
            }

            booking.bookingStatus = 'CONFIRMED';
            await booking.save();
            if (agenda && booking.user && booking.user.email) {
                let timeString = new Date(booking.scheduledAt).toLocaleString('vi-VN');
                console.log("Lên lịch gửi email xác nhận cho:", booking.user.email);
                await agenda.now('sendBookingEmailJob', {
                    email: booking.user.email,
                    bookingCode: booking.bookingCode,
                    time: timeString
                });
            }
            return booking;
        } catch (error) {
            return false;
        }
    },

    DeleteBooking: async function (bookingId) {
        try {
            let booking = await bookingModel.findById(bookingId);
            if (!booking) return false;

            booking.isDeleted = true;
            booking.bookingStatus = 'CANCELLED';
            await booking.save();
            return true;
        } catch (error) {
            return false;
        }
    },

    GetAllBookings: async function () {
        try {
            return await bookingModel.find({ isDeleted: false })
                .populate(['user', 'pet', 'services.service'])
                .sort({ createdAt: -1 });
        } catch (error) {
            return [];
        }
    },

    GetBookingDetail: async function (id) {
        try {
            return await bookingModel.findById(id).populate(['user', 'pet', 'services.service']);
        } catch (error) {
            return false;
        }
    },

    GetUserBookings: async function (userId) {
        try {
            return await bookingModel.find({ user: userId, isDeleted: false })
                .populate(['user', 'pet', 'services.service'])
                .sort({ createdAt: -1 });
        } catch (error) {
            return [];
        }
    },
    GetAllBookingsInWeek: async function (startDateString) {
        try {
            let startOfWeek = new Date(startDateString);
            startOfWeek.setHours(0, 0, 0, 0);

            let endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);

            let bookings = await bookingModel.find({
                scheduledAt: { $gte: startOfWeek, $lt: endOfWeek },
                bookingStatus: { $ne: "CANCELLED" },
                isDeleted: false
            }).populate('user').populate('pet').populate('services.service');

            return bookings;
        } catch (error) {
            return [];
        }
    },
    GetAvailableBookingSlots: async function (durationInMinutes, selectedDayString) {
        try {
            let startOfDayQuery = new Date(selectedDayString);
            startOfDayQuery.setHours(0, 0, 0, 0);
            let endOfDayQuery = new Date(startOfDayQuery);
            endOfDayQuery.setDate(endOfDayQuery.getDate() + 1);

            let now = new Date();
            let bookings = await bookingModel.find({
                scheduledAt: { $gte: startOfDayQuery, $lt: endOfDayQuery },
                isDeleted: false
            });

            let availableSlots = [];
            let currentTime = new Date(startOfDayQuery.getTime() + config.openingHour * 3600000);
            let endOfDay = new Date(startOfDayQuery.getTime() + config.closingHour * 3600000);

            while (currentTime <= endOfDay) {
                let slotEndTime = new Date(currentTime.getTime() + durationInMinutes * 60000);

                if (slotEndTime > endOfDay) {
                    currentTime = new Date(currentTime.getTime() + config.slotDurationMinutes * 60000);
                    continue;
                }

                if (currentTime > now && this.IsSlotAvailable(currentTime, slotEndTime, bookings)) {
                    availableSlots.push({
                        startAt: currentTime,
                        endAt: slotEndTime
                    });
                }
                currentTime = new Date(currentTime.getTime() + config.slotDurationMinutes * 60000);
            }
            return availableSlots;
        } catch (error) {
            return [];
        }
    },

    StartBooking: async function (bookingId) {
        try {
            let booking = await bookingModel.findById(bookingId);
            if (!booking || booking.bookingStatus !== 'CONFIRMED') return false;

            booking.bookingStatus = 'IN_PROGRESS';
            await booking.save();
            return booking;
        } catch (error) {
            return false;
        }
    },

    CompleteBooking: async function (bookingId, finalPaymentMethod) {
        try {
            let booking = await bookingModel.findById(bookingId);
            if (!booking || booking.bookingStatus !== 'IN_PROGRESS') return false;

            booking.bookingStatus = 'COMPLETED';
            await booking.save();

            let newTx = new paymentTxModel({
                booking: bookingId,
                user: booking.user,
                paymentMethod: finalPaymentMethod || 'PAY_LATER',
                paymentStatus: 'SUCCESS',
                amount: booking.totalPrice || 0,
                transactionRef: "COUNTER_" + crypto.randomBytes(6).toString('hex').toUpperCase(),
                paymentProvider: "AT_COUNTER"
            });
            await newTx.save();
            return booking;
        } catch (error) {
            return false;
        }
    }
};