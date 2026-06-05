# 🎯 Smart User Flow Implementation Guide

## ✅ Backend Implementation Complete

Your backend now intelligently handles user flow:

### 🔍 Backend Logic
```javascript
// When user verifies OTP:
let user = await User.findOne({ phone });
let isNewUser = false;

if (!user) {
  user = await User.create({ phone, role: 'customer' });
  isNewUser = true;
}

return {
  token: "jwt_token",
  role: "customer",
  isNewUser: true/false,
  user: { user_data },
  navigateTo: isNewUser ? "profile" : "dashboard"
};
```

### 📱 API Response Format

#### New User Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "customer",
  "isNewUser": true,
  "user": {
    "_id": "user_id_here",
    "phone": "8015187334",
    "name": null,
    "email": null,
    "addresses": []
  },
  "navigateTo": "profile"
}
```

#### Existing User Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "customer",
  "isNewUser": false,
  "user": {
    "_id": "user_id_here",
    "phone": "8015187334",
    "name": "John Doe",
    "email": "john@example.com",
    "addresses": [
      {
        "address_text": "12 OMR Road",
        "landmark": "Near Tech Park",
        "is_default": true
      }
    ]
  },
  "navigateTo": "dashboard"
}
```

## 📱 Frontend Implementation

### Flutter/Dart Implementation

#### Update OTP Verification Logic:
```dart
Future<void> verifyOTP(String phone, String otp) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'otp': otp}),
    );

    final data = json.decode(response.body);

    if (response.statusCode == 200) {
      // Save token
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString('authToken', data['token']);
      
      // Save user data
      await prefs.setString('userData', json.encode(data['user']));
      
      // Smart navigation based on user type
      if (data['navigateTo'] == 'profile') {
        // New user - go to profile page
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => ProfilePage()),
        );
        print('👤 New user detected, navigating to profile');
      } else {
        // Existing user - go to dashboard
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => HomePage()),
        );
        print('🏠 Existing user detected, navigating to dashboard');
      }
    } else {
      _showError(data['message'] ?? 'OTP verification failed');
    }
  } catch (e) {
    _showError('Network error. Please try again.');
  }
}
```

#### Profile Page Implementation:
```dart
class ProfilePage extends StatefulWidget {
  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
  }
  
  Future<void> _loadUserData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    final userData = json.decode(prefs.getString('userData') ?? '{}');
    
    setState(() {
      _nameController.text = userData['name'] ?? '';
      _emailController.text = userData['email'] ?? '';
    });
  }
  
  Future<void> _saveProfile() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('authToken');
      
      final response = await http.put(
        Uri.parse('$baseUrl/api/users/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'name': _nameController.text,
          'email': _emailController.text,
        }),
      );
      
      if (response.statusCode == 200) {
        // Update saved user data
        final updatedUser = json.decode(response.body);
        await prefs.setString('userData', json.encode(updatedUser));
        
        // Navigate to dashboard after profile completion
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => HomePage()),
        );
        
        _showSuccess('Profile saved successfully!');
      }
    } catch (e) {
      _showError('Failed to save profile');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Complete Profile')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: 'Name'),
            ),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saveProfile,
              child: Text('Save Profile'),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### Dashboard/Home Page Implementation:
```dart
class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Map<String, dynamic> userData = {};
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
  }
  
  Future<void> _loadUserData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    final data = json.decode(prefs.getString('userData') ?? '{}');
    
    setState(() {
      userData = data;
    });
    
    print('🏠 Welcome back: ${userData['name'] ?? 'User'}');
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Dashboard')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome, ${userData['name'] ?? 'User'}!'),
            Text('Phone: ${userData['phone'] ?? ''}'),
            Text('Email: ${userData['email'] ?? 'Not set'}'),
            // Add other dashboard features
          ],
        ),
      ),
    );
  }
}
```

## 🎯 User Flow Summary

### 🆕 New User Journey:
1. **Enter Phone** → OTP sent
2. **Verify OTP** → Backend returns `isNewUser: true`, `navigateTo: "profile"`
3. **Navigate** → ProfilePage
4. **Complete Profile** → Save name, email, etc.
5. **Navigate** → Dashboard (HomePage)

### 👤 Existing User Journey:
1. **Enter Phone** → OTP sent
2. **Verify OTP** → Backend returns `isNewUser: false`, `navigateTo: "dashboard"`
3. **Navigate** → Dashboard (HomePage)
4. **Auto-load** → User profile data
5. **Ready to use** → All app features

## 🧪 Testing

### Test New User:
1. Use a phone number not in database
2. Complete OTP verification
3. Should navigate to ProfilePage
4. After saving profile, should go to Dashboard

### Test Existing User:
1. Use a phone number already in database
2. Complete OTP verification
3. Should navigate directly to Dashboard
4. Profile data should be auto-loaded

## ✅ Benefits

- **Smart Navigation**: Users go to appropriate screen
- **Better UX**: No redundant profile steps for existing users
- **Data Persistence**: User data preserved across sessions
- **Clean Logic**: Backend handles user state, frontend just navigates

Your smart user flow is now implemented! 🚀
