const express = require("express");
const DeliverySlot = require("../models/DeliverySlot");
const auth = require("../middleware/auth");
const router = express.Router();

function requireAdmin(req, res) {
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied" });
    return false;
  }

  return true;
}

// Admin create slot
router.post("/", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const slot = await DeliverySlot.create(req.body);
    res.json(slot);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Slot with this name already exists" });
    }
    res.status(500).json({ error: err.message || "Failed to create slot" });
  }
});

// Admin get all slots (including inactive)
router.get("/admin/all", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const slots = await DeliverySlot.find().sort({ start_time: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

// Get active slots (for users)
router.get("/", async (req, res) => {
  try {
    const slots = await DeliverySlot.find({ is_active: true }).sort({ start_time: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch active slots" });
  }
});

// Admin Update Slot
router.put("/:id", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const slot = await DeliverySlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message || "Slot update failed" });
  }
});

// Admin Delete Slot
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const slot = await DeliverySlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    res.json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Slot deletion failed" });
  }
});

module.exports = router;
