# Email Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Email

---

## 📧 Email Configuration

### 📋 Overview
Email settings control how Yatra communicates with both you (the admin) and your customers. Think of this as setting up your automated communication system that handles booking confirmations, payment receipts, and important notifications.

---

## 📮 Email Configuration

### Admin Email
- **Field Type:** Email Input
- **Required:** Yes ✅
- **Description:** Email address to receive admin notifications
- **What it does:** Sets where YOU receive notifications about booking activities
- **When you'll receive emails:**
  - New booking notifications
  - Payment confirmations
  - Cancellation notices
  - Booking modifications
  - System alerts (if enabled)
- **Why it's critical:** This is your primary way to stay informed about booking activity
- **Best practices:**
  - Use an email you check regularly
  - Consider a dedicated email like "bookings@yourcompany.com"
  - Set up email forwarding if needed
- **Example:** admin@adventuretravels.com, bookings@yourcompany.com
- **⚠️ Important:** This email must be valid and accessible - you'll miss important notifications otherwise

### From Email
- **Field Type:** Email Input
- **Required:** Yes ✅
- **Description:** Email address used as sender for customer emails
- **What it does:** Sets the "from" address that customers see in their inbox
- **Where it appears:** All emails sent to customers (confirmations, receipts, reminders)
- **Why it matters:** Affects email deliverability and customer trust
- **Best practices:**
  - Use your domain email (noreply@yourcompany.com)
  - Avoid using free email services (gmail.com, yahoo.com)
  - Ensure this email domain matches your website domain
- **Example:** noreply@adventuretravels.com, info@yourcompany.com
- **⭐ Pro Tip:** Set up SPF/DKIM records for this email to improve deliverability

### From Name
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** Name displayed as sender in customer emails
- **What it does:** Sets the friendly name customers see when they receive emails
- **Where it appears:** "From: [Your Name] <your@email.com>" in customer inboxes
- **Why it matters:** Affects brand recognition and email open rates
- **Good examples:**
  - "Adventure Travel Co."
  - "Trekking Nepal Tours"
  - "Beach Holiday Adventures"
- **Bad examples:**
  - "WordPress" (impersonal)
  - "System" (confusing)
  - "Admin" (too generic)
- **⭐ Pro Tip:** Use your actual business name for consistency and trust

---

## 📧 Email Templates

### 📋 Template Overview
Email templates control which automated emails are sent to customers. Each template serves a specific purpose in the customer journey.

### Booking Confirmation Email
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when booking is confirmed
- **What it does:** Automatically sends confirmation when a booking is made
- **When it's sent:** Immediately after successful booking
- **What it includes:**
  - Booking reference number
  - Trip details (name, dates, price)
  - Payment information
  - Next steps for customer
  - Contact information
- **Why it's essential:** Customers expect immediate confirmation - reduces anxiety and support requests
- **⚠️ Critical:** Never disable this - customers will think their booking failed

### Payment Confirmation Email
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when payment is received
- **What it does:** Notifies customers when their payment is processed
- **When it's sent:** After successful payment completion
- **What it includes:**
  - Payment amount and method
  - Transaction ID
  - Updated booking status
  - Receipt information
- **Why it's important:** Provides proof of payment and financial records
- **⭐ Pro Tip:** Especially important for partial payments and deposits

### Cancellation Email
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send email when booking is cancelled
- **What it does:** Confirms cancellation to both customer and admin
- **When it's sent:** When a booking is cancelled (by customer or admin)
- **What it includes:**
  - Cancellation confirmation
  - Refund information (if applicable)
  - Booking status update
- **Why it's important:** Provides clear record and prevents disputes

### Booking Reminder Email
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Send reminder email before departure
- **What it does:** Sends helpful reminder before the trip
- **When it's sent:** Based on "Booking Reminder Days" setting in Booking Settings
- **What it includes:**
  - Trip date and time reminder
  - Meeting point and instructions
  - What to bring
  - Contact information
  - Weather forecast (if available)
- **Why it's valuable:** Reduces no-shows and improves customer experience
- **⭐ Pro Tip:** 3 days before departure is optimal timing

---

## 🔧 SMTP Settings (Optional but Recommended)

### 📋 What is SMTP?
SMTP (Simple Mail Transfer Protocol) is a more reliable way to send emails than the default WordPress method. Think of it as using a professional email service instead of basic email.

### Enable SMTP
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Use custom SMTP server instead of default WordPress mail
- **What it does:** Routes all Yatra emails through your chosen email service
- **Why consider SMTP:**
  - **Better deliverability:** Emails more likely to reach inboxes (not spam folders)
  - **Professional appearance:** Emails come from your domain, not WordPress
  - **Reliability:** More consistent email delivery
  - **Tracking:** Better delivery reports and analytics
- **When to use SMTP:**
  - You're experiencing email delivery issues
  - You want professional email appearance
  - You need reliable email delivery for business
- **When you might not need it:**
  - Small volume of bookings
  - Current email delivery works fine
  - You don't want technical setup

### SMTP Host
- **Field Type:** Text Input
- **Default:** smtp.gmail.com
- **Description:** SMTP server address
- **What it is:** The address of your email provider's SMTP server
- **Common SMTP hosts:**
  - **Gmail:** smtp.gmail.com
  - **Outlook:** smtp-mail.outlook.com
  - **Yahoo:** smtp.mail.yahoo.com
  - **Business email:** Check with your email provider
- **⭐ Pro Tip:** Use your email provider's recommended SMTP host

### SMTP Port
- **Field Type:** Number Input
- **Default:** 587
- **Description:** SMTP server port (usually 587 or 465)
- **What it does:** Specifies which communication port to use
- **Common ports:**
  - **587:** Standard SMTP with TLS encryption (recommended)
  - **465:** SMTP with SSL encryption (older method)
  - **25:** Unencrypted SMTP (not recommended)
- **⚠️ Important:** Use the port your email provider specifies

### Encryption
- **Field Type:** Dropdown Select
- **Default:** TLS
- **Description:** Connection encryption type
- **Options explained:**
  - **TLS (Transport Layer Security):** Modern, secure encryption (recommended)
  - **SSL (Secure Sockets Layer):** Older encryption method
  - **None:** No encryption (not recommended for security)
- **Why it matters:** Protects email content and login credentials
- **⭐ Pro Tip:** Always use TLS unless your provider specifically requires SSL

### SMTP Username
- **Field Type:** Text Input
- **Description:** Your SMTP account username
- **What it is:** Your email address or specific SMTP username
- **Usually:** Your full email address
- **Example:** yourname@yourcompany.com
- **⚠️ Important:** Must match your SMTP account exactly

### SMTP Password
- **Field Type:** Password Input
- **Description:** Your SMTP account password or app password
- **What it is:** Password for your email account or special app password
- **Security note:** Stored securely in WordPress database
- **⭐ Pro Tip:** Use app passwords for services like Gmail instead of your main password

---

## 🎯 Best Practices for Email Settings

### 1. Email Deliverability
- **Use domain-matched emails:** From email should match your website domain
- **Set up SPF/DKIM:** Ask your email provider about these authentication records
- **Consider SMTP:** If emails aren't reaching customers, switch to SMTP
- **Test deliverability:** Send test emails to different providers (Gmail, Outlook, etc.)

### 2. Professional Communication
- **Use consistent branding:** From name should match your business name
- **Clear subject lines:** Make emails easy to identify
- **Helpful content:** Include all relevant booking information
- **Mobile-friendly:** Ensure emails look good on phones

### 3. Template Strategy
- **Keep all templates enabled:** Each serves an important purpose
- **Customize content:** Add your brand voice and specific information
- **Test all templates:** Ensure they work correctly
- **Monitor performance:** Check if customers are receiving emails

### 4. Security Considerations
- **Use strong passwords:** For SMTP authentication
- **Regular updates:** Keep email credentials current
- **Monitor access:** Watch for unusual email activity
- **Backup settings:** Keep record of email configurations

---

## ⚠️ Common Email Issues and Solutions

### 1. Emails Not Reaching Customers
- **Symptoms:** Customers report not receiving confirmation emails
- **Causes:** 
  - Using default WordPress mail (often blocked)
  - From email doesn't match domain
  - Emails going to spam folders
- **Solutions:**
  - Enable SMTP with proper configuration
  - Use domain-matched email addresses
  - Set up SPF/DKIM records

### 2. Emails Going to Spam
- **Symptoms:** Emails found in spam/junk folders
- **Causes:**
  - Suspicious subject lines
  - Missing authentication records
  - Poor email reputation
- **Solutions:**
  - Use professional subject lines
  - Set up SPF/DKIM
  - Use SMTP service

### 3. Delayed Email Delivery
- **Symptoms:** Emails arrive hours or days late
- **Causes:**
  - Server email queue issues
  - SMTP configuration problems
  - High email volume
- **Solutions:**
  - Check SMTP settings
  - Contact hosting provider
  - Monitor email logs

---

## 🔗 Related Settings

- **Booking Settings:** Controls when reminder emails are sent
- **Payment Settings:** Affects payment confirmation emails
- **Notification Settings:** Controls which admin notifications you receive
- **General Settings:** Company information used in email signatures

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Set Admin Email (where you receive notifications)
- [ ] Set From Email (what customers see)
- [ ] Set From Name (your business name)
- [ ] Enable all email templates

### Recommended (Should Configure)
- [ ] Set up SMTP for better deliverability
- [ ] Test email delivery to different providers
- [ ] Customize email templates with your branding
- [ ] Set up email authentication (SPF/DKIM)

### Optional (Nice to Have)
- [ ] Monitor email deliverability rates
- [ ] Set up email analytics and tracking
- [ ] Create custom email templates
- [ ] Set up email forwarding for admin notifications

---

## 🚨 Critical Email Testing

### Before Going Live
- [ ] Send test booking confirmation email
- [ ] Send test payment confirmation email
- [ ] Test email delivery to Gmail, Outlook, Yahoo
- [ ] Check spam folders for test emails
- [ ] Verify email formatting on mobile devices

### Ongoing Monitoring
- [ ] Check that customers are receiving confirmations
- [ ] Monitor admin notification delivery
- [ ] Test reminder email timing
- [ ] Watch for bounce-back emails
- [ ] Update email settings if problems occur
