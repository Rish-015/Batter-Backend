const mongoose = require("mongoose");

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    vehicle_number: {
      type: String,
      trim: true
    },

    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryZone",
      required: true,
      index: true
    },

    is_active: {
      type: Boolean,
      default: true
    },

    is_available: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

DeliveryPartnerSchema.index({ zone_id: 1, is_available: 1 });

module.exports = mongoose.model("DeliveryPartner", DeliveryPartnerSchema);