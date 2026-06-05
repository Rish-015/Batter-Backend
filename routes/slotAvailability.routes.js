const express = require("express");
const SlotAvailability = require("../models/SlotAvailability");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

/**
 * ADMIN: GET ALL SLOT AVAILABILITY FOR A DATE (Across all zones)
 * GET /api/slot-availability/admin/all?date=YYYY-MM-DD
 */
router.get("/admin/all", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const records = await SlotAvailability.find({
      date: normalizeDate(date)
    }).populate("slot_id").populate("zone_id");

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin slot records" });
  }
});

/**
 * ADMIN: BULK UPDATE SLOT AVAILABILITY
 * POST /api/slot-availability/bulk-update
 */
router.post("/bulk-update", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const { updates } = req.body; // Array of { zone_id, slot_id, date, max_orders, available_orders }

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates array required" });
    }

    const promises = updates.map(update => {
      const { zone_id, slot_id, slot_name, date, max_orders, available_orders } = update;
      return SlotAvailability.findOneAndUpdate(
        { zone_id, slot_name, date: normalizeDate(date) },
        { slot_id, max_orders, available_orders },
        { upsert: true, new: true }
      );
    });

    await Promise.all(promises);
    res.json({ message: "Bulk update successful" });
  } catch (err) {
    res.status(500).json({ error: "Bulk update failed: " + err.message });
  }
});

/**
 * USER: GET AVAILABLE SLOTS FOR ZONE + DATE
 * GET /api/slot-availability
 */
router.get("/", async (req, res) => {
  try {
    const zoneValue = req.query.zoneId || req.query.zone_id;
    const { date } = req.query;

    if (!zoneValue || !date) {
      return res.status(400).json({ error: "zoneId and date are required" });
    }

    const slots = await SlotAvailability.find({
      zone_id: zoneValue,
      date: normalizeDate(date),
      available_orders: { $gt: 0 }
    }).populate("slot_id");

    res.json(slots);
  } catch {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

/**
 * ADMIN: SINGLE UPDATE (Backward compatibility)
 * POST /api/slot-availability
 */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const { zone_id, slot_id, date, max_orders, available_orders } = req.body;

    const record = await SlotAvailability.findOneAndUpdate(
      { zone_id, slot_id, date: normalizeDate(date) },
      { max_orders, available_orders },
      { upsert: true, new: true }
    );

    res.status(201).json(record);
  } catch {
    res.status(500).json({ error: "Failed to create slot availability" });
  }
});

module.exports = router;
