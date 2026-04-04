const { Agenda } = require('agenda');
const { MongoBackend } = require('@agendajs/mongo-backend');
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

const startBackgroundJobs = async () => {
    await agenda.start();
    console.log('Background Jobs (Agenda) started');
};

module.exports = { agenda, startBackgroundJobs };