const nodemailer = require("nodemailer");
require("dotenv").config();
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
      from: "admin@haha.com",
      to: to,
      subject: "reset password email",
      text: "click vao day de doi pass", // Plain-text version of the message
      html: "click vao <a href=" + url + ">day</a> de doi pass", // HTML version of the message
    });
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
          filename: "qrcode.png",
          path: qrBase64,
          cid: "qrcode",
        },
      ],
    });
  },
  sendStaffWelcomeEmail: async function (
    to,
    fullName,
    username,
    temporaryPassword,
    staffCode,
  ) {
    await transporter.sendMail({
      from: '"PetSpa Admin" <admin@petspa.com>',
      to: to,
      subject: "Chào mừng bạn đến với PetSpa - Thông tin đăng nhập",
      html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #0d6efd; text-align: center;">Chào mừng đến với PetSpa!</h2>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Chúc mừng bạn đã trở thành thành viên của đội ngũ PetSpa. Dưới đây là thông tin tài khoản của bạn:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>Mã nhân viên:</strong> <span style="color: #dc3545; font-size: 16px;">${staffCode}</span></p>
                        <p style="margin: 10px 0;"><strong>Tên đăng nhập:</strong> <span style="color: #0d6efd; font-size: 16px;">${username}</span></p>
                        <p style="margin: 10px 0;"><strong>Mật khẩu tạm thời:</strong> <span style="color: #198754; font-size: 16px; font-family: monospace;">${temporaryPassword}</span></p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
                        <ul style="margin: 10px 0; color: #856404;">
                            <li>Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên</li>
                            <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>
                            <li>Mật khẩu mới nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</li>
                        </ul>
                    </div>
                    
                    <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận IT hoặc quản lý trực tiếp.</p>
                    
                    <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ PetSpa</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6c757d; text-align: center;">
                        Email này được gửi tự động, vui lòng không trả lời.
                    </p>
                </div>
            `,
    });
  },
};

// Send an email using async/await
