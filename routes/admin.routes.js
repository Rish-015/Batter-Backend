const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const auth = require('../middleware/auth');

function escapeRegex(input) {
    return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GLOBAL SEARCH (ADMIN)
 * Searches across Orders, Customers, and Partners
 */
router.get('/global-search', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
        
        const { q } = req.query;
        const searchTerm = String(q || '').trim().slice(0, 100);
        if (!searchTerm || searchTerm.length < 2) return res.json({ orders: [], customers: [], partners: [] });

        const regex = new RegExp(escapeRegex(searchTerm), 'i');
        const orderFilter = { "items.name": regex };

        if (/^[a-fA-F0-9]{24}$/.test(searchTerm)) {
            orderFilter._id = searchTerm;
        }

        const [orders, customers, partners] = await Promise.all([
            Order.find(orderFilter).limit(5).select('_id status total_price createdAt'),
            
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
