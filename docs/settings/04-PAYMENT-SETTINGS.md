# Payment Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Payment

---

## 💳 Flexible Payments (Pro Feature)

### 🎯 What Are Flexible Payments?
Flexible payments give your customers options beyond paying the full amount upfront. Think of it like offering payment plans, deposits, or partial payments - just like hotels and airlines do!

### 🤔 Why This Matters
- **Higher conversion rates:** Customers are more likely to book when they don't need to pay everything upfront
- **Larger trip sales:** Expensive trips become more accessible when payment is spread out
- **Better cash flow for customers:** Spreads out the financial burden
- **Competitive advantage:** Most travel businesses offer some form of flexible payment

### Enable Partial Payment
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Pro Feature:** Yes - Requires Yatra Pro license
- **Description:** Allow customers to pay a portion now and the rest later
- **What it does:** Gives customers the option to pay a percentage now and the remaining amount later
- **How it works for customers:**
  - Customer sees trip price: $1,000
  - Customer chooses to pay 30% now: $300
  - Remaining $700 due before trip departure
  - Customer gets immediate booking confirmation
- **When to use this:**
  - **Perfect for:** Trips over $500, international travel, custom tours
  - **Not needed for:** Small day trips under $100
- **⭐ Pro Tip:** Start with 30% - it's a sweet spot between getting meaningful payment and keeping it affordable

### Partial Payment Percentage
- **Field Type:** Number Input
- **Default:** 30%
- **Validation:** Must be between 0-100%
- **Description:** Percentage of total amount required for partial payment
- **What it controls:** The minimum amount customers must pay upfront
- **How it appears:** "Pay 30% now ($300), pay remaining 70% ($700) later"
- **Common percentages and when to use them:**
  - **10-20%:** For very expensive trips ($2,000+) to make them more accessible
  - **25-35%:** Standard for most trips (balances accessibility with your cash flow)
  - **40-50%:** For high-demand trips where you want more commitment
- **⚠️ Important:** This only appears when you enable Partial Payment
- **📊 Business impact:** Lower percentages = higher bookings, but more follow-up work for you

### Require Deposit
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Pro Feature:** Yes - Requires Yatra Pro license
- **Description:** Require a deposit to confirm bookings
- **What it does:** Makes deposits mandatory (not optional like partial payments)
- **How it's different from Partial Payment:**
  - **Partial Payment:** Customer chooses to pay part now, part later (optional)
  - **Deposit:** Customer MUST pay deposit to secure booking (mandatory)
- **When to use this:**
  - **Great for:** High-demand trips where you want to secure spots
  - **Perfect for:** Custom tours that require upfront planning costs
  - **Use when:** You need commitment before investing time/resources
- **⭐ Pro Tip:** Use deposits for popular trips to reduce no-shows

### Deposit Percentage
- **Field Type:** Number Input
- **Default:** 20%
- **Validation:** Must be between 0-100%
- **Description:** Percentage of total amount required as deposit
- **What it controls:** The mandatory deposit amount customers must pay
- **How it works:**
  - Trip price: $1,000
  - Deposit required: 20% = $200
  - Customer cannot book without paying $200 deposit
  - Remaining $800 due before trip
- **Common deposit strategies:**
  - **10-15%:** For expensive trips to keep barrier low
  - **20-25%:** Standard for most travel businesses
  - **30%+:** For very popular or custom trips
- **⚠️ Important:** This only appears when you enable "Require Deposit"
- **⭐ Pro Tip:** Higher deposits reduce cancellations but may reduce initial bookings

---

## ⚡ Auto-Confirm Pay Later Bookings

### Auto-Confirm "Pay Later" Bookings
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Available:** Free Version (no Pro required)
- **Description:** Automatically confirm bookings when "Book Now, Pay Later" is selected
- **What it does:** Controls what happens when customers choose to pay later instead of immediately
- **When enabled:**
  - Customer selects "Pay Later" option
  - Booking is immediately confirmed
  - Customer gets confirmation email
  - Trip spot is reserved for them
  - Payment due before trip departure
- **When disabled:**
  - Customer selects "Pay Later" option
  - Booking stays in "Pending" status
  - No confirmation email sent yet
  - Trip spot not fully reserved
  - You must manually confirm when ready
- **🎯 Why this matters:**
  - **Enabled:** Better customer experience, less work for you
  - **Disabled:** More control, but more manual work and potential customer confusion
- **⭐ Pro Tip:** Keep this enabled unless you have a specific reason to manually review pay-later bookings

---

## 🌐 Payment Gateways

### Test Mode (Global Control)
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Enable test/sandbox mode for ALL payment gateways
- **What it does:** Switches ALL payment gateways between test and live mode
- **When enabled (TEST MODE):**
  - All gateways use test/sandbox credentials
  - No real money is processed
  - Perfect for testing and development
  - Shows "TEST" badge in checkout
- **When disabled (LIVE MODE):**
  - All gateways use live credentials
  - Real money is processed
  - Ready for actual customer payments
  - No "TEST" badge shown
- **⚠️ CRITICAL WARNING:** 
  - ONLY disable when you're ready to accept real payments
  - Test thoroughly before switching to live mode
  - Double-check all gateway configurations
- **🔍 Visual Indicator:** Amber "TEST" badge appears when enabled

### Gateway Management Interface

#### Understanding the Gateway List
- **What you see:** All available payment methods you can offer customers
- **How it's organized:** 
  - Drag and drop to reorder (changes checkout display order)
  - Up/down arrows for precise positioning
  - Each gateway shows its current status
- **Why order matters:** 
  - First gateway shown gets most attention
  - Put your preferred payment method first
  - Consider customer preferences

#### Gateway Configuration (Common to All Gateways)

##### Enable Gateway
- **Field Type:** Checkbox
- **Description:** Turn individual payment gateway on or off
- **What it does:** Controls whether customers see this payment option
- **When enabled:** Gateway appears in checkout for customers to select
- **When disabled:** Gateway is hidden from customers
- **⭐ Pro Tip:** Only enable gateways you're actually ready to accept payments from

##### Gateway Icon
- **Field Type:** URL Input
- **Description:** Icon or logo displayed on booking page
- **What it does:** Shows visual representation of payment method
- **Why it matters:** 
  - Builds trust (familiar logos)
  - Improves user experience (visual cues)
  - Professional appearance
- **Examples:**
  - Credit card: Visa/Mastercard logos
  - PayPal: PayPal logo
  - Bank transfer: Bank icon
- **⭐ Pro Tip:** Use official logos from payment providers for brand recognition

##### Gateway Title
- **Field Type:** Text Input
- **Description:** Customer-facing name for payment method
- **What it does:** Sets the text customers see for this payment option
- **Why it matters:** Clear titles help customers choose the right payment method
- **Good examples:**
  - "Credit Card" (clear and familiar)
  - "PayPal" (brand recognition)
  - "Bank Transfer" (descriptive)
- **Bad examples:**
  - "Payment Option 1" (confusing)
  - "Gateway" (technical jargon)
- **⭐ Pro Tip:** Use names customers will recognize and understand

##### Gateway Description
- **Field Type:** Textarea
- **Description:** Additional information shown below the payment method title
- **What it does:** Provides extra context about the payment method
- **Why it matters:** Can answer customer questions and build confidence
- **Good examples:**
  - "Pay securely with your credit card. All major cards accepted."
  - "Fast, secure payments with your PayPal account."
  - "Transfer funds directly to our bank account."
- **⭐ Pro Tip:** Keep descriptions short but informative

---

## 🏦 Gateway-Specific Configurations

### Stripe Gateway (Credit Cards)
- **What it is:** Most popular online payment processor for credit cards
- **Best for:** Accepting all major credit and debit cards
- **Configuration fields:**
  - **API Key:** Your Stripe public key (starts with pk_test_ or pk_live_)
  - **API Secret:** Your Stripe secret key (starts with sk_test_ or sk_live_)
  - **Enabled Methods:** Choose which payment types to accept
    - **Card:** Traditional credit/debit card entry
    - **Google Pay:** One-click payments for Android/Chrome users
    - **Apple Pay:** One-click payments for Apple device users
- **⚠️ Important:** Apple Pay requires domain verification in your Stripe Dashboard
- **🔧 Setup steps:**
  1. Create Stripe account (stripe.com)
  2. Get API keys from Stripe Dashboard
  3. Test with test keys first
  4. Enable Apple Pay if desired (requires domain setup)

### PayPal Gateway
- **What it is:** World's most popular digital wallet
- **Best for:** Customers who prefer PayPal over credit cards
- **Configuration fields:**
  - **Client ID:** Your PayPal application client ID
  - **Client Secret:** Your PayPal application secret
- **🔧 Setup steps:**
  1. Create PayPal Developer account
  2. Create new application
  3. Get Client ID and Secret
  4. Set up webhook URLs for payment notifications

### Offline Gateways (No API Keys Required)

#### Pay Later
- **What it is:** Manual payment option - book now, pay later
- **Best for:** Customers who want to reserve spots but pay offline
- **How it works:**
  - Customer books trip without immediate payment
  - You contact customer to arrange payment (cash, check, etc.)
  - You manually confirm booking when payment received
- **Configuration:** No API keys needed - just enable and customize title/description
- **⭐ Pro Tip:** Great for local customers or businesses that accept multiple payment types

#### Bank Transfer
- **What it is:** Direct bank transfer payment method
- **Best for:** International customers or large payments
- **How it works:**
  - Customer sees your bank details during checkout
  - Customer transfers money manually
  - You verify receipt and confirm booking
- **Configuration:** Add your bank account details in the description
- **⚠️ Important:** Only show bank details after booking is confirmed for security

---

## 🎨 Gateway Status Indicators (Visual Cues)

### Active Badge
- **Appearance:** Green "Active" badge
- **Meaning:** Gateway is enabled and ready to accept payments
- **When you see it:** Gateway is properly configured and turned on

### PRO Badge
- **Appearance:** Purple gradient "PRO" badge
- **Meaning:** This gateway requires Yatra Pro license
- **When you see it:** Premium features only available with Pro version

### TEST Badge
- **Appearance:** Amber "TEST" badge
- **Meaning:** Test mode is enabled globally
- **When you see it:** All payments are in test/sandbox mode (no real money)

---

## 🎯 Best Practices for Payment Settings

### 1. Test Mode Strategy
- **ALWAYS start in test mode:** Never go live without testing
- **Use real test scenarios:** Test successful payments, failed payments, refunds
- **Test with multiple gateways:** Ensure all your payment methods work
- **Check email notifications:** Confirm confirmation emails are sent correctly
- **⚠️ Critical:** Only switch to live mode when you're 100% ready

### 2. Gateway Selection and Order
- **Know your customers:** Offer payment methods your customers actually use
- **Geographic considerations:** 
  - US: Credit cards, PayPal
  - Europe: Credit cards, PayPal, local methods
  - Asia: Credit cards, local digital wallets
- **Gateway order strategy:**
  1. Most popular method first (usually credit cards)
  2. Digital wallets second (PayPal, Apple Pay, Google Pay)
  3. Offline methods last (bank transfer, pay later)

### 3. Flexible Payment Strategy
- **Use deposits for:** High-demand trips, custom tours, expensive packages
- **Use partial payments for:** Making expensive trips more accessible
- **Communicate clearly:** Always explain payment terms upfront
- **Set reminders:** Have a system for following up on remaining payments

### 4. Security and Configuration
- **Protect API keys:** Never share or expose your secret keys
- **Use HTTPS:** Essential for all payment processing
- **Set up webhooks:** Ensure you receive payment notifications properly
- **Regular testing:** Test gateways monthly to ensure they still work

### 5. Customer Experience
- **Clear payment terms:** No surprises about when payments are due
- **Multiple options:** Offer at least 2-3 payment methods
- **Mobile optimization:** Ensure payment forms work perfectly on phones
- **Error handling:** Clear messages when payments fail

---

## ⚠️ Common Mistakes to Avoid

1. **Going live without testing:** Can cause lost sales and frustrated customers
2. **Too few payment options:** Limits your customer base
3. **Unclear payment terms:** Leads to disputes and chargebacks
4. **Ignoring mobile users:** 50%+ of bookings happen on phones
5. **Not setting up webhooks:** You won't receive payment notifications
6. **Wrong API keys:** Test vs live keys mixed up
7. **Forgetting to disable test mode:** Customers can't pay with test mode enabled

---

## 🔗 Related Settings

- **Booking Settings:** Configure booking confirmation and payment deadlines
- **Email Settings:** Set up payment confirmation and reminder emails
- **Currency Settings:** Set the currency for all payments
- **Notification Settings:** Configure admin notifications for new payments

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Set up at least one payment gateway
- [ ] Test gateway in test mode with real transactions
- [ ] Configure "Auto-Confirm Pay Later" setting
- [ ] Verify global test mode is enabled during testing

### Recommended (Should Configure)
- [ ] Set up multiple payment gateways (credit cards + PayPal)
- [ ] Configure gateway order (most popular first)
- [ ] Customize gateway titles and descriptions
- [ ] Set up flexible payments if you have expensive trips

### Optional (Consider Later)
- [ ] Enable Pro payment methods (if you have Pro license)
- [ ] Configure Apple Pay and Google Pay
- [ ] Set up bank transfer for international customers
- [ ] Monitor payment conversion rates and optimize

---

## 🚨 Critical Safety Reminders

### Before Going Live
- [ ] Test all payment gateways thoroughly
- [ ] Verify email notifications are working
- [ ] Double-check all API keys are live (not test) keys
- [ ] Ensure HTTPS is working on your site
- [ ] Test the complete booking flow end-to-end
- [ ] Have a plan for handling payment disputes

### After Going Live
- [ ] Monitor first few transactions carefully
- [ ] Check that funds are reaching your account
- [ ] Test refund process if needed
- [ ] Keep test mode disabled unless testing
- [ ] Regular backup of payment settings
