# Admin Login Credentials

## ✅ Admin User Created Successfully!

Use these credentials to login to the admin dashboard:

```
Username: admin
Email: admin@swatijewellers.com
Password: admin123
Role: admin
```

## 🚀 How to Login:

1. **Open the application**: Go to `http://localhost:5173`

2. **Navigate to Admin Dashboard**: 
   - Click on "Admin" in the navbar, OR
   - Go directly to `http://localhost:5173/admin`

3. **Enter credentials**:
   - Username: `admin`
   - Password: `admin123`

4. **Click Login**

## ✅ What You Can Do After Login:

- **View Dashboard**: See analytics, sales trends, and metrics
- **Manage Products**: Create, edit, delete, publish/unpublish products
- **Upload Images**: Add product images when creating/editing products
- **Manage Orders**: View and manage customer orders
- **Export Data**: Export sales, customer, and product data

## 🔒 Security Notes:

⚠️ **IMPORTANT**: This is a development password. For production:
1. Change the password immediately after first login
2. Use a strong, unique password
3. Enable two-factor authentication if available
4. Never commit credentials to version control

## 🛠️ Troubleshooting:

### If login fails:
1. Make sure backend is running: `python backend/run.py`
2. Check MongoDB is running
3. Verify credentials are correct
4. Check browser console for errors

### If you need to reset password:
```bash
cd backend
python reset_admin_password.py
```

### If you need to create a new admin:
```bash
cd backend
python create_admin.py
```

## 📝 Backend Status:

✅ Backend running on: `http://localhost:5000`
✅ MongoDB connected
✅ Admin user exists with role: `admin`
✅ JWT authentication configured
✅ All API endpoints ready

## 🎯 Next Steps:

1. Login with the credentials above
2. Create some products with images
3. Test the admin dashboard features
4. Change the default password for security

Enjoy managing your jewelry store! 💎
