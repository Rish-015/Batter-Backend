# 🍳 Batter App Backend - Complete Testing Guide

## ✅ Status: FULLY OPERATIONAL

All 9 steps of the Postman flow are now **ready to test**. The backend is running with all database fixtures pre-populated.

---

## 📋 Complete Flow (Steps 1-9)

### **1️⃣ Send OTP**
```
POST http://localhost:5000/api/auth/send-otp
Body: { "phone": "9999999999" }
Response: { "message": "OTP sent", "otp": "XXXXXX" }
```
✅ **Status:** Working - Copy OTP from response

### **2️⃣ Verify OTP**
```
POST http://localhost:5000/api/auth/verify-otp
Body: { "phone": "9999999999", "otp": "XXXXXX" }
Response: { "token": "eyJhbGc..." }
```
✅ **Status:** Working - Copy token for protected routes

### **3️⃣ Get User Profile**
```
GET http://localhost:5000/api/users/me
Headers: Authorization: Bearer {token}
Response: { "_id": "...", "phone": "9999999999", "addresses": [] }
```
✅ **Status:** Working

### **4️⃣ Add Address**
```
POST http://localhost:5000/api/users/me/address
Headers: Authorization: Bearer {token}
Body: {
  "address_text": "12 OMR Road",
  "landmark": "Near Tech Park",
  "lat": 12.915,
  "lng": 80.185,
  "is_default": true
}
Response: User object with addresses array
```
✅ **Status:** Working

### **5️⃣ Zone Detection**
```
POST http://localhost:5000/api/zones/detect
Body: { "lat": 12.915, "lng": 80.185 }
Response: { "zoneValid": true, "zoneId": "...", "zoneName": "Anna Nagar" }
```
✅ **Status:** Working
- **Zone ID:** `6990810b2b3cea8aa619d668`

### **6️⃣ Get Products**
```
GET http://localhost:5000/api/products
Response: [
  {
    "_id": "6990815131caac41acbeca6a",
    "name": "Premium Batter",
    "price": 60,
    "weight": "500g"
  }
]
```
✅ **Status:** Working
- **Product ID:** `6990815131caac41acbeca6a`

### **7️⃣ Slot Availability**
```
GET http://localhost:5000/api/slot-availability?zoneId=6990810b2b3cea8aa619d668&date=2026-02-14
Response: [
  {
    "_id": "6990815131caac41acbeca76",
    "zone_id": "6990810b2b3cea8aa619d668",
    "slot_id": { "_id": "6990815131caac41acbeca6d", "name": "Morning" },
    "date": "2026-02-14",
    "max_orders": 20,
    "available_orders": 20
  }
]
```
✅ **Status:** Working
- **Slot ID:** `6990815131caac41acbeca6d` (Morning)

### **8️⃣ Create Order**
```
POST http://localhost:5000/api/orders
Headers: Authorization: Bearer {token}
Body: {
  "productId": "6990815131caac41acbeca6a",
  "quantity": 2,
  "slotId": "6990815131caac41acbeca6d",
  "zoneId": "6990810b2b3cea8aa619d668",
  "paymentMode": "COD",
  "date": "2026-02-14"
}
Response: {
  "_id": "...",
  "status": "PLACED",
  "total_price": 120,
  "items": [...]
}
```
✅ **Status:** Working

### **9️⃣ Get Order Status**
```
GET http://localhost:5000/api/orders/{orderId}
Headers: Authorization: Bearer {token}
Response: { "_id": "...", "status": "PLACED", "total_price": 120 }
```
✅ **Status:** Working

---

## 📦 Pre-Populated Database Fixtures

Run `node seed.js` to populate with test data:

| Resource | ID | Details |
|----------|-----|---------|
| **Zone** | `6990810b2b3cea8aa619d668` | Anna Nagar (polygon-based) |
| **Product** | `6990815131caac41acbeca6a` | Premium Batter - ₹60 |
| **Morning Slot** | `6990815131caac41acbeca6d` | 07:00 - 10:00 |
| **Evening Slot** | `6990815131caac41acbeca70` | 17:00 - 20:00 |
| **Stock** | `6990815131caac41acbeca73` | 100 units for 2026-02-14 |
| **Slot Availability** | `6990815131caac41acbeca76` | Morning slot for zone (20 orders max) |

---

## 🚀 Quick Start

### **1. Start Backend**
```bash
cd c:\Users\sahan\Documents\Downloads\batterapp-backend\batterapp-backend
node app.js
```
Server runs on `http://localhost:5000`

**Health Check:**
```bash
curl http://localhost:5000/
# Response: ✅ Batter Delivery API is running
```

### **2. Seed Database** (Optional - Already done)
```bash
node seed.js
```

### **3. Import Postman Collection**
- Collection: [postman/BatterApp.postman_collection.json](postman/BatterApp.postman_collection.json)
- Environment: [postman/BatterApp.postman_environment.json](postman/BatterApp.postman_environment.json)

### **4. Run Tests in Postman**
1. Open Postman
2. Import both JSON files
3. Select environment "Batter App Local"
4. Run requests 1-9 in order
5. Token and IDs auto-populate from responses

---

## 🔧 Backend Fixes Applied

✅ **Fixed:**
- Align order creation with schema (user_id, zone_id, slot_availability_id, etc.)
- Fixed GET /api/orders/:id route (was nested in POST)
- Corrected slot availability field names (zone_id, slot_id, available_orders)
- Added address fields (landmark, lat, lng) to User model
- Fixed DeliveryZone reference in SlotAvailability model
- Added POST /api/zones for zone creation
- Auth endpoint returns OTP in response
- Installed Cloudinary dependencies

✅ **Verified:**
- OTP generation and verification working
- JWT token creation and validation working
- User profile retrieval with authentication
- Address management
- Zone detection with geospatial queries
- Product listing
- Slot availability queries
- Order creation with all validations
- Order status retrieval

---

## 📊 MongoDB Collections

```
batterapp
├── users (tested)
├── otps (temporary, 5min TTL)
├── products (seeded)
├── deliveryzones (seeded)
├── deliveryslots (seeded)
├── stocks (seeded)
├── slotavailabilities (seeded)
└── orders (created during testing)
```

---

## 🧪 Run Full Flow via Terminal

```powershell
# Step 1: Send OTP
$otp = (Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/send-otp -ContentType "application/json" -Body '{"phone":"9999999999"}').otp

# Step 2: Verify OTP
$token = (Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/verify-otp -ContentType "application/json" -Body "{`"phone`":`"9999999999`",`"otp`":`"$otp`"}").token

# Step 3: Get Profile
Invoke-RestMethod -Method Get -Uri http://localhost:5000/api/users/me -Headers @{"Authorization"="Bearer $token"}

# Step 4: Add Address
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/users/me/address -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"} -Body '{"address_text":"12 OMR Road","landmark":"Near Tech Park","lat":12.915,"lng":80.185,"is_default":true}'

# Step 5: Detect Zone
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/zones/detect -ContentType "application/json" -Body '{"lat":12.915,"lng":80.185}'

# Step 6: Get Products
Invoke-RestMethod -Method Get -Uri http://localhost:5000/api/products

# Step 7: Get Slot Availability
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/slot-availability?zoneId=6990810b2b3cea8aa619d668&date=2026-02-14"

# Step 8: Create Order
$order = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/orders -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"} -Body '{"productId":"6990815131caac41acbeca6a","quantity":2,"slotId":"6990815131caac41acbeca6d","zoneId":"6990810b2b3cea8aa619d668","paymentMode":"COD","date":"2026-02-14"}'

# Step 9: Get Order Status
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/orders/$($order._id)" -Headers @{"Authorization"="Bearer $token"}
```

---

## ✅ All 9 Steps Ready

The complete Postman testing flow is now **fully functional and verified**. You can:

1. **Use Postman Collection** - Import and run all 9 steps with auto token/ID management
2. **Use Terminal** - Run PowerShell commands directly (see above)
3. **Use Browser** - Test GET endpoints directly in URL bar

**Server Status:** ✅ Running on port 5000  
**Database:** ✅ Connected & Seeded  
**All Routes:** ✅ Tested & Working
