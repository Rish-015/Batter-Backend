const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  pincodes: {
    type: [String],
    required: true,
    index: true
  },
  slots: [
    {
      name: { type: String },
      start_time: { type: String },
      end_time: { type: String },
      total_orders: { type: Number, default: 20 }
    }
  ],
  pricing: [
    {
      capacity: { type: String }, // e.g. "1 kg", "650 g"
      productPrices: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          price: { type: Number }
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);
