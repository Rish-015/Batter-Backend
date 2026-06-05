require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@batterapp";
    const adminPassword = "Admin@123";
    const adminPhone = "0000000000";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin user already exists. Updating password...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log("Admin password updated successfully.");
    } else {
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "Super Admin",
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        role: "admin"
      });
      console.log("Admin user created successfully.");
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err.message);
    process.exit(1);
  }
};

seedAdmin();
