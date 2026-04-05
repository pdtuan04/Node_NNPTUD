let bookingModel = require('../schemas/bookings');
let statisticModel = require('../schemas/statistic');

module.exports = {
    getStatisticById: async function (id) {
        return await statisticModel.findOne({ _id: id, isDeleted: false });
    },
    getMostBookedServices: async function (limit) {
        let pipeline = [
            { $match: { isDeleted: false, bookingStatus: { $ne: "CANCELLED" } } },
            { $unwind: "$services" },
            { $group: { _id: "$services.service", bookingCount: { $sum: 1 } } },
            { $sort: { bookingCount: -1 } }
        ];

        if (limit && limit > 0) {
            pipeline.push({ $limit: limit });
        }

        pipeline.push(
            { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
            { $unwind: "$service" },
            { $project: { _id: 0, serviceId: "$_id", serviceName: "$service.name", bookingCount: 1 } }
        );

        let aggregatedData = await bookingModel.aggregate(pipeline);
        await statisticModel.deleteMany({});
        if (aggregatedData.length > 0) {
            await statisticModel.insertMany(aggregatedData);
        }

        let query = statisticModel.find({ isDeleted: false }).sort({ bookingCount: -1 });
        if (limit && limit > 0) {
            query = query.limit(limit);
        }
        return await query;
    },
    exportMostBookedServicesToCsv: async function (limit) {
        let stats = await this.getMostBookedServices(limit);
        let csvContent = "\uFEFFMã Dịch Vụ,Tên Dịch Vụ,Số Lượng Đặt\n";

        stats.forEach(s => {
            let name = s.serviceName ? s.serviceName.replace(/"/g, '""') : "";
            csvContent += `${s.serviceId},"${name}",${s.bookingCount}\n`;
        });

        return Buffer.from(csvContent, 'utf-8');
    },

    exportMostBookedServicesToPdf: async function (limit) {
        let stats = await this.getMostBookedServices(limit);

        return new Promise((resolve) => {
            let doc = new (require('pdfkit'))({ margin: 50, size: 'A4' });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(18).font('Helvetica-Bold').text('Most Booked Services Statistics', { align: 'center' });
            doc.moveDown(3);


            let renderRow = (y, t1, t2, t3, isHeader) => {
                doc.fontSize(12).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
                let cleanT2 = String(t2 || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");


                doc.text(String(t1).substring(0, 20), 55, y + 6);
                doc.text(cleanT2, 205, y + 6);
                doc.text(String(t3), 405, y + 6);

                doc.lineWidth(1).rect(50, y, 500, 25).stroke();
                doc.moveTo(200, y).lineTo(200, y + 25).stroke();
                doc.moveTo(400, y).lineTo(400, y + 25).stroke();
            };
            let y = 120;
            renderRow(y, 'Service ID', 'Service Name', 'Booking Count', true);
            y += 25;

            stats.forEach((s) => {
                if (y > 750) { doc.addPage(); y = 50; }
                renderRow(y, s.serviceId, s.serviceName, s.bookingCount, false);
                y += 25;
            });

            doc.end();
        });
    }
};
