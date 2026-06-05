const mongoose = require("mongoose");

const slotAvailabilitySchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryZone",
      required: true
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Set to false to support nested slots without master IDs
    },
    slot_name: {
      type: String,
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    max_orders: {
      type: Number,
      required: true
    },
    available_orders: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// 🔥 THIS LINE PREVENTS OverwriteModelError
module.exports =
  mongoose.models.SlotAvailability ||
  mongoose.model("SlotAvailability", slotAvailabilitySchema);
