const cron = require("node-cron");
const SlotAvailability = require("../models/SlotAvailability");

const startSlotResetCron = () => {
  // Runs every day at 12:00 AM
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("⏰ Slot availability reset cron started");

      // Reset available_orders to max_orders for all existing slot availabilities
      // This assumes max_orders represents the daily capacity
      const result = await SlotAvailability.updateMany(
        {},
        [
          { $set: { available_orders: "$max_orders" } }
        ]
      );

      console.log(`✅ Slot availability reset successfully for ${result.modifiedCount} records`);
    } catch (error) {
      console.error("❌ Slot reset cron failed:", error);
    }
  }, {
    timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata"
  });
};

module.exports = startSlotResetCron;
