require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const DeliverySlot = require("./models/DeliverySlot");
const SlotAvailability = require("./models/SlotAvailability");
const Stock = require("./models/Stock");
const DeliveryZone = require("./models/DeliveryZone");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Get or create zone
    let zone = await DeliveryZone.findOne({ name: "Anna Nagar" });
    if (!zone) {
      zone = await DeliveryZone.create({
        name: "Anna Nagar",
        isActive: true,
        polygon: {
          type: "Polygon",
          coordinates: [[[80.18, 12.91], [80.19, 12.91], [80.19, 12.92], [80.18, 12.92], [80.18, 12.91]]]
        }
      });
      console.log("✅ Zone created:", zone._id);
    } else {
      console.log("✅ Zone exists:", zone._id);
    }

    // Create product
    let product = await Product.findOne({ name: "Premium Batter" });
    if (!product) {
      product = await Product.create({
        name: "Premium Batter",
        price: 60,
        weight: "500g",
        image_url: "https://via.placeholder.com/300",
        image_public_id: "sample",
        is_active: true
      });
      console.log("✅ Product created:", product._id);
    } else {
      console.log("✅ Product exists:", product._id);
    }

    // Create delivery slots
    let morningSlot = await DeliverySlot.findOne({ name: "Morning" });
    if (!morningSlot) {
      morningSlot = await DeliverySlot.create({
        name: "Morning",
        start_time: "07:00",
        end_time: "10:00",
        is_active: true
      });
      console.log("✅ Morning Slot created:", morningSlot._id);
    } else {
      console.log("✅ Morning Slot exists:", morningSlot._id);
    }

    let eveningSlot = await DeliverySlot.findOne({ name: "Evening" });
    if (!eveningSlot) {
      eveningSlot = await DeliverySlot.create({
        name: "Evening",
        start_time: "17:00",
        end_time: "20:00",
        is_active: true
      });
      console.log("✅ Evening Slot created:", eveningSlot._id);
    } else {
      console.log("✅ Evening Slot exists:", eveningSlot._id);
    }

    // Create stock for today
    const today = new Date().toISOString().split("T")[0];
    let stock = await Stock.findOne({ product_id: product._id, date: today });
    if (!stock) {
      stock = await Stock.create({
        product_id: product._id,
        date: today,
        available_quantity: 100
      });
      console.log("✅ Stock created for", today, ":", stock._id);
    } else {
      console.log("✅ Stock exists for", today, ":", stock._id);
    }

    // Create slot availability for morning
    let slotAvail = await SlotAvailability.findOne({
      zone_id: zone._id,
      slot_id: morningSlot._id,
      date: today
    });
    if (!slotAvail) {
      slotAvail = await SlotAvailability.create({
        zone_id: zone._id,
        slot_id: morningSlot._id,
        date: today,
        max_orders: 20,
        available_orders: 20
      });
      console.log("✅ Morning Slot Availability created:", slotAvail._id);
    } else {
      console.log("✅ Morning Slot Availability exists:", slotAvail._id);
    }

    console.log("\n✅ All seed data created successfully!");
    console.log("\nSummary:");
    console.log("- Zone ID:", zone._id);
    console.log("- Product ID:", product._id);
    console.log("- Morning Slot ID:", morningSlot._id);
    console.log("- Date:", today);

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
