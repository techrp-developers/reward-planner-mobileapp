const PaymentModel = require("../models/paymentModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../../../../config/database");
const {
  expirePendingOrder,
} = require("../../../../services/Razorpay/orderExpiryService");
const { notifyUser } = require("../../../common/utils/notification");
const EcommerceRefundService = require("../../../../services/Razorpay/ecommerceRefundService");

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_API_KEY,
  key_secret: process.env.RAZOR_SECRET_KEY,
});

class PaymentController {
  // create payment
  async createOrder(req, res) {
    const userId = req.user?.user_id;
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!orderId) {
      return res.status(400).json({ message: "orderId required" });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // ==========================
      // FETCH + LOCK ORDER ROW
      // Prevents two simultaneous requests from both
      // passing the checks and creating two Razorpay orders
      // ==========================
      const [[order]] = await conn.query(
        `SELECT total_amount, status, expires_at
       FROM eorders
       WHERE order_id = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
        [orderId, userId],
      );

      if (!order) {
        await conn.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      // ==========================
      // EXPIRY CHECK
      // Handle both: expires_at passed, or status already cancelled
      // by the expiry cron
      // ==========================
      if (order.status === "cancelled") {
        await conn.rollback();
        return res.status(400).json({ message: "Order expired" });
      }

      if (order.expires_at && new Date(order.expires_at) < new Date()) {
        await expirePendingOrder(conn, orderId);
        await conn.commit();
        return res.status(400).json({ message: "Order expired" });
      }

      if (order.status === "paid") {
        await conn.rollback();
        return res.status(400).json({ message: "Order already paid" });
      }

      // Only pending_payment orders should reach here
      if (order.status !== "pending_payment") {
        await conn.rollback();
        return res.status(400).json({ message: "Order is not payable" });
      }

      const amount = Number(order.total_amount);

      // ==========================
      // CHECK FOR EXISTING RAZORPAY ORDER
      // Also locked via the eorders FOR UPDATE above —
      // any concurrent request is blocked until we commit
      // ==========================
      const [[existing]] = await conn.query(
        `SELECT razorpay_order_id
       FROM order_payments
       WHERE order_id = ?
         AND status IN ('created', 'pending')
       LIMIT 1`,
        [orderId],
      );

      if (existing) {
        await conn.rollback();
        if (!existing.razorpay_order_id) {
          return res.status(409).json({
            message: "Payment order is being prepared. Please retry.",
          });
        }
        return res.status(200).json({
          key: process.env.RAZOR_API_KEY,
          orderId: existing.razorpay_order_id,
          amount: amount * 100,
          currency: "INR",
        });
      }

      // ==========================
      // CREATE RAZORPAY ORDER
      // Claim the payment attempt in DB, release row locks, then call the
      // external gateway. Concurrent requests see the pending claim.
      // ==========================
      const [claim] = await conn.query(
        `INSERT INTO order_payments (order_id, amount, status)
         VALUES (?, ?, 'pending')`,
        [orderId, amount],
      );
      await conn.commit();

      let razorpayOrder;

      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: orderId.toString(),
          payment_capture: 1,
          notes: {
            module: "ecommerce",
            order_id: orderId.toString(),
          },
        });
      } catch (razorpayErr) {
        await db.query(
          `UPDATE order_payments SET status = 'failed' WHERE payment_id = ?`,
          [claim.insertId],
        );
        console.error(
          "[createOrder] Razorpay order creation failed:",
          razorpayErr,
        );
        return res
          .status(502)
          .json({ message: "Payment gateway error. Please try again." });
      }

      await db.query(
        `UPDATE order_payments
         SET razorpay_order_id = ?, status = 'created'
         WHERE payment_id = ?`,
        [razorpayOrder.id, claim.insertId],
      );

      return res.status(200).json({
        key: process.env.RAZOR_API_KEY,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (err) {
      await conn.rollback();
      console.error("[createOrder] Error:", err);
      return res
        .status(500)
        .json({ message: "Failed to create payment order" });
    } finally {
      conn.release();
    }
  }

  //   verify Payment
  async verifyPayment(req, res) {
    try {
      const userId = req.user?.user_id;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      if (!userId) {
        return res.status(401).json({ status: "unauthorized" });
      }

      // ==========================
      // 1. VALIDATE ALL FIELDS PRESENT
      // ==========================
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: "missing required fields" });
      }

      // ==========================
      // 2. VERIFY SIGNATURE
      // ==========================
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZOR_SECRET_KEY)
        .update(body)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "hex");
      const receivedBuffer = Buffer.from(razorpay_signature, "hex");
      if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        return res.status(400).json({ status: "invalid signature" });
      }

      // ==========================
      // 3. FETCH PAYMENT ROW
      // ==========================
      const [[payment]] = await db.query(
        `SELECT status, order_id
       FROM order_payments
       WHERE razorpay_order_id = ?
       LIMIT 1`,
        [razorpay_order_id],
      );

      if (!payment) {
        return res.status(404).json({ status: "payment not found" });
      }

      // ==========================
      // 4. FETCH ORDER ROW
      // ==========================
      const [[order]] = await db.query(
        `SELECT status FROM eorders WHERE order_id = ? AND user_id = ? LIMIT 1`,
        [payment.order_id, userId],
      );

      if (!order) {
        return res.status(404).json({ status: "order not found" });
      }

      // ==========================
      // 5. EVALUATE STATUS
      //
      // Case A: Both sides confirm success — webhook fully processed
      // Case B: Order cancelled — expired before payment, refund already triggered
      // Case C: Order paid but payment row not yet updated — webhook in flight
      // Case D: Neither paid nor cancelled — still waiting
      // ==========================
      if (payment.status === "success" && order.status !== "cancelled") {
        return res.json({
          status: "success",
          orderId: payment.order_id,
        });
      }

      if (order.status === "cancelled") {
        return res.json({
          status: "cancelled",
          message:
            "Order was cancelled. Refund will be processed if payment was captured.",
        });
      }

      if (order.status === "paid") {
        // Order marked paid by webhook but payment row not updated yet
        // Extremely short window — treat as success on next poll
        return res.json({
          status: "pending",
          message: "Payment confirmed, finalising order",
        });
      }

      // Default — webhook hasn't fired yet
      return res.json({
        status: "pending",
        message: "Waiting for payment confirmation",
      });
    } catch (error) {
      console.error("Verify Payment Error:", error);
      return res.status(500).json({ message: "Payment verification failed" });
    }
  }

  // payment status
  async paymentStatus(req, res) {
    res.set("Cache-Control", "no-store");
    const userId = req.user?.user_id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const [rows] = await db.query(
      `SELECT status, expires_at
        FROM eorders
        WHERE order_id = ? AND user_id = ?`,
      [orderId, userId],
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      paymentStatus: rows[0].status,
      expiresAt: rows[0].expires_at,
    });
  }

  // =================
  // REFUND LOGIC
  // =================

  async processRefund({
    orderId,
    shipmentId = null,
    vendorOrderId = null,
    amount,
    paymentId = null,
    razorpayPaymentId = null,
    refundKey = null,
  }) {
    return EcommerceRefundService.processRefund({
      orderId,
      shipmentId,
      vendorOrderId,
      amount,
      paymentId,
      razorpayPaymentId,
      refundKey,
    });
  }
}

module.exports = new PaymentController();
