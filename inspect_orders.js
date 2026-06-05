const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(20);
        console.log('--- LATEST 20 ORDERS ---');
        allOrders.forEach(o => {
            console.log(`ID: ${o._id}, Status: ${o.status}, DeliveryDateStr: "${o.delivery_date}", CreatedAt: ${o.createdAt}`);
        });
        
        const today = new Date().toISOString().split('T')[0];
        console.log(`\nSearching for matches with date: "${today}"`);
        const matches = await Order.find({ delivery_date: today });
        console.log(`Found ${matches.length} orders for "${today}"`);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
