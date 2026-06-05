const mongoose = require("mongoose");

const deliverySlotSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        start_time: { type: String, required: true },
        end_time: { type: String, required: true },
        total_orders: { type: Number, default: 50 },
        is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeliverySlot", deliverySlotSchema);