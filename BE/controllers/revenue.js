const paymentTxModel = require("../schemas/paymentTransactions");

function parseDateRange(from, to) {
  const start = from ? new Date(`${from}T00:00:00.000Z`) : new Date(0);
  const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error("Khoảng thời gian không hợp lệ.");
  }

  return { start, end };
}

function getPreviousRange(start, end) {
  const span = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - span - 1),
    end: new Date(start.getTime() - 1),
  };
}

function sumNetRevenue(list) {
  return list.reduce(
    (sum, item) => sum + Math.max(0, (item.amount || 0) - (item.voucherDiscount || 0)),
    0,
  );
}

async function getSuccessfulTransactions(start, end) {
  return paymentTxModel
    .find({
      paymentStatus: "SUCCESS",
      createdAt: { $gte: start, $lte: end },
    })
    .populate("booking");
}

module.exports = {
  getSummary: async function (from, to) {
    const { start, end } = parseDateRange(from, to);
    const prev = getPreviousRange(start, end);

    const [currentTx, previousTx] = await Promise.all([
      getSuccessfulTransactions(start, end),
      getSuccessfulTransactions(prev.start, prev.end),
    ]);

    const totalRevenue = sumNetRevenue(currentTx);
    const prevPeriodRevenue = sumNetRevenue(previousTx);
    const growthPercent =
      prevPeriodRevenue === 0
        ? totalRevenue > 0
          ? 100
          : 0
        : Number((((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100).toFixed(2));

    const byPaymentMethod = currentTx.reduce((result, tx) => {
      const key = tx.paymentMethod || "UNKNOWN";
      result[key] = (result[key] || 0) + Math.max(0, (tx.amount || 0) - (tx.voucherDiscount || 0));
      return result;
    }, {});

    return {
      totalRevenue,
      prevPeriodRevenue,
      growthPercent,
      byPaymentMethod,
    };
  },

  getRevenueByGroup: async function (from, to, groupBy) {
    const { start, end } = parseDateRange(from, to);
    const txList = await getSuccessfulTransactions(start, end);
    const buckets = new Map();

    for (const tx of txList) {
      const currentDate = new Date(tx.createdAt);
      const key =
        groupBy === "month"
          ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
          : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

      buckets.set(key, (buckets.get(key) || 0) + Math.max(0, (tx.amount || 0) - (tx.voucherDiscount || 0)));
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, revenue]) =>
        groupBy === "month"
          ? { month: key, revenue }
          : { date: key, revenue },
      );
  },

  getTransactions: async function (from, to) {
    const { start, end } = parseDateRange(from, to);
    const txList = await getSuccessfulTransactions(start, end);

    return txList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((tx) => ({
        id: tx._id.toString(),
        bookingId: tx.booking ? tx.booking._id.toString() : null,
        bookingCode: tx.booking ? tx.booking.bookingCode : "",
        paymentMethod: tx.paymentMethod,
        amount: tx.amount || 0,
        voucherDiscount: tx.voucherDiscount || 0,
        netRevenue: Math.max(0, (tx.amount || 0) - (tx.voucherDiscount || 0)),
        completedAt: tx.createdAt,
      }));
  },
};