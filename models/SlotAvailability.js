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
      required: false
    },
    slot_name: {
      type: String,
      required: false
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

slotAvailabilitySchema.path("slot_name").validate(function validateSlotIdentifier(value) {
  return Boolean(this.slot_id || value);
}, "Either slot_id or slot_name is required");

// 🔥 THIS LINE PREVENTS OverwriteModelError
module.exports =
  mongoose.models.SlotAvailability ||
  mongoose.model("SlotAvailability", slotAvailabilitySchema);
