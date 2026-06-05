const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orders = await Order.find({ status: 'DELIVERED' }).sort({ updatedAt: -1 }).limit(10);
        console.log('--- DELIVERED ORDERS ---');
        orders.forEach(o => {
            console.log(`ID: ${o._id}, Status: ${o.status}, DeliveryDate: ${o.delivery_date}, UpdatedAt: ${o.updatedAt}`);
        });
        
        const count = await Order.countDocuments({});
        console.log('Total Orders in DB:', count);
        
        process.exit();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
};

debug();
