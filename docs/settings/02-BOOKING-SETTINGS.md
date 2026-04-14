# Booking Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Booking

---

## 📋 Booking Configuration

### Enable Booking Confirmation
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send confirmation emails when bookings are made
- **What it does:** Automatically triggers an email to customers when they complete a booking
- **What happens when enabled:**
  - Customer receives immediate booking confirmation
  - Email includes booking details, trip information, and next steps
  - Booking status changes to "Confirmed" (if auto-confirm is on)
- **What happens when disabled:**
  - No automatic confirmation email is sent
  - Customer may wonder if booking was successful
  - You must manually communicate with customers
- **⚠️ Important:** Disabling this can confuse customers and increase support requests
- **⭐ Pro Tip:** Keep this enabled for better customer experience and reduced support workload

### Auto-Confirm Bookings
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Automatically confirm bookings without manual approval
- **What it does:** Sets booking status to "Confirmed" immediately upon booking
- **When enabled:**
  - Bookings are instantly confirmed
  - No manual review required
  - Faster booking process for customers
  - Good for automated, high-volume operations
- **When disabled:**
  - Bookings start as "Pending" status
  - You must manually review and confirm each booking
  - More control over which bookings are accepted
  - Good for high-value or complex bookings
- **🎯 Use Cases:**
  - **Enable:** Standard tours, day trips, automated systems
  - **Disable:** Custom tours, large group bookings, VIP experiences
- **⭐ Pro Tip:** Start with disabled if you're new, then enable as you become comfortable with the system

### Require Login for Booking
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Customers must create an account to make bookings
- **What it does:** Forces customers to register or log in before booking
- **When enabled:**
  - Customers must create an account first
  - Login required for all bookings
  - Better customer data collection and tracking
  - Customers can view booking history
- **When disabled:**
  - Anyone can book without registration
  - Higher conversion rates (less friction)
  - Less customer data collected
  - Bookings are tied to email only
- **📊 Impact on Conversion:**
  - **Enabled:** 10-30% lower conversion rates
  - **Disabled:** Higher conversion, less customer loyalty
- **⭐ Pro Tip:** Disable initially, then enable if you need better customer management

### Allow Guest Checkout
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Allow customers to book without creating an account
- **What it does:** Gives customers the option to book as a guest
- **When enabled:**
  - Customers see "Book as Guest" option
  - Can complete booking without registration
  - Higher booking completion rates
  - Good for one-time customers
- **When disabled:**
  - All customers must create an account
  - Better customer relationship building
  - Lower initial conversion but higher retention
- **⚠️ Important:** If "Require Login" is enabled, this setting is automatically overridden
- **⭐ Pro Tip:** Keep enabled for most travel businesses to maximize bookings

---

## 🔄 Cancellation & Refund Policy

### Cancellation Policy
- **Field Type:** Dropdown Select
- **Default:** full_refund
- **Description:** What happens when a booking is cancelled
- **What it does:** Sets the default refund behavior for cancellations
- **Options Explained:**
  - **No Refund:** Customer receives no money back when cancelling
    - *Best for:* Last-minute bookings, non-refundable deals
    - *Customer impact:* Highest risk, lowest booking rate
  - **Full Refund:** Customer receives 100% refund (subject to timing rules)
    - *Best for:* Standard bookings, customer-friendly policies
    - *Customer impact:* Lowest risk, highest booking rate
  - **Partial Refund:** Customer receives partial refund based on timing
    - *Best for:* Balanced approach, protects both parties
    - *Customer impact:* Medium risk, moderate booking rate
- **🎯 Recommendation:** Start with "Full Refund" and adjust based on your business needs
- **⭐ Pro Tip:** Your cancellation policy significantly impacts booking conversion rates

### Cancellation Days Before Departure
- **Field Type:** Number Input
- **Default:** 7
- **Description:** Number of days before departure when cancellation is allowed
- **What it does:** Sets the deadline for customers to cancel their bookings
- **How it works:**
  - Setting of 7 days means customers can cancel up to 7 days before trip
  - Cancellations after this period may not be refunded
  - Works with your cancellation policy setting
- **Examples:**
  - **7 days:** Customer can cancel 8+ days before trip, but not 7 days or less before
  - **3 days:** Customer can cancel 4+ days before trip, but not 3 days or less before
  - **0 days:** Customer can cancel anytime (even day before)
- **📊 Business Impact:**
  - **Longer period:** More customer-friendly, but more uncertainty for you
  - **Shorter period:** More predictable for you, but customers may hesitate
- **⭐ Pro Tip:** 7 days is standard for most travel businesses

### Refund Policy
- **Field Type:** Textarea
- **Default:** Empty
- **Description:** Detailed refund policy description shown to customers
- **What it does:** Provides customers with detailed information about your refund terms
- **Where it appears:**
  - During the booking process (before customer books)
  - In booking confirmation emails
  - On customer booking pages
  - In cancellation flow
- **Why it's important:**
  - Legal requirement in many jurisdictions
  - Builds trust with customers
  - Reduces disputes and chargebacks
  - Sets clear expectations
- **Good Example:**
  ```
  Full refund if cancelled 7+ days before departure.
  50% refund if cancelled 3-6 days before departure.
  No refund if cancelled less than 3 days before departure.
  Refunds processed within 5-7 business days.
  ```
- **⭐ Pro Tip:** Be specific, clear, and fair. Ambiguous policies lead to disputes.

---

## ⏰ Booking Expiry & Reminders

### Booking Expiry Hours
- **Field Type:** Number Input
- **Default:** 24
- **Description:** Hours before unpaid bookings expire and are cancelled
- **What it does:** Sets a time limit for customers to complete payment
- **How it works:**
  - Customer makes booking but doesn't pay immediately
  - Booking is held for the specified number of hours
  - If payment isn't completed, booking is automatically cancelled
  - Trip availability is returned to inventory
- **Why it's important:**
  - Prevents customers from "holding" spots indefinitely
  - Ensures fair access to limited spots
  - Reduces no-show situations
- **Common Settings:**
  - **24 hours:** Standard, gives customers time to think and pay
  - **12 hours:** Good for high-demand trips
  - **48 hours:** Good for expensive trips requiring more consideration
- **⚠️ Important:** Must be at least 1 hour (cannot be 0)
- **⭐ Pro Tip:** 24 hours works well for most travel businesses

### Booking Reminder Days
- **Field Type:** Number Input
- **Default:** 3
- **Description:** Send reminder emails this many days before departure
- **What it does:** Automatically sends reminder emails to customers before their trip
- **How it works:**
  - Setting of 3 days means reminder sent 3 days before trip
  - Email includes trip details, meeting points, and important information
  - Helps reduce no-shows and improves customer experience
- **Common Settings:**
  - **3 days:** Standard reminder timing
  - **7 days:** Good for international trips requiring more preparation
  - **1 day:** Good for local day trips
- **What's included in reminders:**
  - Trip date and time
  - Meeting location and instructions
  - What to bring
  - Contact information
- **⭐ Pro Tip:** 3 days is optimal - not too early to forget, not too late to prepare

---

## 📝 Waitlist Settings

### Allow Waitlist
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Allow customers to join waitlist when trip is fully booked
- **What it does:** Gives customers an option when trips are sold out
- **When enabled:**
  - "Join Waitlist" button appears when trip is full
  - Customers can sign up to be notified if spots open up
  - Captures potential customers who might otherwise leave
  - Helps gauge demand for additional dates
- **When disabled:**
  - No waitlist option shown
  - Customers see "Sold Out" with no alternative
  - May lose potential customers permanently
- **📊 Benefits:**
  - Increases customer retention
  - Helps plan additional trip dates
  - Builds customer list for marketing
- **⭐ Pro Tip:** Always keep this enabled - it's free customer acquisition!

### Waitlist Auto-Confirm
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Automatically confirm waitlisted customers when spots become available
- **What it does:** Automatically offers spots to waitlisted customers when they open up
- **When enabled:**
  - First person on waitlist automatically gets the spot
  - Email notification sent automatically
  - Customer has time to confirm and pay
  - Fully automated process
- **When disabled:**
  - Admin gets notified about available spots
  - Admin must manually contact waitlisted customers
  - More control but requires manual work
- **⚠️ Important:** Auto-confirm works on first-come, first-served basis
- **⭐ Pro Tip:** Enable for efficiency, disable if you want to prioritize certain customers

---

## 🎯 Best Practices for Booking Settings

### 1. Booking Confirmation Strategy
- **Always enable confirmation emails:** Essential for customer service
- **Test confirmation emails:** Ensure they look professional and contain all necessary information
- **Monitor delivery:** Check that emails are reaching customers' inboxes

### 2. Auto-Confirm vs Manual Approval
- **Start with manual approval:** Gives you control while learning the system
- **Enable auto-confirm for:** Simple, repeatable tours with low risk
- **Keep manual for:** Custom bookings, large groups, VIP experiences
- **Consider your volume:** Manual approval doesn't scale well

### 3. Guest Checkout Strategy
- **Enable for maximum conversions:** Reduces booking friction
- **Consider your business model:** 
  - One-time customers: Enable guest checkout
  - Repeat customers: Consider requiring accounts
- **Test both ways:** See what works for your specific audience

### 4. Cancellation Policy Design
- **Be customer-friendly:** Flexible policies increase bookings
- **Protect your business:** Consider your costs and risks
- **Be clear and specific:** Avoid ambiguous terms
- **Check local regulations:** Some places have legal requirements

### 5. Timing Settings
- **Booking expiry:** 24 hours balances customer needs with inventory management
- **Reminders:** 3 days before departure is optimal
- **Cancellation deadline:** 7 days is standard and fair

### 6. Waitlist Management
- **Always enable waitlist:** It's free customer acquisition
- **Auto-confirm for efficiency:** Saves time and captures customers quickly
- **Monitor waitlist demand:** Helps plan additional trip dates

---

## ⚠️ Common Mistakes to Avoid

1. **Disabling confirmation emails:** Leads to confused customers and more support work
2. **Setting too short cancellation windows:** Reduces booking conversion significantly
3. **Requiring login for all bookings:** Can reduce conversion by 20-30%
4. **Setting booking expiry too short:** Customers may not have time to complete payment
5. **Not using waitlist:** Losing potential customers permanently
6. **Vague refund policies:** Leads to disputes and chargebacks

---

## 🔗 Related Settings

- **Email Settings:** Configure booking confirmation and reminder email templates
- **Payment Settings:** Set payment deadlines that work with booking expiry
- **Customer Settings:** Manage customer accounts and registration options
- **Notification Settings:** Configure admin notifications for new bookings

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Set Booking Confirmation (keep enabled)
- [ ] Set Cancellation Policy
- [ ] Set Cancellation Days (start with 7)
- [ ] Set Booking Expiry Hours (start with 24)
- [ ] Set Reminder Days (start with 3)

### Recommended (Should Configure)
- [ ] Decide on Auto-Confirm (start disabled)
- [ ] Set Guest Checkout (keep enabled)
- [ ] Write detailed Refund Policy
- [ ] Enable Waitlist (keep enabled)

### Optional (Consider Later)
- [ ] Configure Waitlist Auto-Confirm
- [ ] Require Login for Booking (consider carefully)
- [ ] Test booking flow end-to-end
- [ ] Monitor cancellation rates and adjust policies
