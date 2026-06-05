# 📱 Android Emulator Network Setup

## Issue
Mobile app running in Android emulator cannot reach backend server.

## Root Cause
Android emulators use special networking:
- `localhost` = Emulator itself (not your computer)
- `10.0.2.2` = Host computer (correct IP)
- `192.168.1.34` = Network IP (doesn't work in emulator)

## Solution

### Step 1: Update Flutter App
```dart
// In your Flutter app, change base URL:
String baseUrl = "http://10.0.2.2:5000";
```

### Step 2: Check Android Emulator Settings

#### Option A: Use Android Studio Emulator
1. Android Studio → AVD Manager
2. Edit your virtual device
3. Advanced Settings → Network
4. Ensure "Use host IP address" is enabled

#### Option B: Use Command Line
```bash
# Start emulator with network settings
emulator -avd your_avd_name -dns-server 8.8.8.8
```

### Step 3: Check Windows Firewall
1. Windows Security → Firewall & network protection
2. Allow apps through firewall
3. Add Node.js/Port 5000 to allowed apps

### Step 4: Test Connection
```bash
# From Android emulator (using adb shell)
adb shell ping 10.0.2.2

# Should ping successfully
```

### Step 5: Alternative - Use ngrok
If emulator issues persist:
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 5000

# Use ngrok URL in Flutter app
String baseUrl = "https://1234-abcd.ngrok.io";
```

## Expected Result
After configuration:
```
Mobile App (Emulator) → http://10.0.2.2:5000/api/auth/send-otp ✅
Backend → Receives request ✅
SMS → Sent to your phone ✅
```

## Troubleshooting
- Restart Android emulator after changing URL
- Clear app cache/data
- Check if emulator has internet access
- Try different emulator version
