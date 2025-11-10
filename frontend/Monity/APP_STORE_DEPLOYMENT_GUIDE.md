# App Store Deployment Guide for Monity

This guide will walk you through deploying your Monity app to Apple's App Store Connect. I'll break down the complex process into simple, manageable steps.

## Overview: What We're Doing

Think of deploying to the App Store as a 3-stage journey:
1. **Preparation** - Setting up your app details and assets
2. **Building** - Creating the production-ready app package
3. **Submission** - Uploading to Apple and filling out store information

---

## Stage 1: Preparation (Before Building)

### Prerequisites Checklist

- [ ] **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com
  - You need this to publish any iOS app

- [ ] **App Store Connect Access**
  - Once you have a developer account, access: https://appstoreconnect.apple.com
  - This is where you'll manage your app listing

- [ ] **Expo/EAS Account** (Free tier works)
  - You're already logged in as: `leo-stuart` ✓
  - EAS handles the complex iOS building process for you

### What's Already Done ✓

Your project is already configured with:
- ✓ App icon (1024x1024 PNG)
- ✓ Splash screen
- ✓ Bundle identifier: `com.widechain.monity`
- ✓ Version: 2.0.1
- ✓ Build number: 1
- ✓ EAS configuration files
- ✓ iOS permissions configured

---

## Stage 2: Building Your App

### Understanding the Build Process

**What is EAS Build?**
EAS (Expo Application Services) is like a cloud service that takes your code and creates a production iOS app. Think of it as a specialized factory:
- You send your code (ingredients)
- EAS builds it on Apple's servers (factory processing)
- You get back an `.ipa` file (finished product)

**Why use EAS instead of building locally?**
- No need for a Mac (if you don't have one)
- No need to install Xcode (25+ GB download)
- Handles complex iOS certificates automatically
- Cloud-based = consistent builds

### Step-by-Step Build Process

#### Step 1: Create App in App Store Connect

Before building, you need to register your app with Apple:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: Monity (or your preferred name)
   - **Primary Language**: English
   - **Bundle ID**: Select or create `com.widechain.monity`
   - **SKU**: AppMonity (internal identifier, users won't see this)
   - **User Access**: Full Access

4. Click "Create"

#### Step 2: Configure Code Signing (First Time Only)

EAS can handle this automatically. You have two options:

**Option A: Automatic (Recommended for beginners)**
```bash
eas build --platform ios --profile production
```
- EAS will prompt you to create certificates
- Just answer 'yes' to prompts
- EAS manages everything for you

**Option B: Manual (If you want more control)**
```bash
eas credentials
```
- Select iOS → Production
- Choose "Set up App Store Connect API Key"
- Follow prompts to link your Apple account

#### Step 3: Run the Production Build

```bash
# Build for iOS App Store
eas build --platform ios --profile production
```

**What happens during the build:**
1. EAS uploads your code to the cloud
2. Installs dependencies
3. Compiles iOS native code
4. Signs the app with Apple certificates
5. Creates `.ipa` file (iOS app package)

**This takes 10-20 minutes** - EAS will give you a URL to monitor progress.

---

## Stage 3: Submission to App Store

### Step 4: Submit the Build

After your build completes:

**Option A: Direct Submit (Easiest)**
```bash
eas submit --platform ios --profile production
```

EAS will:
- Upload the `.ipa` to App Store Connect
- Associate it with your app
- Make it available for TestFlight testing

**Option B: Manual Submit**
1. Download `.ipa` from EAS dashboard
2. Use Transporter app (from Mac App Store)
3. Upload `.ipa` file

### Step 5: Complete App Store Listing

Go to [App Store Connect](https://appstoreconnect.apple.com) and fill out:

#### 1. App Information
- **Category**: Finance (since Monity is a financial tracker)
- **Secondary Category**: Productivity

#### 2. Pricing & Availability
- **Price**: Free (you have in-app purchases via Stripe)
- **Availability**: All countries or select specific ones

#### 3. App Privacy
You'll need to answer questions about data collection. Based on your app:

**Data Types You Collect:**
- Contact Info (email for accounts)
- Financial Info (user transactions, investments)
- User Content (receipt photos)
- Identifiers (user IDs)

**How You Use Data:**
- App Functionality
- Analytics (if using analytics)

#### 4. App Store Screenshots

**Required Sizes:**
You need screenshots for:
- 6.5" iPhone (1242 x 2688 px or 1284 x 2778 px) - at least 3 screenshots
- 5.5" iPhone (1242 x 2208 px) - optional but recommended
- iPad Pro 12.9" (2048 x 2732 px) - if supporting iPad

**How to Create:**
1. Run your app in iOS Simulator (use largest iPhone size)
2. Take screenshots: `Cmd + S` in simulator
3. Or use real device screenshots

#### 5. App Description

**App Name:** Monity

**Subtitle (30 chars):**
"Smart Money Management"

**Description (4000 chars max):**
```
Monity - Your Personal Finance Companion

Take control of your financial future with Monity, the smart way to manage your money. Track expenses, analyze spending patterns, and make informed financial decisions.

KEY FEATURES:

💰 Expense Tracking
• Scan receipts with AI technology
• Categorize transactions automatically
• Track spending across multiple accounts

📊 Financial Insights
• Visual spending analytics
• Budget tracking and alerts
• Monthly financial reports

🎯 Investment Tracking
• Monitor your portfolio
• Track investment performance
• Set financial goals

✨ Smart Features
• AI-powered categorization
• Secure cloud backup
• Dark mode support
• Multi-currency support

🔒 Privacy & Security
• Your data stays private
• Bank-level encryption
• Face ID / Touch ID support

Whether you're saving for a goal, managing a budget, or growing your wealth, Monity gives you the tools and insights you need to succeed financially.

Download Monity today and start your journey to financial wellness!
```

**Keywords (100 chars):**
```
finance,budget,expense,money,tracking,savings,investment,wallet,banking
```

**Support URL:** Your website or support email
**Marketing URL:** Your app's website (optional)

#### 6. App Review Information

**Contact Information:**
- First Name: Your name
- Last Name: Your surname
- Phone: Your phone number
- Email: Your email

**Demo Account (Important!):**
If your app requires login, provide test credentials:
- Username: testuser@example.com
- Password: TestPassword123

**Notes for Reviewer:**
```
Monity is a personal finance management app.

To test all features, please:
1. Create an account or use the demo account provided
2. Add sample transactions using the "Add Transaction" button
3. Test receipt scanning with any receipt image
4. View analytics in the Dashboard

The app uses Stripe for payment processing (for premium features).
AI features are powered by Google's Gemini API.
```

### Step 6: Submit for Review

1. Select your uploaded build (the one EAS submitted)
2. Fill in "What's New in This Version":
   ```
   Initial release of Monity!

   • Track your expenses effortlessly
   • Scan receipts with AI
   • Get insights into your spending
   • Set and achieve financial goals
   ```

3. Click "Save" then "Submit for Review"

---

## What Happens Next?

### Review Timeline

1. **Waiting for Review**: 1-3 days
2. **In Review**: 1-2 days
3. **Pending Release** or **Rejected**

**If Approved:**
- You can release immediately or schedule
- App appears in App Store within 24 hours

**If Rejected:**
- Apple provides specific reasons
- Fix issues and resubmit
- Common issues: crashes, incomplete features, guideline violations

---

## Common Commands Reference

```bash
# Check EAS login status
eas whoami

# Build for iOS production
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to App Store
eas submit --platform ios --profile production

# View credentials
eas credentials

# Update app.json and rebuild
# After editing app.json, run build command again
```

---

## Updating Your App (Future Releases)

When you want to release an update:

1. **Update version in app.json:**
   ```json
   "version": "2.0.2"  // Increment version
   ```

2. **Build number increments automatically** (configured in eas.json)

3. **Run build:**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit:**
   ```bash
   eas submit --platform ios --profile production
   ```

5. **Update "What's New"** in App Store Connect

---

## Troubleshooting

### Build Fails
- Check the build logs in EAS dashboard
- Common issues: missing dependencies, native module conflicts
- Try: `npm install` or `expo doctor`

### Certificate Issues
- Run: `eas credentials` to check/reset certificates
- Make sure your Apple Developer account is active

### App Rejected
- Read Apple's feedback carefully
- Common reasons:
  - Crashes or bugs
  - Incomplete features
  - Privacy policy missing
  - Metadata doesn't match app

### TestFlight Testing (Before App Store)
```bash
# After build, it's automatically available in TestFlight
# Go to App Store Connect → TestFlight
# Add internal testers (up to 100)
# Share link with external testers (up to 10,000)
```

---

## Key Apple Resources

- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

---

## Your Current Configuration

**Bundle ID:** com.widechain.monity
**App Name:** Monity
**Version:** 2.0.1
**Build Number:** 1
**EAS Project ID:** e2bfd3ea-a052-4ec5-9d67-bcd4067cab20

---

## Next Steps - Quick Start

1. **Create app in App Store Connect** (5 minutes)
2. **Run build command:**
   ```bash
   eas build --platform ios --profile production
   ```
3. **Wait for build** (15-20 minutes)
4. **Submit:**
   ```bash
   eas submit --platform ios --profile production
   ```
5. **Complete App Store listing** (30-60 minutes)
6. **Submit for review**

**Total time:** 1-2 hours of your work + Apple's review time (1-3 days)

---

## Questions?

If you get stuck at any point:
- Check EAS logs: https://expo.dev/accounts/leo-stuart/projects/Monity/builds
- Expo documentation: https://docs.expo.dev/submit/ios/
- Apple support: https://developer.apple.com/contact/

Good luck with your App Store submission! 🚀
