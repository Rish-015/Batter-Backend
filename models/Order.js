const mongoose = require("mongoose");


/**
 * Order Items (Snapshot of product at order time)
 */
const OrderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

/**
 * Order Schema
 */
const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* 🔥 DELIVERY ZONE */
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryZone",
      required: true,
      index: true
    },

    /* 🔥 EXACT SLOT AVAILABILITY RECORD (SOURCE OF TRUTH) */
    slot_availability_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SlotAvailability",
      required: true,
      index: true
    },

    /* 🔥 SLOT NAME SNAPSHOT (Morning / Evening) */
    delivery_slot: {
      type: String,
      required: true
    },

    /* 🔥 DATE-SPECIFIC DELIVERY */
    delivery_date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0
    },

    total_price: {
      type: Number,
      required: true,
      min: 0
    },

    address_text: {
      type: String,
      required: true
    },

    payment_method: {
      type: String,
      enum: ["COD", "UPI", "ONLINE"],
      required: true
    },

    payment_order_id: {
      type: String,
      default: null,
    },

    payment_id: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "ASSIGNED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED"
      ],
      default: "PLACED",
      index: true
    },

    delivery_partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/* 🔍 USER ORDER HISTORY */
OrderSchema.index({ user_id: 1, createdAt: -1 });

OrderSchema.index(
  { payment_order_id: 1 },
  {
    unique: true,
    partialFilterExpression: { payment_order_id: { $type: "string" } }
  }
);

/* 🔍 ADMIN / ANALYTICS QUERIES */
OrderSchema.index({
  delivery_date: 1,
  zone_id: 1,
  slot_availability_id: 1
});

module.exports = mongoose.model("Order", OrderSchema);
