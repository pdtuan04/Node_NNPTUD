const nodemailer = require("nodemailer");
require('dotenv').config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

module.exports = {
    sendMail: async function (to, url) {
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url+ ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendBookingEmail: async function (to, bookingCode, qrBase64, time) {
        await transporter.sendMail({
            from: '"PetSpa" <no-reply@petspa.com>',
            to: to,
            subject: "Xác nhận lịch hẹn PetSpa",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #0d6efd;">Cảm ơn bạn đã đặt lịch tại PetSpa!</h2>
                    <p>Mã lịch hẹn của bạn là: <strong style="font-size: 18px; color: #dc3545;">${bookingCode}</strong></p>
                    <p>Thời gian: <strong>${time}</strong></p>
                    <p>Vui lòng đưa mã QR bên dưới cho nhân viên khi đến quầy để check-in nhanh chóng:</p>
                    <div style="margin-top: 15px;">
                        <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ccc; border-radius: 8px; padding: 10px;"/>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'qrcode.png',
                    path: qrBase64,
                    cid: 'qrcode'
                }
            ]
        });
    }
}

// Send an email using async/await
