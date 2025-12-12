# Mobile Features Implementation - Test Guide

This document provides a testing guide for the newly implemented features in the Monity mobile app.

## ✅ Completed Features

### 1. Referral Program (High Priority) - COMPLETE
**Backend:**
- ✅ `backend/services/referralService.ts` - Referral service with tier system
- ✅ `backend/controllers/referralController.ts` - Referral API controller
- ✅ `backend/routes/referrals.ts` - Referral routes
- ✅ Integrated into `backend/routes/index.ts`

**Frontend:**
- ✅ `app/src/pages/referrals/Referrals.tsx` - Main referral dashboard
- ✅ `app/src/services/apiService.ts` - Referral API methods
- ✅ Navigation route added

**API Endpoints:**
- `GET /api/v1/referrals/my-code` - Get user's referral code
- `GET /api/v1/referrals/stats` - Get referral statistics
- `GET /api/v1/referrals/list` - List referrals
- `GET /api/v1/referrals/leaderboard` - Get leaderboard
- `POST /api/v1/referrals/validate-code` - Validate referral code
- `POST /api/v1/referrals/regenerate-code` - Regenerate code

**Testing:**
1. Navigate to Referrals page from Profile or menu
2. Verify referral code is displayed
3. Test copy code/link functionality
4. Test share via WhatsApp/SMS
5. Verify statistics display correctly
6. Check tier information display

### 2. Onboarding Wizard (High Priority) - COMPLETE
**Backend:**
- ✅ `backend/controllers/onboardingController.ts` - Onboarding controller
- ✅ `backend/routes/onboarding.ts` - Onboarding routes
- ✅ Integrated into `backend/routes/index.ts`

**Frontend:**
- ✅ `app/src/components/onboarding/OnboardingWizard.tsx` - Main wizard
- ✅ `app/src/components/onboarding/OnboardingStep1.tsx` - Goal setting
- ✅ `app/src/components/onboarding/OnboardingStep2.tsx` - Financial context
- ✅ `app/src/components/onboarding/OnboardingStep3.tsx` - First transaction
- ✅ `app/src/components/onboarding/OnboardingStep4.tsx` - Features preview
- ✅ `app/src/components/onboarding/OnboardingStep5.tsx` - Notifications
- ✅ `app/src/services/apiService.ts` - Onboarding API methods
- ✅ Integrated into navigation (shows on first login)

**API Endpoints:**
- `GET /api/v1/onboarding/progress` - Get onboarding progress
- `POST /api/v1/onboarding/start` - Start onboarding
- `POST /api/v1/onboarding/complete-step` - Complete a step
- `POST /api/v1/onboarding/complete` - Complete onboarding
- `POST /api/v1/onboarding/skip` - Skip onboarding
- `POST /api/v1/onboarding/checklist` - Update checklist

**Testing:**
1. Log in as a new user (or user without completed onboarding)
2. Verify wizard appears automatically
3. Test each step navigation (Next/Previous)
4. Complete Step 1 (Goal selection)
5. Complete Step 2 (Financial context)
6. Complete Step 3 (Add first transaction)
7. Complete Step 4 (Features preview)
8. Complete Step 5 (Notifications)
9. Verify completion and confetti animation
10. Test skip functionality
11. Verify wizard doesn't show again after completion

### 3. Cash Flow Calendar (High Priority) - COMPLETE
**Backend:**
- ✅ `backend/models/ScheduledTransaction.ts` - Scheduled transaction model
- ✅ `backend/services/scheduledTransactionService.ts` - Scheduled transaction service
- ✅ `backend/controllers/cashFlowController.ts` - Cash flow controller
- ✅ `backend/routes/cashFlow.ts` - Cash flow routes
- ✅ Integrated into `backend/routes/index.ts`
- ✅ Added to `backend/models/index.ts`

**Frontend:**
- ✅ `app/src/services/apiService.ts` - Cash flow API methods
- ✅ `app/src/pages/cashflow/CashFlowCalendar.tsx` - Full calendar view with scheduled transactions
- ✅ Navigation route added

**API Endpoints:**
- `GET /api/v1/cash-flow/scheduled-transactions` - Get all scheduled transactions
- `GET /api/v1/cash-flow/scheduled-transactions/:id` - Get single transaction
- `POST /api/v1/cash-flow/scheduled-transactions` - Create scheduled transaction
- `PUT /api/v1/cash-flow/scheduled-transactions/:id` - Update scheduled transaction
- `DELETE /api/v1/cash-flow/scheduled-transactions/:id` - Delete scheduled transaction
- `GET /api/v1/cash-flow/calendar-data` - Get calendar data with daily balances

**Testing:**
1. Test creating a scheduled transaction (one-time)
2. Test creating a recurring transaction (weekly, monthly, etc.)
3. Test updating a scheduled transaction
4. Test deleting a scheduled transaction
5. Test getting calendar data for a date range
6. Verify daily balance calculations

### 4. Groups & Shared Expenses (High Priority) - COMPLETE
**Backend:**
- ✅ Already exists in `backend/controllers/groupController.ts`
- ✅ Routes already exist in `backend/routes/groups.ts`

**Frontend:**
- ✅ `app/src/pages/groups/Groups.tsx` - Groups list page
- ✅ `app/src/pages/groups/CreateGroup.tsx` - Create group page
- ✅ `app/src/pages/groups/GroupDetail.tsx` - Group detail page
- ✅ `app/src/components/groups/AddExpenseModal.tsx` - Add expense modal with splitting
- ✅ `app/src/components/groups/InviteModal.tsx` - Invite members modal
- ✅ `app/src/components/groups/SettlementModal.tsx` - Settlement calculations modal
- ✅ `app/src/services/apiService.ts` - Groups API methods
- ✅ Navigation routes added

**API Endpoints:**
- `GET /api/v1/groups` - Get all groups
- `GET /api/v1/groups/:id` - Get group by ID
- `POST /api/v1/groups` - Create group
- `PUT /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group
- `POST /api/v1/groups/:id/members` - Add member
- `DELETE /api/v1/groups/:id/members/:userId` - Remove member
- `POST /api/v1/groups/:id/invite` - Send invitation
- `POST /api/v1/groups/:id/expenses` - Add expense
- `PUT /api/v1/groups/expenses/:expenseId` - Update expense
- `DELETE /api/v1/groups/expenses/:expenseId` - Delete expense
- `POST /api/v1/groups/shares/:shareId/settle` - Settle expense share

**Testing:**
1. Navigate to Groups page
2. Create a new group
3. View group details
4. Add members to group
5. Add expenses to group
6. Test expense splitting
7. Test settlement functionality
8. Verify group statistics display

### 5. Enhanced Savings Goals (High Priority) - COMPLETE
**Backend:**
- ✅ Already exists in `backend/controllers/savingsGoalController.ts`

**Frontend:**
- ✅ Enhanced `app/src/pages/savings/Savings.tsx` with:
  - Premium limit checking (3 goals for free, unlimited for premium)
  - Upgrade prompts when limit reached
  - Enhanced progress tracking with target date
  - Premium upgrade banners

**Testing:**
1. As free user, create 3 savings goals
2. Verify limit message appears when trying to create 4th goal
3. Verify upgrade prompt appears
4. Test premium user can create unlimited goals
5. Verify target date displays correctly
6. Test progress calculations

## 🧪 Testing Instructions

### Backend Testing

1. **Start the backend server:**
   ```bash
   cd Monity-Mobile/backend
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   cd Monity-Mobile
   export AUTH_TOKEN="your-auth-token-here"
   ./test-features.sh
   ```

### Frontend Testing

1. **Start the mobile app:**
   ```bash
   cd Monity-Mobile/frontend/Monity
   npm start
   ```

2. **Test each feature:**
   - Referral Program: Navigate to Referrals from Profile
   - Onboarding: Log in as new user or reset onboarding status
   - Groups: Navigate to Groups page
   - Savings: Navigate to Savings and test premium limits
   - Cash Flow: Test API endpoints (frontend calendar view pending)

### Manual Testing Checklist

#### Referral Program
- [ ] Referral code displays correctly
- [ ] Copy code works
- [ ] Copy link works
- [ ] Share via WhatsApp works
- [ ] Share via SMS works
- [ ] Statistics display correctly
- [ ] Tier information shows correctly
- [ ] QR code placeholder displays (or install react-native-qrcode-svg)

#### Onboarding Wizard
- [ ] Wizard appears on first login
- [ ] All 5 steps navigate correctly
- [ ] Step 1: Goal selection works
- [ ] Step 2: Financial context saves
- [ ] Step 3: First transaction link works
- [ ] Step 4: Features preview displays
- [ ] Step 5: Notifications toggle works
- [ ] Completion shows confetti
- [ ] Skip functionality works
- [ ] Wizard doesn't show after completion

#### Groups & Shared Expenses
- [ ] Groups list displays
- [ ] Create group works
- [ ] Group detail page loads
- [ ] Members list displays
- [ ] Expenses list displays
- [ ] Add expense modal works
- [ ] Expense splitting between members works
- [ ] Invite modal works
- [ ] Email invitation works
- [ ] Share link works
- [ ] Copy link works
- [ ] Settlement modal displays correctly
- [ ] Settlement calculations are correct
- [ ] Mark as paid functionality works

#### Enhanced Savings Goals
- [ ] Free user limit (3 goals) enforced
- [ ] Premium upgrade prompt appears at limit
- [ ] Premium user can create unlimited goals
- [ ] Target date displays correctly
- [ ] Progress calculations work
- [ ] Allocate/withdraw functionality works

#### Cash Flow Calendar
- [ ] Navigate to Cash Flow Calendar page
- [ ] Calendar grid displays correctly
- [ ] Month navigation works (previous/next)
- [ ] Date selection shows day details
- [ ] Create scheduled transaction works
- [ ] Recurring transactions can be created
- [ ] Calendar data displays correctly
- [ ] Daily balance calculations show correctly

## 📝 Notes

### Dependencies to Install

For full functionality, install these packages in the mobile frontend:

```bash
cd Monity-Mobile/frontend/Monity
npm install react-native-qrcode-svg  # For QR codes in referrals
npm install react-native-confetti-cannon  # For onboarding confetti (optional)
npm install react-native-calendars  # For cash flow calendar view
```

### Database Migrations

Ensure these database tables exist:
- `referral_codes`
- `referrals`
- `referral_rewards`
- `user_onboarding`
- `scheduled_transactions`

### Known Limitations

1. **QR Code**: Currently shows placeholder. Install `react-native-qrcode-svg` for full functionality.
2. **Groups**: Add expense and invite modals show alerts - need full modal implementation.
3. **Cash Flow Calendar**: Backend complete, frontend calendar view needs implementation.
4. **Onboarding Step 3**: Links to AddExpenseForm - verify navigation works.

## 🚀 Next Steps

1. Install missing dependencies (QR code library, calendar library)
2. Implement Groups modals (AddExpenseModal, InviteModal, SettlementModal)
3. Implement Cash Flow Calendar frontend view
4. Test all features end-to-end
5. Add error handling and loading states where needed

