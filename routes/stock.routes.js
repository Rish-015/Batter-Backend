const express = require("express");
const mongoose = require("mongoose");
const Stock = require("../models/Stock");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * Helper: normalize date to YYYY-MM-DD
 */
function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

/**
 * ---------------------------------------
 * ADMIN: SET / UPDATE STOCK FOR A DAY
 * ---------------------------------------
 * POST /api/stock
 */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const { product_id, date, available_quantity } = req.body;

    if (!product_id || !date || available_quantity == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    if (available_quantity < 0) {
      return res.status(400).json({ error: "Stock cannot be negative" });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const stockDate = normalizeDate(date);

    const stock = await Stock.findOneAndUpdate(
      { product_id, date: stockDate },
      { available_quantity },
      { upsert: true, new: true }
    ).populate("product_id", "name price weight");

    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------
 * ADMIN: GET ALL STOCK (ALL DATES, ALL PRODUCTS)
 * ---------------------------------------
 * GET /api/stock/all
 */
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const stocks = await Stock.find()
      .populate("product_id", "name price weight is_active")
      .sort({ date: -1 });

    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all stock" });
  }
});


/**
 * ---------------------------------------
 * USER / ADMIN: GET STOCK BY DATE
 * ---------------------------------------
 * GET /api/stock?date=2026-02-02
 */
router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.date) {
      query.date = normalizeDate(req.query.date);
    }

    const stocks = await Stock.find(query)
      .populate("product_id", "name price weight is_active")
      .sort({ date: 1 });

    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

/**
 * ---------------------------------------
 * USER: GET STOCK FOR A PRODUCT (TODAY)
 * ---------------------------------------
 * GET /api/stock/product/:productId
 */
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const today = normalizeDate(new Date());

    const stock = await Stock.findOne({
      product_id: productId,
      date: today
    }).populate("product_id", "name price weight");

    if (!stock) {
      return res.status(404).json({ error: "No stock available for today" });
    }

    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

/**
 * ---------------------------------------
 * ADMIN: DELETE STOCK ENTRY
 * ---------------------------------------
 * DELETE /api/stock/:id
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    const stock = await Stock.findByIdAndDelete(req.params.id);

    if (!stock) {
      return res.status(404).json({ error: "Stock entry not found" });
    }

    res.json({ message: "Stock entry deleted" });

  } catch (err) {
    res.status(400).json({ error: "Invalid stock ID" });
  }
});

module.exports = router;
