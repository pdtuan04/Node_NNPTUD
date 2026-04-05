const crypto = require("crypto");
const bookingModel = require("../schemas/bookings");
const paymentTxModel = require("../schemas/paymentTransactions");
const voucherModel = require("../schemas/bookingVouchers");

const ONLINE_PAYMENT_METHODS = ["MOMO_PREPAID", "VNPAY_PREPAID"];

function generateRef(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function getPaymentConfig() {
  return {
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      requestType: process.env.MOMO_REQUEST_TYPE || "captureWallet",
      endpoint: process.env.MOMO_ENDPOINT,
      redirectUrl: process.env.MOMO_REDIRECT_URL,
      ipnUrl: process.env.MOMO_IPN_URL,
      partnerName: process.env.MOMO_PARTNER_NAME || "PetC",
      storeId: process.env.MOMO_STORE_ID || "PetCStore",
    },
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE,
      hashSecret: process.env.VNPAY_HASH_SECRET,
      payUrl: process.env.VNPAY_PAY_URL,
      returnUrl: process.env.VNPAY_RETURN_URL,
    },
  };
}

function ensureConfig(config, requiredKeys, label) {
  const missingKeys = requiredKeys.filter((key) => !config[key]);
  if (missingKeys.length > 0) {
    throw new Error(`${label} chưa cấu hình: ${missingKeys.join(", ")}`);
  }
}

function encodeUrlValue(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+");
}

function buildSortedQuery(params) {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeUrlValue(key)}=${encodeUrlValue(params[key])}`)
    .join("&");
}

function buildMoMoCreateSignature(payload, accessKey, secretKey) {
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${payload.amount}` +
    `&extraData=${payload.extraData}` +
    `&ipnUrl=${payload.ipnUrl}` +
    `&orderId=${payload.orderId}` +
    `&orderInfo=${payload.orderInfo}` +
    `&partnerCode=${payload.partnerCode}` +
    `&redirectUrl=${payload.redirectUrl}` +
    `&requestId=${payload.requestId}` +
    `&requestType=${payload.requestType}`;

  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

function verifyMoMoSignature(payload, accessKey, secretKey) {
  if (!payload.signature) {
    throw new Error("Thiếu chữ ký trả về từ MoMo.");
  }

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${payload.amount || ""}` +
    `&extraData=${payload.extraData || ""}` +
    `&message=${payload.message || ""}` +
    `&orderId=${payload.orderId || ""}` +
    `&orderInfo=${payload.orderInfo || ""}` +
    `&orderType=${payload.orderType || "momo_wallet"}` +
    `&partnerCode=${payload.partnerCode || ""}` +
    `&payType=${payload.payType || ""}` +
    `&requestId=${payload.requestId || ""}` +
    `&responseTime=${payload.responseTime || ""}` +
    `&resultCode=${payload.resultCode || ""}` +
    `&transId=${payload.transId || ""}`;

  const expected = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
  if (expected !== payload.signature) {
    throw new Error("Chữ ký MoMo không hợp lệ.");
  }
}

function verifyVNPaySignature(query, hashSecret) {
  const receivedHash = query.vnp_SecureHash;
  if (!receivedHash) {
    throw new Error("Thiếu chữ ký trả về từ VNPay.");
  }

  const signedData = { ...query };
  delete signedData.vnp_SecureHash;
  delete signedData.vnp_SecureHashType;

  const raw = buildSortedQuery(signedData);
  const expected = crypto.createHmac("sha512", hashSecret).update(Buffer.from(raw, "utf-8")).digest("hex");
  if (expected !== receivedHash) {
    throw new Error("Chữ ký VNPay không hợp lệ.");
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const rawIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "127.0.0.1";
  return rawIp === "::1" ? "127.0.0.1" : rawIp.replace("::ffff:", "");
}

function formatVNPayDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function buildGatewayPaymentUrl(paymentMethod, booking, transactionRef, amountToPay, reqContext) {
  const paymentConfig = getPaymentConfig();

  if (paymentMethod === "MOMO_PREPAID") {
    const momoConfig = paymentConfig.momo;
    ensureConfig(
      momoConfig,
      [
        "partnerCode",
        "accessKey",
        "secretKey",
        "requestType",
        "endpoint",
        "redirectUrl",
        "ipnUrl",
      ],
      "MoMo",
    );

    const requestId = generateRef("MOMO_REQ");
    const extraData = Buffer.from(
      JSON.stringify({
        bookingId: booking._id.toString(),
        transactionRef,
      }),
      "utf8",
    ).toString("base64");

    const payload = {
      partnerCode: momoConfig.partnerCode,
      partnerName: momoConfig.partnerName,
      storeId: momoConfig.storeId,
      requestId,
      amount: String(Math.round(amountToPay)),
      orderId: transactionRef,
      orderInfo: `Thanh toan booking ${booking.bookingCode}`,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      lang: "vi",
      requestType: momoConfig.requestType,
      autoCapture: true,
      extraData,
      orderGroupId: "",
    };

    payload.signature = buildMoMoCreateSignature(payload, momoConfig.accessKey, momoConfig.secretKey);

    const response = await fetch(momoConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.resultCode !== 0 || !result.payUrl) {
      throw new Error(result?.message || "Không thể khởi tạo thanh toán MoMo.");
    }

    return {
      paymentUrl: result.payUrl,
      provider: "MOMO",
      providerTransactionId: result.requestId || requestId,
      rawPayload: result,
    };
  }

  const vnPayConfig = paymentConfig.vnpay;
  ensureConfig(vnPayConfig, ["tmnCode", "hashSecret", "payUrl", "returnUrl"], "VNPay");

  const createDate = formatVNPayDate(new Date());
  const expireDate = formatVNPayDate(new Date(Date.now() + 15 * 60 * 1000));
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnPayConfig.tmnCode,
    vnp_Amount: String(Math.round(amountToPay) * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: `Thanh toan booking ${booking.bookingCode}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: vnPayConfig.returnUrl,
    vnp_IpAddr: reqContext?.clientIp || "127.0.0.1",
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const signData = buildSortedQuery(params);
  const secureHash = crypto
    .createHmac("sha512", vnPayConfig.hashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return {
    paymentUrl: `${vnPayConfig.payUrl}?${signData}&vnp_SecureHash=${secureHash}`,
    provider: "VNPAY",
    providerTransactionId: transactionRef,
    rawPayload: params,
  };
}

async function getOwnedBooking(userId, bookingId) {
  return bookingModel
    .findOne({
      _id: bookingId,
      user: userId,
      isDeleted: false,
    })
    .populate(["user", "pet", "services.service"]);
}

async function getActiveVoucherForUser(userId, code) {
  if (!code) return null;

  return voucherModel.findOne({
    user: userId,
    code,
    status: "ACTIVE",
    remainingAmount: { $gt: 0 },
    expiredAt: { $gt: new Date() },
  });
}

async function markExpiredVouchers(userId) {
  await voucherModel.updateMany(
    {
      user: userId,
      status: "ACTIVE",
      expiredAt: { $lte: new Date() },
    },
    {
      $set: { status: "EXPIRED", remainingAmount: 0 },
    },
  );
}

async function applySuccessfulPayment(tx, providerTransactionId, rawPayload) {
  if (tx.paymentStatus !== "SUCCESS") {
    tx.paymentStatus = "SUCCESS";
    tx.providerTransactionId = providerTransactionId || tx.providerTransactionId || tx.transactionRef;
    tx.rawPayload = JSON.stringify(rawPayload || {});
    await tx.save();

    if (tx.voucherCode && tx.voucherDiscount > 0) {
      const voucher = await voucherModel.findOne({
        user: tx.user,
        code: tx.voucherCode,
        status: "ACTIVE",
      });
      if (voucher) {
        voucher.remainingAmount = Math.max(0, (voucher.remainingAmount || 0) - (tx.voucherDiscount || 0));
        voucher.status = voucher.remainingAmount > 0 ? "ACTIVE" : "USED";
        await voucher.save();
      }
    }

    const booking = await bookingModel.findById(tx.booking);
    if (booking && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.bookingStatus)) {
      booking.bookingStatus = "CONFIRMED";
      await booking.save();
    }
  }

  return { id: tx.booking.toString() };
}

async function markFailedTransaction(transactionRef, rawPayload) {
  const failedTx = await paymentTxModel.findOne({ transactionRef });
  if (!failedTx) return;
  if (failedTx.paymentStatus === "SUCCESS") return;

  failedTx.paymentStatus = "FAILED";
  failedTx.rawPayload = JSON.stringify(rawPayload || {});
  await failedTx.save();
}

module.exports = {
  getClientIp,
  getOwnedBooking,

  getUserVouchers: async function (userId) {
    await markExpiredVouchers(userId);

    return voucherModel
      .find({
        user: userId,
        status: { $in: ["ACTIVE", "USED", "EXPIRED"] },
      })
      .sort({ createdAt: -1 });
  },

  initializeBookingPayment: async function (userId, bookingId, paymentMethod, voucherCode, reqContext) {
    const booking = await getOwnedBooking(userId, bookingId);
    if (!booking) {
      throw new Error("Không tìm thấy lịch hẹn.");
    }

    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.bookingStatus)) {
      throw new Error("Lịch hẹn này không thể thanh toán.");
    }

    const successTx = await paymentTxModel.findOne({
      booking: booking._id,
      user: userId,
      paymentStatus: "SUCCESS",
    });
    if (successTx) {
      throw new Error("Lịch hẹn này đã được thanh toán.");
    }

    if (paymentMethod === "PAY_LATER") {
      booking.bookingStatus = "CONFIRMED";
      await booking.save();

      return {
        booking,
        paymentUrl: null,
        paymentMethod,
        amount: booking.totalPrice || 0,
        voucherDiscount: 0,
      };
    }

    if (!ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new Error("Phương thức thanh toán không hợp lệ.");
    }

    let voucherDiscount = 0;
    let voucher = null;
    if (voucherCode) {
      voucher = await getActiveVoucherForUser(userId, voucherCode);
      if (!voucher) {
        throw new Error("Voucher không hợp lệ hoặc đã hết hạn.");
      }
      voucherDiscount = Math.min(voucher.remainingAmount || 0, booking.totalPrice || 0);
    }

    const amountToPay = Math.max(0, (booking.totalPrice || 0) - voucherDiscount);

    if (amountToPay === 0) {
      const instantTx = await paymentTxModel.create({
        booking: booking._id,
        user: userId,
        paymentMethod,
        paymentStatus: "SUCCESS",
        amount: booking.totalPrice || 0,
        transactionRef: generateRef("ZERO_PAY"),
        paymentProvider: paymentMethod === "MOMO_PREPAID" ? "MOMO" : "VNPAY",
        providerTransactionId: "ZERO_AMOUNT",
        voucherCode: voucher ? voucher.code : "",
        voucherDiscount,
        rawPayload: JSON.stringify({ reason: "ZERO_AMOUNT" }),
      });

      await applySuccessfulPayment(instantTx, "ZERO_AMOUNT", { reason: "ZERO_AMOUNT" });

      return {
        booking,
        paymentUrl: null,
        paymentMethod,
        amount: 0,
        voucherDiscount,
      };
    }

    const transactionRef = generateRef("PAY");
    const gatewayResult = await buildGatewayPaymentUrl(
      paymentMethod,
      booking,
      transactionRef,
      amountToPay,
      reqContext,
    );

    await paymentTxModel.create({
      booking: booking._id,
      user: userId,
      paymentMethod,
      paymentStatus: "PENDING",
      amount: booking.totalPrice || 0,
      transactionRef,
      providerTransactionId: gatewayResult.providerTransactionId,
      paymentProvider: gatewayResult.provider,
      voucherCode: voucher ? voucher.code : "",
      voucherDiscount,
      rawPayload: JSON.stringify(gatewayResult.rawPayload || {}),
    });

    booking.bookingStatus = "PENDING_PAYMENT";
    await booking.save();

    return {
      booking,
      paymentUrl: gatewayResult.paymentUrl,
      paymentMethod,
      amount: amountToPay,
      voucherDiscount,
    };
  },

  getBookingPaymentSummary: async function (userId, bookingId) {
    const booking = await getOwnedBooking(userId, bookingId);
    if (!booking) {
      throw new Error("Không tìm thấy lịch hẹn.");
    }

    const txList = await paymentTxModel
      .find({
        booking: booking._id,
        user: userId,
      })
      .sort({ createdAt: -1 });

    const latestTx = txList[0] || null;
    const successTx = txList.find((item) => item.paymentStatus === "SUCCESS") || null;
    const canRetryPayment =
      booking.bookingStatus === "PENDING_PAYMENT" &&
      !successTx &&
      !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.bookingStatus);

    return {
      latestPaymentStatus: latestTx ? latestTx.paymentStatus : "UNPAID",
      latestPaymentMethod: latestTx ? latestTx.paymentMethod : null,
      voucherDiscount: latestTx ? latestTx.voucherDiscount || 0 : 0,
      totalPaid: txList
        .filter((item) => item.paymentStatus === "SUCCESS")
        .reduce((sum, item) => sum + Math.max(0, (item.amount || 0) - (item.voucherDiscount || 0)), 0),
      canRetryPayment,
    };
  },

  completeGatewayReturn: async function (provider, query) {
    const paymentConfig = getPaymentConfig();
    const transactionRef = provider === "MOMO" ? query.orderId : query.vnp_TxnRef;

    if (!transactionRef) {
      throw new Error("Thiếu mã giao dịch thanh toán trả về.");
    }

    const successCode = provider === "MOMO" ? query.resultCode === "0" : query.vnp_ResponseCode === "00";

    if (provider === "MOMO") {
      verifyMoMoSignature(query, paymentConfig.momo.accessKey, paymentConfig.momo.secretKey);
    } else {
      verifyVNPaySignature(query, paymentConfig.vnpay.hashSecret);
    }

    if (!successCode) {
      await markFailedTransaction(transactionRef, query || {});
      throw new Error("Thanh toán không thành công.");
    }

    const tx = await paymentTxModel.findOne({ transactionRef });
    if (!tx) {
      throw new Error("Không tìm thấy giao dịch thanh toán.");
    }

    return applySuccessfulPayment(
      tx,
      provider === "MOMO" ? query.transId : query.vnp_TransactionNo,
      query || {},
    );
  },

  handleMomoWebhook: async function (payload) {
    const paymentConfig = getPaymentConfig();
    verifyMoMoSignature(payload, paymentConfig.momo.accessKey, paymentConfig.momo.secretKey);

    const transactionRef = payload.orderId;
    if (!transactionRef) {
      throw new Error("Thiếu orderId từ webhook MoMo.");
    }

    if (payload.resultCode !== 0 && payload.resultCode !== "0") {
      await markFailedTransaction(transactionRef, payload || {});
      return { resultCode: 0, message: "Đã ghi nhận giao dịch thất bại" };
    }

    const tx = await paymentTxModel.findOne({ transactionRef });
    if (!tx) {
      throw new Error("Không tìm thấy giao dịch MoMo tương ứng.");
    }

    await applySuccessfulPayment(tx, payload.transId || payload.orderId, payload || {});
    return { resultCode: 0, message: "success" };
  },

  cancelBookingAndIssueVoucher: async function (userId, bookingId) {
    const booking = await getOwnedBooking(userId, bookingId);
    if (!booking) {
      throw new Error("Không tìm thấy lịch hẹn.");
    }

    if (["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.bookingStatus)) {
      throw new Error("Lịch hẹn này không thể hủy.");
    }

    booking.bookingStatus = "CANCELLED";
    await booking.save();

    const successTx = await paymentTxModel
      .findOne({
        booking: booking._id,
        user: userId,
        paymentStatus: "SUCCESS",
      })
      .sort({ createdAt: -1 });

    if (!successTx) {
      return {
        booking,
        voucherCreated: false,
        message: "Đã hủy lịch hẹn thành công.",
      };
    }

    const voucherAmount = Math.max(0, (successTx.amount || 0) - (successTx.voucherDiscount || 0));
    if (voucherAmount <= 0) {
      return {
        booking,
        voucherCreated: false,
        message: "Đã hủy lịch hẹn thành công.",
      };
    }

    let existingVoucher = await voucherModel.findOne({
      booking: booking._id,
      user: userId,
      source: "BOOKING_CANCELLATION",
    });

    if (!existingVoucher) {
      existingVoucher = await voucherModel.create({
        user: userId,
        booking: booking._id,
        code: `VC${Date.now().toString().slice(-8)}${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        amount: voucherAmount,
        remainingAmount: voucherAmount,
        status: "ACTIVE",
        source: "BOOKING_CANCELLATION",
        expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    return {
      booking,
      voucherCreated: true,
      voucherCode: existingVoucher.code,
      voucherAmount: existingVoucher.remainingAmount,
      message: "Đã hủy lịch và hoàn voucher cho khách hàng.",
    };
  },
};