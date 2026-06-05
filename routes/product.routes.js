const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

/**
 * GET ALL ACTIVE PRODUCTS (USER)
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ is_active: true })
      .sort({ created_at: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * ADMIN – GET ALL PRODUCTS
 */
router.get("/admin/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const products = await Product.find()
      .sort({ created_at: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET PRODUCT BY ID (USER)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      is_active: true,
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({
      error: "Invalid product ID",
    });
  }
});

/**
 * CREATE PRODUCT (ADMIN)
 */
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, price, weight } = req.body;

    if (!name || !price || !weight) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        error: "Invalid price",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Product image is required",
      });
    }

    const product = await Product.create({
      name,
      price,
      weight,
      image_url: req.file.path,
      image_public_id: req.file.filename || req.file.public_id,
      is_active: true,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("PRODUCT CREATE ERROR:", err);

    res.status(500).json({
      error: err.message || "Product creation failed",
    });
  }
});

/**
 * UPDATE PRODUCT (ADMIN)
 */
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    if (req.file) {
      if (product.image_public_id) {
        await cloudinary.uploader.destroy(product.image_public_id);
      }

      product.image_url = req.file.path;
      product.image_public_id =
        req.file.filename || req.file.public_id;
    }

    if (req.body.name) product.name = req.body.name;
    if (req.body.price) product.price = req.body.price;
    if (req.body.weight) product.weight = req.body.weight;

    if (req.body.is_active !== undefined) {
      product.is_active = req.body.is_active;
    }

    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Update failed",
    });
  }
});

/**
 * DELETE PRODUCT (ADMIN)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    if (product.image_public_id) {
      try {
        await cloudinary.uploader.destroy(
          product.image_public_id
        );
      } catch (err) {
        console.warn(
          "Cloudinary deletion failed:",
          err.message
        );
      }
    }

    await product.deleteOne();

    res.json({
      message: "Product and image deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: "Deletion failed",
    });
  }
});

/**
 * DISABLE PRODUCT (ADMIN)
 */
router.patch("/:id/disable", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await Product.findByIdAndUpdate(req.params.id, {
      is_active: false,
    });

    res.json({
      message: "Product disabled",
    });
  } catch (err) {
    res.status(400).json({
      error: "Invalid product ID",
    });
  }
});

/**
 * ENABLE PRODUCT (ADMIN)
 */
router.patch("/:id/enable", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await Product.findByIdAndUpdate(req.params.id, {
      is_active: true,
    });

    res.json({
      message: "Product enabled",
    });
  } catch (err) {
    res.status(400).json({
      error: "Invalid product ID",
    });
  }
});

module.exports = router;