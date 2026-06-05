const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

function toNumber(value) {
  return Number(value);
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function roundToTwo(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user_id: userId });
  if (!cart) {
    cart = await Cart.create({ user_id: userId, items: [] });
  }

  return cart;
}

async function buildCartResponse(cart) {
  const productIds = cart.items.map((item) => item.product_id);

  const products = await Product.find({
    _id: { $in: productIds },
    is_active: true,
  }).select("name price weight image_url is_active");

  const productMap = new Map(products.map((product) => [String(product._id), product]));

  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    const product = productMap.get(String(item.product_id));

    if (!product) {
      continue;
    }

    const lineTotal = roundToTwo(product.price * item.quantity);
    subtotal += lineTotal;

    items.push({
      product_id: product._id,
      quantity: item.quantity,
      unit_price: product.price,
      line_total: lineTotal,
      product,
    });
  }

  subtotal = roundToTwo(subtotal);

  return {
    cartId: cart._id,
    user_id: cart.user_id,
    itemCount: items.length,
    items,
    summary: {
      subtotal,
    },
    updatedAt: cart.updatedAt,
  };
}

router.get("/", auth, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.userId);
    const response = await buildCartResponse(cart);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/items", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQuantity = quantity == null ? 1 : toNumber(quantity);

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ error: "Valid productId is required" });
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const product = await Product.findOne({ _id: productId, is_active: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found or inactive" });
    }

    const cart = await getOrCreateCart(req.user.userId);
    const existing = cart.items.find(
      (item) => String(item.product_id) === String(productId)
    );

    if (existing) {
      existing.quantity += parsedQuantity;
    } else {
      cart.items.push({ product_id: productId, quantity: parsedQuantity });
    }

    await cart.save();

    const response = await buildCartResponse(cart);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
});

router.patch("/items/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const parsedQuantity = toNumber(req.body.quantity);

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const cart = await getOrCreateCart(req.user.userId);
    const existing = cart.items.find(
      (item) => String(item.product_id) === String(productId)
    );

    if (!existing) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    existing.quantity = parsedQuantity;
    await cart.save();

    const response = await buildCartResponse(cart);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/items/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    const cart = await getOrCreateCart(req.user.userId);
    cart.items = cart.items.filter(
      (item) => String(item.product_id) !== String(productId)
    );

    await cart.save();

    const response = await buildCartResponse(cart);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove cart item" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.userId);
    cart.items = [];
    await cart.save();

    const response = await buildCartResponse(cart);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Failed to clear cart" });
  }
});

module.exports = router;
