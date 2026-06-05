const express = require("express");
const DeliveryZone = require("../models/DeliveryZone");
const auth = require("../middleware/auth");

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied" });
    return false;
  }

  return true;
}

/**
 * POST /api/zones (ADMIN)
 */
router.post("/", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, pincodes, isActive, slots, pricing } = req.body;

    if (!name || !pincodes || !Array.isArray(pincodes)) {
      return res.status(400).json({ error: "name and pincodes (array) required" });
    }

    const zone = await DeliveryZone.create({
      name,
      pincodes,
      isActive: isActive !== false,
      slots,
      pricing
    });

    res.status(201).json(zone);
  } catch (err) {
    res.status(500).json({ error: "Zone creation failed: " + err.message });
  }
});

/**
 * GET /api/zones (ADMIN)
 */
router.get("/", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const zones = await DeliveryZone.find()
      .populate('pricing.productPrices.productId')
      .sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

/**
 * POST /api/zones/detect
 * Checks if a specific pincode is covered by any active zone
 */
router.post("/detect", async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({ error: "pincode required" });
    }

    // Find zone that contains this pincode in its array
    const zone = await DeliveryZone.findOne({
      pincodes: pincode,
      isActive: true
    }).populate('pricing.productPrices.productId');

    if (!zone) {
      return res.json({
        zoneValid: false,
        message: "We don't deliver to this pincode yet."
      });
    }

    res.json({
      zoneValid: true,
      isActive: true,
      zoneId: zone._id,
      zoneName: zone.name,
      pricing: zone.pricing,
      message: "Delivery available in your area!"
    });

  } catch (err) {
    res.status(500).json({ error: "Zone detection failed" });
  }
});

/**
 * PUT /api/zones/:id (ADMIN)
 */
router.put("/:id", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, pincodes, isActive, slots, pricing } = req.body;
    
    if (pincodes && !Array.isArray(pincodes)) {
      return res.status(400).json({ error: "pincodes must be an array" });
    }

    const zone = await DeliveryZone.findByIdAndUpdate(
      req.params.id,
      { name, pincodes, isActive, slots, pricing },
      { new: true }
    ).populate('pricing.productPrices.productId');

    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch (err) {
    res.status(500).json({ error: "Zone update failed" });
  }
});

/**
 * DELETE /api/zones/:id (ADMIN)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json({ message: "Zone deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Zone deletion failed" });
  }
});

module.exports = router;
