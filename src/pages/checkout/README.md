# Checkout Page Implementation

## Overview

This directory contains the new multi-step checkout flow implementation as specified in task 18.

## Components

### CheckoutPage.tsx
Main checkout page component with multi-step wizard:
- **Step 1: Address** - Select or add delivery address
- **Step 2: Payment** - Payment method selection (placeholder for task 19)
- **Step 3: Confirmation** - Order confirmation (placeholder for task 19)

Features:
- Protected route (authentication required)
- Progress indicator showing current step
- Order summary sidebar
- Back navigation between steps

### AddressStep.tsx
Address selection and management component:
- Displays saved addresses
- "Add New Address" form with validation
- Address selection with visual indicator
- Edit and delete address functionality
- Calls POST /api/addresses to save new address
- Form validation for all required fields

### CheckoutSidebar.tsx
Order summary sidebar component:
- Displays cart items with images
- Shows price breakdown (subtotal, GST, shipping, total)
- Sticky positioning for easy viewing
- Payment methods accepted

### PaymentStep.tsx (Placeholder)
Payment method selection component:
- To be implemented in task 19: Integrate Razorpay payment gateway
- Currently shows placeholder with mock continue button

### ConfirmationStep.tsx (Placeholder)
Order confirmation component:
- To be implemented in task 19: Integrate Razorpay payment gateway
- Currently shows placeholder confirmation message

## Routes

- `/checkout-new` - New multi-step checkout page (task 18)
- `/checkout` - Old checkout page (kept for backward compatibility)

## API Integration

### Address Service (addressService.ts)
- `GET /api/addresses` - Fetch all user addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

## Requirements Covered

- **1.13.1**: Multi-step checkout wizard
- **1.13.2**: Address selection and management
- **1.13.3**: Order summary sidebar
- **1.13.4**: Continue to payment button

## Next Steps

Task 19 will implement:
- Razorpay payment integration
- Payment processing
- Order creation
- Order confirmation

## Testing

To test the new checkout flow:
1. Add items to cart
2. Navigate to `/checkout-new`
3. Select or add a delivery address
4. Click "Continue to Payment"
5. Use mock continue button (payment integration pending)

## Notes

- The old checkout page at `/checkout` is still functional
- Address validation includes phone number (10 digits) and pincode (6 digits)
- Default address is auto-selected when available
- Form errors are displayed inline with red styling
