const express = require("express");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const SlotAvailability = require("../models/SlotAvailability");
const DeliveryZone = require("../models/DeliveryZone");
const DeliverySlot = require("../models/DeliverySlot");
const Product = require("../models/Product");
const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");
const Payment = require("../models/Payment");
const router = express.Router();

function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function roundToTwo(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * POST /api/orders/checkout-summary
 * Calculates subtotal, taxes, delivery charges, and total.
 */
router.post("/checkout-summary", auth, async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one cart item is required" });
    }

    const productIds = items.map((item) => item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds }, is_active: true });
    const productsMap = new Map(products.map((product) => [String(product._id), product]));

    const lineItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productsMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!product) {
        return res.status(400).json({
          error: `Invalid or inactive product: ${item.productId}`,
        });
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({
          error: `Invalid quantity for product ${item.productId}`,
        });
      }

      const lineTotal = roundToTwo(product.price * quantity);
      subtotal += lineTotal;

      lineItems.push({
        product_id: product._id,
        name: product.name,
        unit_price: product.price,
        quantity,
        line_total: lineTotal,
      });
    }

    subtotal = roundToTwo(subtotal);

    const taxRate = Number(process.env.CHECKOUT_TAX_RATE || 0);
    const deliveryChargeBase = Number(process.env.DELIVERY_CHARGE || 0);
    const freeDeliveryMin = Number(process.env.FREE_DELIVERY_MIN || 0);

    const taxes = roundToTwo(subtotal * taxRate);
    const deliveryCharge =
      freeDeliveryMin > 0 && subtotal >= freeDeliveryMin
        ? 0
        : roundToTwo(deliveryChargeBase);

    const total = roundToTwo(subtotal + taxes + deliveryCharge);

    return res.status(200).json({
      success: true,
      summary: {
        subtotal,
        taxes,
        deliveryCharge,
        total,
        taxRate,
      },
      items: lineItems,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to calculate checkout summary" });
  }
});

/**
 * GET ALL ORDERS (ADMIN)
 */
router.get("/admin/all", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status, zoneId, date } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (zoneId) filter.zone_id = zoneId;
    if (date) filter.delivery_date = normalizeDate(date);

    const orders = await Order.find(filter)
      .populate("user_id", "name phone email")
      .populate("zone_id", "name")
      .populate("delivery_partner_id", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET PRODUCTION SUMMARY (ADMIN)
 * Returns zone-wise breakdown of orders and product quantities for a date
 */
router.get("/admin/production-summary", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const summary = await Order.aggregate([
      { 
        $match: { 
          delivery_date: date, 
          status: { $ne: 'CANCELLED' } 
        } 
      },
      {
        $group: {
          _id: "$zone_id",
          ordersCount: { $sum: 1 },
          items: { $push: "$items" }
        }
      }
    ]);

    // Populate zone names
    const populatedSummary = await DeliveryZone.populate(summary, {
      path: "_id",
      select: "name"
    });

    // Format output: { zoneId: { name, ordersCount, products: { productId: quantity } } }
    const result = populatedSummary.reduce((acc, curr) => {
      const zoneId = curr._id?._id || curr._id;
      const zoneName = curr._id?.name || "Unknown";
      
      const productMap = {};
      curr.items.flat().forEach(item => {
        productMap[item.product_id] = (productMap[item.product_id] || 0) + item.quantity;
      });

      acc[zoneId] = {
        name: zoneName,
        ordersCount: curr.ordersCount,
        products: productMap
      };
      return acc;
    }, {});

    res.json(result);
  } catch (err) {
    console.error("Production Summary Error:", err);
    res.status(500).json({ error: "Failed to generate production summary" });
  }
});

/**
 * GET PAYMENT SUMMARY (ADMIN)
 */
router.get("/admin/payment-summary", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const orders = await Order.find({ 
      delivery_date: normalizeDate(date), 
      status: { $ne: 'CANCELLED' } 
    })
    .select("_id delivery_date payment_method total_price status createdAt")
    .sort({ createdAt: -1 });

    const stats = orders.reduce((acc, order) => {
      acc.totalRevenue += order.total_price;
      if (order.payment_method === 'COD') {
        acc.codTotal += order.total_price;
      } else {
        acc.onlineTotal += order.total_price;
      }
      return acc;
    }, { totalRevenue: 0, onlineTotal: 0, codTotal: 0 });

    res.json({ orders, stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment summary" });
  }
});

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status.toUpperCase() },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
});

/**
 * ASSIGN DELIVERY PARTNER (ADMIN)
 */
router.patch("/:id/assign", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { partnerId } = req.body;
    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) return res.status(404).json({ error: "Partner not found" });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        delivery_partner_id: partnerId,
        status: 'SHIPPED' // Automatically mark as shipped when assigned
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Partner assignment failed" });
  }
});

/**
 * POST /api/orders
 */
router.post("/", auth, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      slotId,
      zoneId,
      paymentMode,
      paymentOrderId,
      date,
    } = req.body;

    const normalizedPaymentMode = String(paymentMode || "").toUpperCase();

    if (!productId || !slotId || !zoneId || !normalizedPaymentMode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["COD", "UPI", "ONLINE"].includes(normalizedPaymentMode)) {
      return res.status(400).json({ error: "Invalid payment mode" });
    }

    const parsedQty = Number(quantity);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const zone = await DeliveryZone.findById(zoneId);
    if (!zone || !zone.isActive) {
      return res.status(400).json({ error: "Zone not available" });
    }

    const deliveryDate = normalizeDate(date || new Date());

    const slotAvailability = await SlotAvailability.findOne({
      slot_id: slotId,
      zone_id: zoneId,
      date: deliveryDate,
      available_orders: { $gt: 0 }
    });

    if (!slotAvailability) {
      return res.status(400).json({ error: "Slot full" });
    }

    const stock = await Stock.findOne({
      product_id: productId,
      date: deliveryDate
    });

    if (!stock || stock.available_quantity < parsedQty) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.is_active) {
      return res.status(400).json({ error: "Product not available" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const defaultAddress =
      user.addresses.find((addr) => addr.is_default) || user.addresses[0];

    if (!defaultAddress) {
      return res.status(400).json({ error: "No address on file" });
    }

    const slot = await DeliverySlot.findById(slotId);
    const deliverySlotName = slot ? slot.name : "Unknown";

    const totalPrice = product.price * parsedQty;

    let successfulPayment = null;
    if (normalizedPaymentMode === "ONLINE") {
      if (!paymentOrderId) {
        return res.status(400).json({
          error: "paymentOrderId is required for ONLINE payment mode",
        });
      }

      successfulPayment = await Payment.findOne({
        orderId: paymentOrderId,
        userId: req.user.userId,
        status: "success",
      });

      if (!successfulPayment) {
        return res.status(400).json({
          error: "Successful payment not found for this order",
        });
      }

      if (Number(successfulPayment.amount) !== Number(totalPrice)) {
        return res.status(400).json({
          error: "Paid amount does not match order total",
        });
      }

      const existingOrderForPayment = await Order.findOne({
        payment_order_id: successfulPayment.orderId,
      });

      if (existingOrderForPayment) {
        return res.status(409).json({
          error: "Order already created for this payment",
          orderId: existingOrderForPayment._id,
        });
      }
    }

    const order = await Order.create({
      user_id: req.user.userId,
      zone_id: zoneId,
      slot_availability_id: slotAvailability._id,
      delivery_slot: deliverySlotName,
      delivery_date: deliveryDate,
      items: [
        {
          product_id: product._id,
          name: product.name,
          price: product.price,
          quantity: parsedQty
        }
      ],
      total_price: totalPrice,
      address_text: defaultAddress.address_text,
      payment_method: normalizedPaymentMode,
      payment_order_id: successfulPayment?.orderId || null,
      payment_id: successfulPayment?.paymentId || null,
      status: "PLACED"
    });

    slotAvailability.available_orders -= 1;
    stock.available_quantity -= parsedQty;

    await slotAvailability.save();
    await stock.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

/**
 * GET /api/orders
 * User order history
 */
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user_id: req.user.userId };

    const orders = await Order.find(filter)
      .populate("zone_id", "name")
      .populate("delivery_partner_id", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch order history" });
  }
});

/**
 * GET /api/orders/:id
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("zone_id", "name")
      .populate("delivery_partner_id", "name phone");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (
      req.user.role !== "admin" &&
      String(order.user_id) !== String(req.user.userId)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(order);
  } catch (err) {
    return res.status(400).json({ error: "Invalid order ID" });
  }
});

module.exports = router;
