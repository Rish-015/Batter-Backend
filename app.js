require("dotenv").config();

// =======================
// DNS FIX (OPTIONAL)
// =======================
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// =======================
// IMPORTS
// =======================
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const logStartupConfigChecks = require("./config/env");
const startSlotResetCron = require("./cron/slotResetCron");

const otpRoutes = require("./routes/otp");
const paymentRoutes = require("./routes/payment");

// =======================
// INIT APP
// =======================
const app = express();

logStartupConfigChecks();

// =======================
// CORS CONFIG
// =======================
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());

// =======================
// DEBUG LOGGER
// =======================
app.use((req, res, next) => {
  console.log("=== INCOMING REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log(
    "Full URL:",
    `${req.protocol}://${req.get("host")}${req.url}`
  );
  if (process.env.NODE_ENV !== "production") {
    console.log("Body:", req.body);
  }
  console.log("========================");

  next();
});

// =======================
// DATABASE CONNECTION
// =======================
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    startSlotResetCron();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });

// =======================
// ROUTES
// =======================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/auth.routes"));

app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/slots", require("./routes/slots.routes"));
app.use(
  "/api/slot-availability",
  require("./routes/slotAvailability.routes")
);
app.use("/api/zones", require("./routes/zones.routes"));
app.use(
  "/api/delivery-partners",
  require("./routes/deliveryPartner.routes")
);
app.use("/api/admin", require("./routes/admin.routes"));

app.use("/api/otp", otpRoutes);
app.use("/api/payment", paymentRoutes);

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Batter Delivery API is running",
  });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.stack);

  res.status(500).json({
    success: false,
    error: "Something broke!",
  });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`📱 Network access: http://192.168.1.34:${PORT}`);
});