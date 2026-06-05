# Batter Backend

Node.js + Express backend for Batter delivery orders, OTP login, and Razorpay payments.

## Quick Start

```bash
npm install
copy .env.example .env
npm start
```

## Required Environment Variables

- `MONGO_URI`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `MSG91_AUTH_KEY`
- `MSG91_TEMPLATE_ID`

## OTP Notes

- OTP send endpoint: `POST /api/auth/send-otp`
- OTP resend endpoint: `POST /api/auth/resend-otp`
- Verify + login endpoint: `POST /api/auth/verify-otp`
- Phone format: `91XXXXXXXXXX`
- MSG91 template must exist and be approved in the MSG91 dashboard.

## Payment Notes

- Create order: `POST /api/payment/create-order`
- Verify payment/success callback: `POST /api/payment/verify-payment` or `POST /api/payment/callback/success`
- Failure callback: `POST /api/payment/callback/failure`
- Both payment routes require `Authorization: Bearer <token>`.

## Orders Notes

- Checkout summary: `POST /api/orders/checkout-summary`
- Create order: `POST /api/orders`
	- For `paymentMode: "ONLINE"`, send `paymentOrderId` from verified Razorpay payment.
- User order history: `GET /api/orders`

## Cart Notes

- Get cart: `GET /api/cart`
- Add item: `POST /api/cart/items`
- Update quantity: `PATCH /api/cart/items/:productId`
- Remove item: `DELETE /api/cart/items/:productId`
- Clear cart: `DELETE /api/cart`

## Logout Notes

- Logout endpoint: `POST /api/auth/logout`

## API Health

```bash
GET /
```

Returns a simple JSON health response.

## Production Checklist

- Set all required env vars.
- Confirm MSG91 template id in the dashboard.
- Use real Razorpay live keys in production.
- Keep MongoDB reachable before starting the app.