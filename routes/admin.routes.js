const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const auth = require('../middleware/auth');

/**
 * GLOBAL SEARCH (ADMIN)
 * Searches across Orders, Customers, and Partners
 */
router.get('/global-search', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
        
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ orders: [], customers: [], partners: [] });

        const regex = new RegExp(q, 'i');

        const [orders, customers, partners] = await Promise.all([
            // Search Orders by ID (using string search on _id is tricky in Mongo, usually we search actual fields)
            // But since _id is what we show, we'll try a regex on the hex string if possible or just search recent
            Order.find({ 
                $or: [
                   { _id: { $regex: regex } },
                   { "items.name": regex }
                ]
            }).limit(5).select('_id status total_price createdAt'),
            
            // Search Customers
            User.find({ 
                role: 'customer',
                $or: [
                    { name: regex },
                    { phone: regex },
                    { email: regex }
                ]
            }).limit(5).select('_id name phone'),

            // Search Partners
            DeliveryPartner.find({ 
                $or: [
                    { name: regex },
                    { phone: regex }
                ]
            }).limit(5).select('_id name phone')
        ]);

        res.json({ orders, customers, partners });
    } catch (err) {
        console.error("Global Search Error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

/**
 * GET NOTIFICATIONS (ADMIN)
 * Returns recent activity (latest 10 orders)
 */
router.get('/notifications', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user_id', 'name');

        const notifications = recentOrders.map(order => ({
            id: order._id,
            type: 'ORDER_PLACED',
            title: `New Order #${order._id.toString().slice(-6).toUpperCase()}`,
            message: `${order.user_id?.name || 'Guest'} placed an order Worth ₹${order.total_price}`,
            time: order.createdAt,
            status: order.status
        }));

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

module.exports = router;
