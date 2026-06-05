require("dotenv").config();
const mongoose = require("mongoose");
const DeliveryZone = require("./models/DeliveryZone");
const Product = require("./models/Product");
const DeliverySlot = require("./models/DeliverySlot");
const User = require("./models/User");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected\n");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const verify = async () => {
  await connectDB();

  try {
    console.log("=== VERIFICATION REPORT ===\n");

    // 1. Check Zones
    const zones = await DeliveryZone.find();
    console.log(`Zones: ${zones.length} found`);
    if (zones.length > 0) {
      zones.forEach(z => console.log(`  - ${z.name} (ID: ${z._id}, Active: ${z.isActive})`));
    } else {
      console.log("  ⚠️ No zones found - Run seed.js first!");
    }

    // 2. Check Products
    const products = await Product.find();
    console.log(`\nProducts: ${products.length} found`);
    if (products.length > 0) {
      products.forEach(p => console.log(`  - ${p.name} ($${p.price})`));
    } else {
      console.log("  ⚠️ No products found - Run seed.js first!");
    }

    // 3. Check Delivery Slots
    const slots = await DeliverySlot.find();
    console.log(`\nDelivery Slots: ${slots.length} found`);
    if (slots.length > 0) {
      slots.forEach(s => console.log(`  - ${s.name} (${s.start_time} - ${s.end_time})`));
    } else {
      console.log("  ⚠️ No slots found - Run seed.js first!");
    }

    // 4. Check Users
    const users = await User.find().limit(5);
    console.log(`\nUsers: ${users.length} found`);
    if (users.length > 0) {
      users.forEach(u => console.log(`  - ${u.phone} (${u.name})`));
    } else {
      console.log("  ⚠️ No users found");
    }

    // 5. Geospatial Index
    const indexes = await DeliveryZone.collection.getIndexes();
    console.log(`\nGeospatial Indexes on DeliveryZone:`);
    const geoIndex = Object.keys(indexes).find(k => indexes[k]?.["2dsphere"] !== undefined);
    if (geoIndex) {
      console.log(`  ✅ Found: ${geoIndex}`);
    } else {
      console.log(`  ❌ No 2dsphere index found`);
    }

    console.log("\n=== TEST ZONE DETECTION ===");
    // Test coordinates (should be within Anna Nagar zone)
    const testLat = 12.912345;
    const testLng = 80.198712;
    console.log(`\nTesting zone detection for lat=${testLat}, lng=${testLng}`);

    const zone = await DeliveryZone.findOne({
      polygon: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [testLng, testLat]
          }
        }
      }
    });

    if (zone) {
      console.log(`✅ Zone found: ${zone.name} (ID: ${zone._id})`);
    } else {
      console.log(`❌ No zone found for these coordinates`);
    }

    console.log("\n=== RECOMMENDATIONS ===");
    if (zones.length === 0 || products.length === 0 || slots.length === 0) {
      console.log("1. Run: node seed.js (to create base data)");
    }
    console.log("2. Update Postman collection:");
    console.log("   - Change request #5 from 'POST /api/zones' to 'POST /api/zones/detect'");
    console.log("   - Body should only contain: { lat, lng }");
    console.log("3. Use returned zoneId in 'POST /api/orders' request");

  } catch (error) {
    console.error("❌ Verification error:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

verify();
