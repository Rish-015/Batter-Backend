const express = require("express");
const mongoose = require("mongoose");
const SlotAvailability = require("../models/SlotAvailability");
const DeliverySlot = require("../models/DeliverySlot");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizeDate(date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split("T")[0];
}

function buildSlotFilter(zone_id, slot_id, slot_name, date) {
  const filter = {
    zone_id,
    date,
  };

  if (slot_id && mongoose.Types.ObjectId.isValid(slot_id)) {
    filter.$or = [{ slot_id }, { slot_name: slot_id }];
  } else if (slot_name) {
    filter.slot_name = slot_name;
  }

  return filter;
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

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const records = await SlotAvailability.find({
      date: normalizedDate
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

    const promises = updates.map(async (update) => {
      const { zone_id, slot_id, slot_name, date, max_orders, available_orders } = update;
      const normalizedDate = normalizeDate(date);

      if (!zone_id || !normalizedDate || (!slot_id && !slot_name)) {
        throw new Error("zone_id, a slot identifier, and a valid date are required");
      }

      const slotDoc =
        slot_id && mongoose.Types.ObjectId.isValid(slot_id)
          ? await DeliverySlot.findById(slot_id)
          : null;

      const resolvedSlotName = slot_name || slotDoc?.name;
      return SlotAvailability.findOneAndUpdate(
        buildSlotFilter(zone_id, slot_id, resolvedSlotName, normalizedDate),
        {
          $set: {
            slot_id: slot_id || slotDoc?._id,
            slot_name: resolvedSlotName,
            max_orders,
            available_orders,
          },
        },
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

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const slots = await SlotAvailability.find({
      zone_id: zoneValue,
      date: normalizedDate,
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

    const normalizedDate = normalizeDate(date);
    if (!zone_id || !normalizedDate || !slot_id) {
      return res.status(400).json({ error: "zone_id, slot_id and a valid date are required" });
    }

    const slotDoc =
      slot_id && mongoose.Types.ObjectId.isValid(slot_id)
        ? await DeliverySlot.findById(slot_id)
        : null;

    const record = await SlotAvailability.findOneAndUpdate(
      buildSlotFilter(zone_id, slot_id, slotDoc?.name, normalizedDate),
      {
        $set: {
          slot_id: slot_id || slotDoc?._id,
          slot_name: slotDoc?.name,
          max_orders,
          available_orders,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json(record);
  } catch {
    res.status(500).json({ error: "Failed to create slot availability" });
  }
});

module.exports = router;
