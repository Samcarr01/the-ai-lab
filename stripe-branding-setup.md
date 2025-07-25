# Stripe Checkout Branding Setup Guide

## Issue
The Stripe Checkout page doesn't match our Apple-inspired purple design theme.

## Solution: Configure Stripe Dashboard Branding

### Step 1: Access Stripe Branding Settings
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Branding**
3. This is where you customize the checkout appearance

### Step 2: Brand Settings to Match thehackai Design

#### **Logo & Icon**
- **Logo**: Upload your thehackai logo (recommended: 240x60px PNG with transparent background)
- **Icon**: Upload favicon/icon (recommended: 128x128px PNG)

#### **Colors** (Match our purple theme)
- **Primary Color**: `#7C3AED` (purple-600 - matches our gradient buttons)
- **Background Color**: `#FFFFFF` (white background)
- **Accent Color**: `#6D28D9` (purple-700 - for hover states)

#### **Typography**
- **Font**: Select a clean, modern font like "Inter" or "SF Pro" to match Apple aesthetic

### Step 3: Business Information
- **Business Name**: `thehackai`
- **Support URL**: `https://the-ai-lab.vercel.app/contact` (when contact page is created)
- **Terms of Service**: `https://the-ai-lab.vercel.app/terms`
- **Privacy Policy**: `https://the-ai-lab.vercel.app/privacy` (when created)

### Step 4: Checkout Customization
Under **Settings** → **Checkout**:
- **Collect customer name**: Enabled
- **Collect phone number**: Disabled (already set in code)
- **Allow promotion codes**: Enabled (already set in code)

### Step 5: Email Receipts
Under **Settings** → **Emails**:
- **From name**: `thehackai`
- **From email**: `noreply@thehackai.com` (when domain is set up)
- **Support email**: `support@thehackai.com`

## Expected Result
After configuration, Stripe Checkout will show:
- ✅ thehackai logo at the top
- ✅ Purple primary color for buttons and accents
- ✅ Clean white background
- ✅ Professional business information
- ✅ Branded email receipts
- ✅ Custom success messaging

## Alternative: Stripe Elements (Advanced)
If you need even more customization, we could implement **Stripe Elements** directly on our checkout page with full custom styling, but this requires more development work.

## Current Code Improvements
I've already enhanced the checkout session creation with:
- ✅ Apple Pay and Google Pay support
- ✅ Custom submission messaging
- ✅ Professional invoice branding
- ✅ Proper metadata for tracking
- ✅ Disabled unnecessary fields for digital products

## Next Steps
1. **Configure Stripe Dashboard branding** (5 minutes)
2. **Test checkout flow** to see improved branding
3. **Optional**: Create custom logos/assets if needed