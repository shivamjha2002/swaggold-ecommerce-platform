# 🔧 CORS Error Fix - Complete Guide

## ❌ Problem

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Reason:** Frontend port (`5174`) backend ke `.env` file mein allowed origins list mein nahi tha.

---

## ✅ Solution Applied

### File Modified: `backend/.env`

**Before:**
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**After:**
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

---

## 🚀 How to Fix

### Step 1: Backend Server Restart Karo

**Option A: If using Python directly**
```bash
cd backend
python run.py
```

**Option B: If using Flask**
```bash
cd backend
flask run
```

**Option C: If using Gunicorn**
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### Step 2: Frontend Refresh Karo

```bash
# Browser mein
Ctrl + Shift + R (Hard refresh)
# Ya
F5 (Normal refresh)
```

---

## 🧪 Testing

### Check if Backend is Running:

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T...",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy"
    }
  }
}
```

### Check CORS Headers:

```bash
curl -H "Origin: http://localhost:5174" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/products
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:5174
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📝 What is CORS?

**CORS (Cross-Origin Resource Sharing)** ek security feature hai jo browsers mein built-in hai.

### Why CORS Exists:

- **Security:** Prevent unauthorized websites from accessing your API
- **Protection:** Stop malicious scripts from stealing data
- **Control:** You decide which domains can access your API

### How CORS Works:

```
Frontend (http://localhost:5174)
    ↓
    Request to Backend (http://localhost:5000)
    ↓
Backend checks: Is 5174 in allowed origins?
    ↓
    YES → Allow request ✅
    NO  → Block request ❌
```

---

## 🔍 Common CORS Errors

### 1. Port Mismatch (Your Issue)

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' 
from origin 'http://localhost:5174' has been blocked
```

**Fix:**
Add port to `CORS_ORIGINS` in `backend/.env`

### 2. Missing CORS Headers

**Error:**
```
No 'Access-Control-Allow-Origin' header is present
```

**Fix:**
Ensure Flask-CORS is installed and configured

### 3. Credentials Issue

**Error:**
```
Credentials flag is 'true', but 'Access-Control-Allow-Credentials' header is ''
```

**Fix:**
Set `supports_credentials=True` in CORS config (already done)

### 4. Preflight Request Failed

**Error:**
```
Response to preflight request doesn't pass access control check
```

**Fix:**
Ensure OPTIONS method is allowed (already done)

---

## 🛠️ Backend CORS Configuration

### Current Setup (backend/app/__init__.py):

```python
CORS(app, resources={
    r"/api/*": {
        "origins": app.config['CORS_ORIGINS'],  # From .env file
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", ...],
        "supports_credentials": True
    }
})
```

### Config File (backend/app/config.py):

```python
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
```

**Default:** `*` (allows all origins - only for development)

---

## 🔐 Production CORS Setup

### For Production:

**backend/.env (Production):**
```env
CORS_ORIGINS=https://swatijewellers.com,https://www.swatijewellers.com
```

**Important:**
- ❌ Never use `*` in production
- ✅ Only allow your actual domain
- ✅ Use HTTPS only
- ✅ No localhost in production

---

## 📊 Troubleshooting Checklist

### If CORS Error Still Persists:

- [ ] Backend server restarted?
- [ ] `.env` file saved?
- [ ] Correct port in `CORS_ORIGINS`?
- [ ] Browser cache cleared?
- [ ] Hard refresh done (Ctrl+Shift+R)?
- [ ] Check browser console for exact error
- [ ] Check backend logs for errors
- [ ] Verify backend is running on port 5000
- [ ] Verify frontend is running on port 5174

### Check Backend Logs:

```bash
# Look for these messages:
✅ "Successfully connected to MongoDB"
✅ "Running on http://0.0.0.0:5000"
❌ "Failed to connect to MongoDB"
❌ "Address already in use"
```

---

## 🎯 Quick Commands

### Restart Backend:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd backend
python run.py
```

### Check if Port 5000 is in Use:

**Windows:**
```cmd
netstat -ano | findstr :5000
```

**Linux/Mac:**
```bash
lsof -i :5000
```

### Kill Process on Port 5000:

**Windows:**
```cmd
# Find PID from netstat command above
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
kill -9 $(lsof -t -i:5000)
```

---

## 📱 Frontend Configuration

### Current API Base URL (src/services/api.ts):

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### If You Want to Change Frontend Port:

**Option 1: Change Vite Port**

Create/edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5173  // Change to desired port
  }
})
```

**Option 2: Update Backend CORS**

Add new port to `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:YOUR_PORT
```

---

## 🎉 Summary

### What Was Fixed:

1. ✅ Added `http://localhost:5174` to `CORS_ORIGINS`
2. ✅ Backend now allows requests from port 5174
3. ✅ All API calls will work after backend restart

### What You Need to Do:

1. **Restart backend server**
2. **Refresh frontend page**
3. **Test API calls**

### Expected Result:

- ✅ No more CORS errors
- ✅ API calls successful
- ✅ Products load
- ✅ Login works
- ✅ All features functional

---

## 📞 Still Having Issues?

### Check These:

1. **Backend Running?**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Correct Port?**
   - Frontend: Check browser URL
   - Backend: Check terminal output

3. **Environment Variables Loaded?**
   ```bash
   cd backend
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('CORS_ORIGINS'))"
   ```

4. **Browser Console:**
   - Open DevTools (F12)
   - Check Console tab
   - Look for error messages

---

## 🚀 Ready!

Backend restart karo aur sab kaam karega! 🎉

**Commands:**
```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend (already running)
# Just refresh browser
```

Happy Coding! 💻✨
