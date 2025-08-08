# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 **Project Overview**
- **Name:** thehackai  
- **Domain:** https://thehackai.com
- **Purpose:** Subscription platform for curated AI documents and GPTs
- **Business Model:** Freemium with Pro/Ultra tiers
- **Value Proposition:** "Battle-tested AI workflows that actually work"

## 🛠️ **Tech Stack**
- **Frontend:** Next.js 14 with TypeScript and Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth with PKCE flow
- **Payments:** Stripe subscription management
- **Email Marketing:** Brevo API integration
- **File Storage:** Supabase Storage for PDFs
- **Styling:** Tailwind CSS v3.4.17 with shadcn/ui components
- **AI Integration:** OpenAI GPT-4o + DALL-E 3, Perplexity Sonar for web search

## 📊 **Database Schema**
```sql
users (id, email, first_name, last_name, user_tier, stripe_customer_id, created_at, updated_at)
documents (id, title, description, pdf_url, category, is_featured, added_date, created_at, updated_at)
gpts (id, title, description, chatgpt_url, category, is_featured, added_date, created_at, updated_at)
blog_posts (id, title, content, slug, published_at, meta_description, category, read_time, generated_images)
affiliate_tools (id, title, description, category, affiliate_url, image_url, is_featured, created_at, updated_at)
```

## 🎯 **Business Model - Freemium Platform**

### **Free Users (Default):**
- **Account Required:** Must create account to access any content (builds email list)
- **GPTs Access:** Preview titles, descriptions, categories (no direct ChatGPT links)
- **Documents Access:** Preview titles, descriptions, categories (no PDF downloads)
- **Blog Access:** Full access to all blog posts (SEO driver + immediate value)
- **Clear Upgrade Path:** Strategic upgrade prompts throughout platform

### **Pro & Ultra Users:**
- **Everything Free Users Get PLUS:**
- **Direct GPT Links:** Click and immediately access ChatGPT tools
- **PDF Downloads:** Download all playbooks and guides
- **Priority Support:** Enhanced customer service
- **Early Access:** New content before free users

### **Content Strategy:**
- **Account-Gated Browsing:** Increases conversion opportunities
- **Blog Posts:** Drive SEO traffic and provide immediate value
- **GPTs/Documents:** Premium conversion drivers requiring upgrade
- **Strategic Upgrade Prompts:** Throughout user journey without being pushy

## 🎉 **PLATFORM STATUS: 100% PRODUCTION READY (February 2025)**

### **✅ Core Platform Features (100% Complete)**
- **Authentication System:** Supabase auth with PKCE flow, email confirmation working
- **User Profiles:** Automatic creation with first_name/last_name support
- **Dashboard:** Smart user detection with Pro/Free views
- **GPTs Collection:** 7 featured GPTs with category filtering and direct ChatGPT integration
- **Documents/Playbooks:** PDF upload system with AI-powered categorization
- **Admin Panel:** Complete content management with AI analysis
- **Subscription System:** Stripe integration with webhook handling
- **Affiliate Tools System:** Complete "Our Toolkit" with AI-powered tool analysis and modal expansion

### **✅ Authentication & User Management (100% Complete)**
- **PKCE Flow:** Properly configured for email confirmation
- **Rate Limiting:** 429 error prevention with smart throttling
- **Dashboard Loading:** Optimized to prevent timeout issues
- **Brevo Integration:** Email list management with duplicate contact handling
- **Session Management:** Proper auth state handling and persistence
- **Mobile Authentication:** Complete mobile-optimized auth flow

### **✅ Content Management (100% Complete)**
- **AI-Powered Analysis:** GPT-4o analyzes uploaded content for titles/descriptions
- **Category System:** Smart categorization for GPTs and documents
- **Feature Toggles:** Admin can promote content to featured sections
- **CRUD Operations:** Complete create, read, update, delete functionality
- **Real-time Updates:** Changes reflect immediately across platform
- **File Storage:** Supabase Storage integration for PDF uploads

### **✅ UI/UX Design (100% Complete)**
- **Apple-Inspired Design:** Purple gradient system with glassmorphism
- **Mobile Responsive:** Comprehensive optimization across all devices
- **Premium Animations:** Scroll-triggered demos, typing effects, 3D hover cards
- **Touch Optimization:** 44px minimum touch targets, proper mobile navigation
- **Interactive Elements:** Modal system, expandable descriptions, smooth transitions
- **Professional Typography:** Progressive scaling across breakpoints
- **Toolkit Modal System:** Beautiful card expansion with blurred backdrop and comprehensive tool details

### **✅ Payment Integration (100% Complete)**
- **Stripe Checkout:** Secure payment processing for Pro and Ultra subscriptions
- **Webhook Handling:** Automatic user status updates on payment events
- **Subscription Management:** Multi-tier status tracking (Free/Pro/Ultra) in database
- **Payment Flow:** Seamless upgrade journey with proper error handling

### **✅ Email Marketing (100% Complete)**
- **Brevo Integration:** Automatic contact addition on signup
- **List Management:** Smart assignment to All Users, Pro, and Ultra tier lists
- **Duplicate Handling:** Existing contacts treated as success
- **Background Processing:** Non-blocking integration during signup
- **Error Handling:** Comprehensive logging and graceful failures

### **✅ Debug & Monitoring (100% Complete)**
- **System Status Endpoint:** Comprehensive health monitoring
- **Debug Tools:** Brevo config testing, auth callback debugging
- **Real-time Logging:** Detailed console output for troubleshooting
- **Error Tracking:** TypeScript-safe error handling throughout platform

## 🎨 **Design System**

### **Color Palette:**
- **Primary:** Purple gradient system (`gradient-purple`)
- **Mobile Nav:** `#1a1a2e` (solid dark background)
- **Glass Effects:** `backdrop-blur-sm` with purple accents
- **Text:** White on dark, purple gradients for highlights

### **Typography:**
- **Font:** Inter with proper loading optimization
- **Responsive Scaling:** text-3xl (mobile) → text-7xl (desktop)
- **Gradient Text:** Purple gradients for hero sections and CTAs

### **Components:**
- **Custom Classes:** `.glass`, `.gradient-purple`, `.text-gradient`, `.button-hover`
- **Card Effects:** 3D hover transformations with glassmorphism
- **Animation System:** Scroll-triggered, intersection observer-based
- **Mobile Navigation:** Slide-in panels with hamburger menu

## 🏗️ **Architecture**

### **File Structure:**
```
src/
├── app/                    # Next.js 14 app router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── gpts/             # GPTs listing
│   ├── documents/        # Documents/playbooks listing
│   ├── toolkit/          # Affiliate tools showcase
│   ├── admin/            # Admin panel
│   └── api/              # API routes
│     └── ai/             # AI services (analysis, research)
├── components/           # Reusable UI components
├── lib/                 # Utilities and services
│   ├── supabase/       # Database clients
│   ├── auth.ts         # Authentication service
│   ├── brevo.ts        # Email marketing service
│   ├── affiliate-tools.ts # Affiliate tools management
│   └── stripe.ts       # Payment processing
└── styles/             # Global styles
```

### **Key Services:**
- **Authentication:** `src/lib/auth.ts` - Rate-limited Supabase auth
- **User Management:** `src/lib/user.ts` - Profile creation and management
- **Content Services:** `src/lib/gpts.ts`, `src/lib/documents.ts`
- **AI Analysis:** `src/app/api/ai/analyze-document/route.ts`
- **Payment Processing:** `src/lib/stripe.ts`
- **Email Marketing:** `src/lib/brevo.ts`
- **Affiliate Tools:** `src/lib/affiliate-tools.ts` - Tool management with access control
- **AI Tool Analysis:** `src/app/api/ai/analyze-affiliate-tool/route.ts` - Comprehensive tool research

## 🔧 **Admin Workflow**

### **Admin Access:**
- **Email:** samcarr1232@gmail.com (automatic Pro access + Admin privileges)
- **Admin Panel:** `/admin` with content management studio
- **Admin Toggle:** Switch between Admin and Free user views for testing

### **Content Management:**
1. **Upload Content:** AI analyzes GPT URLs or PDF documents
2. **Review & Edit:** Modify AI-generated titles/descriptions
3. **Feature Toggle:** Click star icon to promote to featured sections
4. **Real-time Updates:** Changes reflect immediately across platform
5. **Delete Management:** Remove content with complete cleanup

### **AI Analysis Features:**
- **GPT URL Analysis:** Extracts titles, descriptions, categories from ChatGPT links
- **PDF Document Analysis:** Intelligent content analysis with filename recognition
- **Smart Categorization:** Auto-assigns appropriate categories
- **Professional Results:** Clean titles and compelling descriptions

### **Affiliate Tools Management:**
1. **Tool Research:** Add any affiliate URL for comprehensive AI analysis
2. **Perplexity Integration:** Fast web search with Sonar model for factual research
3. **Enhanced AI Analysis:** 250-350 word detailed personal stories with metrics
4. **Rich Content Structure:** Why we love it, standout features, key benefits
5. **Admin Approval:** Review and edit AI-generated content before publishing
6. **Category Assignment:** Auto-categorization with manual override options
7. **Image Upload:** Custom tool images with automatic resizing and optimization

## 🛠️ **Our Toolkit System (100% Complete)**

### **✅ Public Toolkit Page (`/toolkit`)**
- **Value Proposition:** "The battle-tested tools that transformed our business"
- **Professional Design:** Purple gradient cards with glassmorphism effects
- **Category Filtering:** Smart categorization with emoji indicators
- **Featured/Regular Sections:** Highlight game-changing tools vs essential arsenal
- **Modal Expansion:** Beautiful full-screen modals with blurred backdrop
- **Responsive Design:** Optimized for all device sizes with touch-friendly interactions

### **✅ Enhanced UI/UX Experience**
- **Card Preview:** Clean design with tool icons, titles, categories, and descriptions
- **Modal System:** Click to expand into comprehensive tool details
- **Professional Aesthetics:** Purple-themed gradients eliminating harsh black corners
- **Interactive Elements:** Hover effects, smooth animations, and accessible navigation
- **Smart Text Fitting:** Auto-truncation ensuring content always displays properly

### **✅ Comprehensive Tool Analysis**
- **AI-Powered Research:** Perplexity integration for factual web search
- **Personal Stories:** 250-350 word authentic testimonials with metrics
- **Detailed Sections:** Why we love it, standout features, key benefits
- **Quantified Benefits:** Specific time savings, efficiency gains, ROI evidence
- **Professional Tone:** Authentic enthusiasm balanced with credibility

### **✅ Content Structure**
- **Discovery Context:** Personal stories about finding and testing tools
- **Feature Breakdown:** Practical applications with real-world use cases
- **Transformation Metrics:** Quantifiable productivity gains and cost savings
- **Pain Point Solutions:** Specific problems eliminated by each tool
- **Workflow Integration:** How tools fit into daily business operations

### **✅ Admin Integration**
- **URL Analysis:** Add any affiliate link for automatic AI research
- **Content Review:** Edit AI-generated analysis before publishing
- **Image Management:** Upload and optimize tool logos/screenshots
- **Feature Control:** Toggle featured status for priority placement
- **Category Management:** Auto-categorization with manual override

## 🚀 **Deployment Status**

### **Production Environment:**
- **Domain:** https://thehackai.com (custom domain configured)
- **Hosting:** Vercel with automatic GitHub deployments
- **Database:** Supabase (production instance)
- **CDN:** Vercel Edge Network for global performance

### **Environment Variables (Required):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Brevo Email Marketing
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=hello@thehackai.com

# AI Services
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://thehackai.com
```

## 📱 **Mobile Optimization**

### **Responsive Design:**
- **Touch Targets:** Minimum 44px for accessibility compliance
- **Navigation:** Premium slide-in panels with hamburger menus
- **Typography:** Progressive scaling across all breakpoints
- **Cards:** Responsive padding and uniform heights
- **Animations:** Hardware-accelerated for smooth 60fps performance

### **Mobile Navigation Features:**
- **InternalMobileNavigation:** For authenticated users
- **MobileNavigation:** For public users
- **User Status Display:** Pro/Free badges in mobile menu
- **Admin Access:** Admin panel link for admin users only
- **Route Detection:** Active page highlighting with purple indicators

## 🔍 **Debug Endpoints**

### **System Monitoring:**
- **Health Check:** `/api/debug/system-status` - Complete system health
- **Brevo Config:** `/api/debug/brevo-config` - Email integration status
- **Auth Debug:** `/api/debug/auth-callback` - Email confirmation testing
- **Migration Check:** `/api/admin/migrate-names` - Database schema validation

### **Testing Tools:**
- **Brevo Test:** `/api/debug/brevo-test` - Manual contact testing
- **Supabase Test:** `/api/debug/supabase-test` - Database connection

## 🎯 **User Journey**

### **New User Flow:**
1. **Homepage Visit:** Marketing site with clear value proposition
2. **Account Creation:** Sign up with first/last name, email, password
3. **Email Confirmation:** PKCE flow redirects to dashboard (not error page)
4. **Dashboard Access:** Automatic profile creation with user stats
5. **Content Exploration:** Preview GPTs/documents with upgrade prompts
6. **Upgrade Decision:** Stripe checkout for Pro or Ultra access

### **Pro & Ultra User Experience:**
- **Direct GPT Access:** Click and immediately access ChatGPT tools
- **PDF Downloads:** Instant download buttons for all playbooks
- **No Upgrade Prompts:** Clean interface focused on content consumption
- **Priority Features:** Early access and enhanced support

## 📋 **Common Commands**

### **Development:**
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint checking
```

### **Deployment:**
```bash
git add -A
git commit -m "feat: description"
git push origin main  # Auto-deploys to Vercel
```

## 🚨 **Known Issues & Solutions**

### **Authentication:**
- ✅ **Email Confirmation:** Fixed PKCE flow configuration
- ✅ **Rate Limiting:** Implemented smart throttling for 429 prevention
- ✅ **Dashboard Loading:** Optimized timeout handling

### **Brevo Integration:**
- ✅ **Duplicate Contacts:** Treats existing contacts as success
- ✅ **API Configuration:** Verified working with production API key
- ✅ **List Management:** Proper assignment to user tier lists

### **TypeScript:**
- ✅ **Build Errors:** All property naming issues resolved
- ✅ **Type Safety:** Consistent interfaces throughout codebase

## 🎊 **Current Status: FULLY OPERATIONAL**

**The thehackai.com platform is 100% production-ready with:**
- ✅ **Complete Authentication System** - Signup, email confirmation, dashboard access
- ✅ **Content Management** - 7 GPTs, admin panel, AI analysis
- ✅ **Payment Processing** - Stripe integration with Pro and Ultra subscriptions
- ✅ **Email Marketing** - Brevo integration with list management
- ✅ **Mobile Optimization** - Comprehensive responsive design
- ✅ **Debug Infrastructure** - Monitoring and troubleshooting tools
- ✅ **Our Toolkit System** - Complete affiliate tools showcase with AI-powered analysis
- ✅ **Blog Generation System** - AI-powered content creation with permanent image storage

**Ready for users and scaling!** 🚀

## 🔄 **Maintenance Notes**

### **Regular Tasks:**
- Monitor system status via debug endpoints
- Review Brevo contact additions for new signups
- Check Stripe webhook logs for payment processing
- Update content via admin panel as needed

### **Known Issues:**
- **DALL-E Image URLs**: Generated images from OpenAI are temporary and may flicker/expire. Consider downloading and re-uploading to Supabase Storage for permanent hosting.
- **Perplexity API Key**: Must be added to Vercel environment variables for web search functionality

### **Future Enhancements (Optional):**
- Implement permanent image storage for blog posts
- Privacy policy page completion
- Google OAuth configuration in Supabase
- Account deletion functionality
- Advanced analytics integration