const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address_text: { type: String, required: true },
  landmark: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  is_default: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String },
  password: { type: String }, // For admin login
  role: { 
    type: String, 
    enum: ['admin', 'customer', 'partner'], 
    default: 'customer' 
  },
  is_active: { type: Boolean, default: true },
  addresses: [addressSchema]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
