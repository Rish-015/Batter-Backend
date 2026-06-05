const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  available_quantity: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });

stockSchema.index({ product_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);
