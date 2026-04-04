# Notification Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Notification

---

## 🔔 Notification System Overview

Notification settings control how and when you (the admin) and your customers receive important updates about booking activities. Think of this as setting up your automated communication system that keeps everyone informed.

---

## 📧 Email Notifications

### 📋 Email Notification Overview
Email notifications are automated messages sent for specific booking events. These keep both you and your customers informed about important activities.

### Notify on New Booking
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when new booking is created
- **What it does:** Sends you an email whenever a customer makes a booking
- **When it's sent:** Immediately after successful booking completion
- **What you receive:**
  - Customer information (name, email, phone)
  - Booking details (trip, dates, number of travelers)
  - Payment information (amount, method, status)
  - Booking reference number
  - Customer contact information
- **Why it's essential:**
  - **Immediate awareness:** Know right away when bookings come in
  - **Customer service:** Can follow up quickly if needed
  - **Business monitoring:** Track booking activity in real-time
  - **Planning:** Know about bookings for resource allocation
- **⚠️ Important:** Keep this enabled - you need to know about new bookings

### Notify on Payment
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when payment is received
- **What it does:** Notifies you when customers complete payment
- **When it's sent:** After successful payment processing
- **What you receive:**
  - Payment amount and method
  - Transaction ID and confirmation
  - Updated booking status
  - Customer payment details
- **Why it's important:**
  - **Financial tracking:** Monitor payment activity
  - **Booking confirmation:** Know when payments are completed
  - **Cash flow management:** Track incoming revenue
  - **Issue resolution:** Quick response to payment problems
- **⭐ Pro Tip:** Essential for managing payment-related customer service

### Notify on Cancellation
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when booking is cancelled
- **What it does:** Alerts you when bookings are cancelled
- **When it's sent:** When a customer or admin cancels a booking
- **What you receive:**
  - Cancellation details and reason
  - Refund information (if applicable)
  - Updated booking status
  - Customer contact information
- **Why it's valuable:**
  - **Inventory management:** Know when spots become available
  - **Customer service:** Follow up on cancellations
  - **Business analytics:** Track cancellation rates
  - **Revenue planning:** Adjust for lost bookings
- **⭐ Pro Tip:** Helps you respond quickly to cancellation issues

### Notify Admin on All Events
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Admin receives notifications for all booking events
- **What it does:** Sends you comprehensive notifications for all booking activities
- **Events covered:**
  - New bookings
  - Payment confirmations
  - Cancellations
  - Booking modifications
  - Status changes
  - Expiry notifications
- **Why it's comprehensive:**
  - **Complete awareness:** Know everything happening with bookings
  - **Management oversight:** Full visibility into booking activity
  - **Problem detection:** Quickly identify issues
  - **Business intelligence:** Complete activity tracking
- **When to use:**
  - **Business owners:** Who need complete visibility
  - **Small teams:** Where everyone needs to stay informed
  - **Quality control:** When monitoring all activities
- **⭐ Pro Tip:** Keep enabled for business owners and managers

### Notify Customer on Booking
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send confirmation email to customer
- **What it does:** Sends booking confirmation to the customer
- **When it's sent:** Immediately after successful booking
- **What customer receives:**
  - Booking confirmation and reference number
  - Trip details and schedule
  - Payment information
  - Next steps and contact information
  - What to expect next
- **Why it's critical:**
  - **Customer confidence:** Immediate confirmation reduces anxiety
  - **Professional service:** Shows you're organized and reliable
  - **Support reduction:** Fewer "did my booking go through?" questions
  - **Record keeping:** Customer has their own booking record
- **⚠️ Critical:** Never disable this - customers expect immediate confirmation

### Notify Customer on Payment
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send payment confirmation to customer
- **What it does:** Sends payment receipt to the customer
- **When it's sent:** After successful payment processing
- **What customer receives:**
  - Payment receipt and confirmation
  - Amount paid and method used
  - Transaction ID for records
  - Updated booking status
  - Remaining balance (if partial payment)
- **Why it's important:**
  - **Financial records:** Customer has proof of payment
  - **Peace of mind:** Confirms payment was successful
  - **Professional service:** Complete transaction documentation
  - **Support reduction:** Fewer payment status questions
- **⭐ Pro Tip:** Especially important for partial payments and deposits

---

## 📱 SMS Notifications (Optional)

### Enable SMS Notifications
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Send SMS notifications for bookings and payments
- **What it does:** Adds text message notifications to your communication system
- **When enabled:**
  - SMS notifications sent alongside email notifications
  - Immediate alerts for important events
  - Backup communication channel
  - Mobile-friendly notifications
- **Benefits of SMS:**
  - **Immediate delivery:** SMS often faster than email
  - **High open rates:** 98% of SMS messages are read
  - **Mobile access:** No internet required to receive
  - **Backup channel:** If email fails, SMS still works
- **When to use SMS:**
  - **Urgent notifications:** Critical booking changes
  - **Mobile business:** When you're often away from computer
  - **Backup system:** When email reliability is concern
  - **Customer preference:** Some customers prefer SMS
- **Cost considerations:**
  - SMS providers charge per message
  - Volume pricing available for high usage
  - Consider notification frequency vs. cost
- **⭐ Pro Tip:** Start with email only, add SMS if you need immediate alerts

### SMS Provider
- **Field Type:** Dropdown Select
- **Default:** Twilio
- **Description:** Select your SMS service provider
- **What it does:** Chooses which SMS service to use for sending messages
- **Available options:**
  - **Twilio:** Most popular, reliable, global coverage
  - **Nexmo (Vonage):** Alternative with good features
  - **AWS SNS:** Amazon's service, good for AWS users
- **Provider comparison:**
  - **Twilio:** Best documentation, reliable, slightly higher cost
  - **Nexmo:** Competitive pricing, good features
  - **AWS SNS:** Good for existing AWS users, pay-as-you-go
- **Selection factors:**
  - **Cost:** Compare pricing for your expected volume
  - **Coverage:** Ensure provider covers your customer regions
  - **Features:** Some providers have advanced features
  - **Integration:** Ease of setup with Yatra
- **⭐ Pro Tip:** Twilio is recommended for most businesses due to reliability

### SMS API Key
- **Field Type:** Password Input
- **Description:** API key from your SMS provider
- **What it is:** Authentication key for SMS service
- **How to get:**
  - Sign up with chosen SMS provider
  - Create API credentials in their dashboard
  - Copy API key to this field
- **Security notes:**
  - Treat like password - keep secure
  - Don't share with others
  - Rotate if compromised
- **⚠️ Important:** Must be valid API key from your chosen provider

---

## 🎯 Notification Strategy

### Admin Notification Strategy
- **Essential notifications:** Always enable new booking and payment notifications
- **Comprehensive awareness:** Enable "all events" for business owners
- **Role-based access:** Different notifications for different roles
- **Volume management:** Don't overwhelm with unnecessary notifications

### Customer Notification Strategy
- **Always confirm:** Never disable customer booking confirmations
- **Payment receipts:** Essential for customer trust and records
- **Timing matters:** Send notifications immediately after events
- **Clear information:** Include all relevant details in notifications

### Multi-Channel Strategy
- **Email first:** Email is standard and expected
- **SMS backup:** Add SMS for critical or time-sensitive notifications
- **Cost balance:** Consider SMS costs vs. benefits
- **Customer preference:** Let customers choose when possible

---

## 📊 Notification Impact Analysis

### On Business Operations
- **Response time:** Faster response to customer needs
- **Service quality:** Better customer service through awareness
- **Efficiency:** Automated notifications reduce manual work
- **Management:** Better oversight of business activities

### On Customer Experience
- **Confidence:** Immediate confirmations build trust
- **Communication:** Clear, timely information
- **Professionalism:** Automated, reliable notifications
- **Support:** Fewer questions and concerns

### On Team Productivity
- **Awareness:** Team members stay informed
- **Coordination:** Better teamwork through shared information
- **Efficiency:** Less time checking for updates manually
- **Focus:** Notifications allow focus on important tasks

---

## ⚠️ Common Notification Issues and Solutions

### 1. Not Receiving Notifications
- **Problem:** Admin or customer notifications not arriving
- **Causes:** Wrong email addresses, spam filters, SMTP issues
- **Solutions:** Check email settings, verify addresses, check spam folders

### 2. Delayed Notifications
- **Problem:** Notifications arrive hours or days late
- **Causes:** Server issues, email queue problems, provider delays
- **Solutions:** Check server performance, consider SMS backup

### 3. Too Many Notifications
- **Problem:** Overwhelmed with notification volume
- **Causes:** All events enabled, high booking volume
- **Solutions:** Adjust notification settings, use filters

### 4. SMS Not Working
- **Problem:** SMS notifications not sending
- **Causes:** Wrong API key, provider issues, insufficient credits
- **Solutions:** Verify API credentials, check provider status

---

## 🔗 Related Settings

- **Email Settings:** Configure email delivery and SMTP
- **Booking Settings:** Some notifications triggered by booking events
- **Payment Settings:** Payment notifications linked to payment processing
- **Customer Settings:** Customer contact information for notifications

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Enable all admin notifications (new booking, payment, cancellation)
- [ ] Enable all customer notifications (booking, payment confirmation)
- [ ] Verify admin email address is correct
- [ ] Test notification delivery

### Recommended (Should Configure)
- [ ] Enable "Notify Admin on All Events" for complete awareness
- [ ] Test notification timing and content
- [ ] Set up email filtering for better organization
- [ ] Monitor notification delivery rates

### Optional (Consider Later)
- [ ] Enable SMS notifications for critical alerts
- [ ] Set up SMS provider and API credentials
- [ ] Configure notification preferences by role
- [ ] Set up notification analytics and monitoring

---

## 🚨 Critical Notification Testing

### Before Going Live
- [ ] Test new booking notification (make test booking)
- [ ] Test payment notification (process test payment)
- [ ] Test customer notifications (check customer receives)
- [ ] Verify notification timing and content
- [ ] Check spam folders for test notifications

### Ongoing Monitoring
- [ ] Monitor notification delivery rates
- [ ] Check for notification failures
- [ ] Verify customer feedback on notifications
- [ ] Adjust notification settings based on feedback
- [ ] Keep notification content updated and relevant
