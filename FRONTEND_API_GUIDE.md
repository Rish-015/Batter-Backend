# 📱 Frontend Integration Guide

## Base URLs

### Development (Local)
```
http://localhost:5000
```

### Production (Deployed)
```
https://your-domain.com
```

### Mobile Testing (Same WiFi)
```
http://192.168.1.34:5000
```

## API Endpoints

### 🔐 Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

Request Body:
{
  "phone": "8015187334"
}

Response:
{
  "message": "OTP sent successfully",
  "phone": "8015187334",
  "sid": "SM1234567890"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

Request Body:
{
  "phone": "8015187334",
  "otp": "123456"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "customer"
}
```

#### Admin Login
```http
POST /api/auth/login-admin
Content-Type: application/json

Request Body:
{
  "username": "admin@batterexpress.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "...", "role": "admin" }
}
```

### 👤 User Management

#### Get Profile
```http
GET /api/users/me
Authorization: Bearer JWT_TOKEN

Response:
{
  "_id": "...",
  "phone": "8015187334",
  "name": "User Name",
  "addresses": [...]
}
```

#### Add Address
```http
POST /api/users/me/address
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request Body:
{
  "address_text": "12 OMR Road, Chennai",
  "landmark": "Near Tech Park",
  "lat": 12.915,
  "lng": 80.185,
  "is_default": true
}

Response:
{
  "addresses": [...],
  "default_address": "..."
}
```

### 🛍️ Products

#### Get Products
```http
GET /api/products

Response:
[
  {
    "_id": "...",
    "name": "Premium Batter",
    "price": 60,
    "weight": "500g",
    "image_url": "https://...",
    "is_active": true
  }
]
```

### 🗺️ Zones & Slots

#### Detect Zone
```http
POST /api/zones/detect
Content-Type: application/json

Request Body:
{
  "lat": 12.915,
  "lng": 80.185
}

Response:
{
  "zoneValid": true,
  "zoneId": "...",
  "zoneName": "Anna Nagar"
}
```

#### Get Slot Availability
```http
GET /api/slot-availability?zoneId=ZONE_ID&date=2026-05-12

Response:
[
  {
    "_id": "...",
    "zone_id": "ZONE_ID",
    "slot_id": { "_id": "...", "name": "Morning" },
    "date": "2026-05-12",
    "max_orders": 20,
    "available_orders": 18
  }
]
```

### 📦 Orders

#### Create Order
```http
POST /api/orders
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request Body:
{
  "productId": "PRODUCT_ID",
  "quantity": 2,
  "slotId": "SLOT_ID",
  "zoneId": "ZONE_ID", 
  "paymentMode": "COD",
  "address_text": "12 OMR Road, Chennai"
}

Response:
{
  "_id": "...",
  "user_id": "...",
  "items": [...],
  "total_price": 120,
  "status": "PLACED",
  "delivery_date": "2026-05-12",
  "delivery_slot": "Morning"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer JWT_TOKEN

Response:
[...]
```

### 🔧 Integration Examples

#### JavaScript/Fetch
```javascript
const API_BASE = 'http://localhost:5000';

// Send OTP
const sendOTP = async (phone) => {
  const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (phone, otp) => {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  const data = await response.json();
  
  // Save token
  localStorage.setItem('authToken', data.token);
  return data;
};
```

#### Flutter/Dart
```dart
class ApiService {
  static const String baseUrl = 'http://localhost:5000';
  
  static Future<Map<String, dynamic>> sendOTP(String phone) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone}),
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> verifyOTP(String phone, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'otp': otp}),
    );
    
    final data = json.decode(response.body);
    
    // Save token
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', data['token']);
    
    return data;
  }
}
```

## 🚀 Quick Start

1. **Use Base URL**: `http://localhost:5000`
2. **Send OTP First**: Get JWT token
3. **Include Token**: Add `Authorization: Bearer TOKEN` header
4. **Test Flow**: OTP → Login → Profile → Products → Orders

## 📋 Testing Checklist

- [ ] Send OTP works
- [ ] Verify OTP works  
- [ ] Get user profile
- [ ] Add address
- [ ] Get products
- [ ] Detect zone
- [ ] Check slot availability
- [ ] Create order
- [ ] Get order history

Your backend is ready for frontend integration! 🎉
