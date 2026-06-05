# 🚀 Complete Ngrok Setup Guide

## 📋 Quick Steps

### 1. Download Ngrok
```
Go to: https://ngrok.com/download
Download: ngrok-v3-stable-windows-amd64.zip
Extract to: C:\ngrok
```

### 2. Setup Path (One-time)
```
1. Search "Environment Variables" in Windows
2. Click "Edit the system environment variables"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit" → "New" → Add "C:\ngrok"
6. Click OK on all windows
```

### 3. Start Your Backend
```bash
# Make sure your backend is running
node app.js
# Should see: 🚀 Server running on port 5000
```

### 4. Start Ngrok
```bash
# Open new Command Prompt
ngrok http 5000
```

### 5. Get Your URL
Ngrok will show:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:5000
```

### 6. Update Mobile App
```dart
// In your Flutter app
String baseUrl = "https://abc123.ngrok.io"; // Use ngrok URL
```

## 🔧 Alternative: Use Cloudflare Tunnel (Free)

### 1. Install Cloudflared
```bash
# Download from: https://github.com/cloudflare/cloudflared/releases
# Extract cloudflared.exe
```

### 2. Start Tunnel
```bash
cloudflared tunnel --url http://localhost:5000
```

### 3. Use Cloudflare URL
```
String baseUrl = "https://random-words.trycloudflare.com";
```

## 🎯 Expected Result

After setup:
- ✅ Backend: Running on localhost:5000
- ✅ Ngrok: Public HTTPS URL
- ✅ Mobile App: Can connect from anywhere
- ✅ Smart User Flow: Working with new logic

## 📱 Testing

1. Update mobile app base URL to ngrok URL
2. Test OTP with new phone number → Should go to profile
3. Test OTP with existing phone → Should go to dashboard
4. Verify SMS delivery works

## 🚨 Troubleshooting

### Ngrok Not Found
- Download directly: https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip
- Extract and run from extracted folder

### Connection Issues
- Check backend is running on port 5000
- Verify ngrok shows "Session Status: online"
- Use https:// in mobile app URL

### Timeout Issues
- Increase mobile app timeout to 30 seconds
- Check ngrok dashboard at http://127.0.0.1:4040

## 🎉 Benefits

- ✅ No network configuration needed
- ✅ Works with any mobile device
- ✅ HTTPS automatically provided
- ✅ Real-time request inspection
- ✅ Free for development use
