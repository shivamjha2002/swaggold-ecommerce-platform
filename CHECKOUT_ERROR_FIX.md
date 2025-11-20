# Checkout Validation Error - Fix Guide

## Error Summary
**Error:** `API Error: Validation error` (400 Bad Request)  
**Endpoint:** `POST /checkout/create-order`  
**Location:** `http://localhost:5173/checkout`

## What's Happening

The backend is rejecting your checkout request because the data being sent doesn't pass validation. The error occurs **every time** because the validation rules are strict and must be met on each request.

## Common Causes & Solutions

### 1. **Mobile Number Format Issue** ⚠️ MOST COMMON
**Required:** Exactly 10 digits (no spaces, dashes, or country code)

**Check:**
- Open browser DevTools Console
- Look for the log: `Creating order with data:`
- Check if `mobile: "10 digits"` is shown
- If it shows less than 10 or more than 10, that's the issue

**Fix:** Make sure the mobile input has exactly 10 digits

### 2. **PIN Code Format Issue** ⚠️ COMMON
**Required:** Exactly 6 digits

**Check:**
- In the same console log, check `pin_code: "6 digits"`
- If it shows less than 6 or more than 6, that's the issue

**Fix:** Make sure the PIN code input has exactly 6 digits

### 3. **Empty or Invalid Fields**
**Required fields:**
- `full_name` (1-200 characters)
- `mobile` (10 digits)
- `address_line1` (1-500 characters)
- `city` (1-100 characters)
- `state` (1-100 characters)
- `pin_code` (6 digits)

**Optional fields:**
- `email` (must be valid format if provided)
- `address_line2`
- `landmark`
- `preferred_delivery_date`

### 4. **Empty Cart**
The cart must have at least one item before checkout.

**Check:** Look at the cart items on the page

## How to Debug

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try to place an order
4. Look for these logs:

```
Creating order with data: {...}
Validation errors: {...}
```

### Step 2: Identify the Exact Error
With the updated code, you'll now see detailed validation errors like:

```
Validation error - shipping_address.mobile: Mobile number must be exactly 10 digits
```

### Step 3: Fix the Specific Field
Based on the error message, correct the field that's failing validation.

## Testing the Fix

1. **Clear the form** and start fresh
2. **Fill in all required fields** carefully:
   - Full Name: Any name (e.g., "John Doe")
   - Mobile: Exactly 10 digits (e.g., "9876543210")
   - Email: Valid email or leave empty (e.g., "test@example.com")
   - Address Line 1: Any address (e.g., "123 Main Street")
   - City: Any city (e.g., "Mumbai")
   - State: Any state (e.g., "Maharashtra")
   - PIN Code: Exactly 6 digits (e.g., "400001")

3. **Click "Place Order"**
4. **Check the console** for the detailed error if it still fails

## Updated Code Changes

I've updated `src/pages/Checkout.tsx` to:

1. **Show detailed validation errors** from the backend
2. **Log the exact data** being sent (with field lengths for mobile/PIN)
3. **Display field-specific errors** in the error message

## Next Steps

1. **Refresh the page** to load the updated code
2. **Try placing an order** again
3. **Check the console** for detailed error messages
4. **Look at the error banner** on the page - it will now show specific field errors

## Example Error Messages You Might See

- ✅ **Good:** "Order created successfully"
- ❌ **Bad:** "Validation error - shipping_address.mobile: Mobile number must be exactly 10 digits"
- ❌ **Bad:** "Validation error - shipping_address.pin_code: PIN code must be exactly 6 digits"
- ❌ **Bad:** "Validation error - shipping_address.email: Please enter a valid email address"
- ❌ **Bad:** "Cart is empty - Cannot create order from empty cart"

## Still Having Issues?

If you still see the error after following these steps:

1. **Take a screenshot** of the browser console showing:
   - The "Creating order with data:" log
   - The "Validation errors:" log
   - The error message

2. **Check the Network tab** in DevTools:
   - Find the failed `/checkout/create-order` request
   - Click on it
   - Go to "Response" tab
   - Copy the full error response

3. **Share these details** so we can identify the exact validation issue

## Backend Validation Rules (Reference)

The backend (`backend/app/services/checkout_service.py`) validates:

- **Mobile:** Must match regex `^\d{10}$` (exactly 10 digits)
- **PIN Code:** Must match regex `^\d{6}$` (exactly 6 digits)
- **Email:** Must match standard email format (if provided)
- **String fields:** Must not be empty and within length limits
- **Cart:** Must have at least one item

All validation happens server-side, so client-side validation alone isn't enough.
