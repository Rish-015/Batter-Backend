# 🚀 Ngrok Setup Guide

## Step 1: Download Ngrok
Go to https://ngrok.com/download and download for Windows

## Step 2: Install Ngrok
1. Extract the downloaded zip file
2. Move ngrok.exe to a folder (e.g., C:\ngrok)
3. Add C:\ngrok to PATH environment variable

## Step 3: Start Ngrok
Open Command Prompt and run:
```bash
ngrok http 5000
```

## Step 4: Get Your URL
Ngrok will show something like:
```
ngrok by @inconshreveable

Session Status                online
Account                       Your Name
Version                       3.x.x
Region                        United States (us-cal-1)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://1234-abcd.ngrok.io -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p100
                              1       0       0.00    0.00    0.00    0.00
```

## Step 5: Use in Mobile App
Update your Flutter app to use the ngrok URL:
```dart
String baseUrl = "https://1234-abcd.ngrok.io"; // Use the URL from ngrok
```

## Alternative: Use Direct Download
```bash
# Download ngrok for Windows
curl https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip -o ngrok.zip
# Extract and run ngrok.exe
```

## Benefits of Ngrok
- ✅ Public HTTPS URL for your localhost
- ✅ Works with mobile devices and emulators
- ✅ No network configuration needed
- ✅ Real-time request inspection at http://127.0.0.1:4040
