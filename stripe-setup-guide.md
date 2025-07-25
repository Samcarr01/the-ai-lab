# Stripe Setup Guide for The AI Lab

## Current Issue
Your environment variables are using **Product IDs** (`prod_`) instead of **Price IDs** (`price_`). 

Current (incorrect):
```
STRIPE_PRO_PRICE_ID=prod_SguWiEmUHcl386
STRIPE_ULTRA_PRICE_ID=prod_SguXwRt7MD9WTk
```

## How to Fix

### Step 1: Find Your Price IDs
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click on your Pro Plan product
3. Look for the **Price ID** (starts with `price_`, not `prod_`)
4. Repeat for Ultra Plan

### Step 2: Update Environment Variables
Replace in your `.env.local` file:
```bash
STRIPE_PRO_PRICE_ID=price_1ABC123DEF456GHI
STRIPE_ULTRA_PRICE_ID=price_1XYZ789UVW012STU
```

### Step 3: If Products Don't Exist, Create Them
If you haven't created the products yet:

1. **Create Pro Plan Product:**
   - Name: "Pro Plan"
   - Price: £7.00 GBP
   - Billing: Monthly recurring
   - Copy the generated Price ID

2. **Create Ultra Plan Product:**
   - Name: "Ultra Plan" 
   - Price: £19.00 GBP
   - Billing: Monthly recurring
   - Copy the generated Price ID

### Step 4: Test the Integration
1. Restart your development server: `npm run dev`
2. Go to `/plan` page
3. Click "Upgrade to Pro" or "Upgrade to Ultra"
4. Should redirect to Stripe Checkout

## Stripe Dashboard Quick Links
- [Products & Prices](https://dashboard.stripe.com/products)
- [Customers](https://dashboard.stripe.com/customers)
- [Webhooks](https://dashboard.stripe.com/webhooks)

## Testing with Stripe Test Mode
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Current Pricing Structure
- **Free**: £0 (no Stripe price needed)
- **Pro**: £7/month (needs price ID)
- **Ultra**: £19/month (needs price ID)