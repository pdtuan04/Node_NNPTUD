const { Agenda } = require('agenda');
const { MongoBackend } = require('@agendajs/mongo-backend');
const QRCode = require('qrcode');
const { sendBookingEmail } = require('./sendMail');
const bookingModel = require('../schemas/bookings');

const agenda = new Agenda({
    backend: new MongoBackend({ 
        address: 'mongodb://localhost:27017/NNPTUD-C3',
        collection: 'agendaJobs'
    })
});

agenda.define('expiredBooking', async (job) => {
    try {
        let { bookingId } = job.attrs.data;
        let booking = await bookingModel.findById(bookingId);
        
        if (booking && (booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'PENDING_PAYMENT')) {
            if (new Date(booking.holdExpiredAt) < new Date()) {
                booking.bookingStatus = 'CANCELLED';
                await booking.save();
                console.log(`Đã tự động hủy lịch hẹn: ${booking.bookingCode}`);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
});
agenda.define('sendBookingEmailJob', async (job) => {
    const { email, bookingCode, time } = job.attrs.data;
    try {
        const qrBase64 = await QRCode.toDataURL(bookingCode);
        await sendBookingEmail(email, bookingCode, qrBase64, time);
        console.log("Done", email);
    } catch (error) {
        console.log("Lỗi", error.message);
    }
});
const startBackgroundJobs = async () => {
    await agenda.start();
    console.log('Background Jobs (Agenda) started');
};

module.exports = { agenda, startBackgroundJobs };