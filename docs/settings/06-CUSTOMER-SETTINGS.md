# Customer Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Customer

---

## 👥 Customer Management Overview

Customer settings control how customers interact with your travel business, from account creation to the information you collect. Think of this as setting up your customer relationship management system.

---

## 📝 Customer Registration

### Enable Customer Registration
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Allow customers to create accounts on your website
- **What it does:** Gives customers the option to register for an account
- **When enabled:**
  - Customers see "Create Account" option during booking
  - Customers can register from your website
  - Accounts are stored in WordPress user system
  - Customers can log in to view booking history
- **When disabled:**
  - No registration option shown to customers
  - All bookings are guest bookings
  - No customer accounts created
- **Benefits of enabling:**
  - **Customer loyalty:** Accounts encourage repeat business
  - **Booking history:** Customers can view past and future bookings
  - **Personalized experience:** Saved preferences and information
  - **Marketing opportunities:** Email list building
- **Drawbacks of enabling:**
  - Extra step in booking process (may reduce conversion)
  - Account management overhead
  - Password reset requests
- **⭐ Pro Tip:** Enable for most businesses - benefits usually outweigh the extra step

### Customer Account Page
- **Field Type:** Text Input
- **Default:** /my-account
- **Description:** URL slug for customer account page (e.g., /my-account)
- **What it does:** Sets the web address where customers access their accounts
- **How it works:**
  - Creates a page at yourdomain.com/[slug]
  - Customers can view bookings, update profile, etc.
  - Automatically integrated with WordPress permalinks
- **Examples:**
  - /my-account (standard, easy to remember)
  - /dashboard (professional, clear purpose)
  - /customer-portal (descriptive, formal)
- **Best practices:**
  - Keep it short and memorable
  - Use hyphens, not underscores
  - Make it intuitive for customers
  - Avoid conflicting with existing WordPress pages
- **⭐ Pro Tip:** Test the URL after setting to ensure it works correctly

### Require Email Verification
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Customers must verify their email before account activation
- **What it does:** Adds email verification step to registration process
- **How it works:**
  - Customer registers → receives verification email
  - Customer clicks verification link → account activated
  - Unverified accounts cannot log in or book
- **Benefits:**
  - **Valid email addresses:** Ensures customer emails are real
  - **Reduced fake accounts:** Prevents spam registrations
  - **Better deliverability:** Confirmed emails are more reliable
- **Drawbacks:**
  - Extra step for customers (may reduce registration)
  - More support requests (lost verification emails)
  - Delayed account access
- **When to enable:**
  - You're getting spam/fake registrations
  - Email deliverability is important
  - You want higher quality customer data
- **When to disable:**
  - You want maximum registration conversion
  - You're not experiencing spam issues
  - Simple booking process is priority
- **⭐ Pro Tip:** Start disabled, enable only if you experience spam problems

### Enable Customer Dashboard
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Show dashboard with bookings and account information
- **What it does:** Creates a customer-facing dashboard interface
- **What customers see:**
  - Current and upcoming bookings
  - Booking history
  - Profile information
  - Account settings
  - Payment history (if applicable)
- **Benefits:**
  - **Self-service:** Customers can manage their own bookings
  - **Reduced support:** Fewer requests for booking information
  - **Professional appearance:** Modern customer experience
  - **Customer empowerment:** Gives customers control over their data
- **When to enable:**
  - You want professional customer experience
  - You have repeat customers
  - You want to reduce support workload
- **When to disable:**
  - Very simple business model
  - One-time customers only
  - Limited resources for customer service
- **⭐ Pro Tip:** Keep enabled for most travel businesses - customers expect this functionality

---

## 📋 Customer Fields Configuration

### 📋 Overview
Customer fields determine what information you collect during customer registration. Think of this as designing your customer data collection strategy.

### Available Customer Fields
You can choose to collect any of these fields during registration:

- **Name:** Customer's full name (essential)
- **Email:** Email address (essential, always required)
- **Phone:** Phone number for contact
- **Address:** Street address
- **City:** City of residence
- **Country:** Country of residence
- **Date of Birth:** Customer's birth date

### Field Selection Strategy
- **Essential fields (always collect):** Name, Email
- **Recommended fields (usually collect):** Phone, Country
- **Optional fields (collect if needed):** Address, City, Date of Birth
- **Avoid collecting:** Information you don't actually use

### How to Configure Fields
- **Check the box** to include the field in registration
- **Uncheck the box** to exclude the field
- **Fields appear in order** you select them
- **Required vs Optional:** Some fields are always required (Email), others are optional

### Field-by-Field Breakdown

#### Name
- **Status:** Always included (cannot be disabled)
- **Why essential:** Needed for booking identification and communication
- **Best practice:** Collect First Name and Last Name separately if possible

#### Email
- **Status:** Always required (cannot be disabled)
- **Why essential:** Primary communication channel and login identifier
- **Best practice:** Use email validation to ensure accuracy

#### Phone
- **Status:** Optional (you choose whether to collect)
- **When to collect:** You need to contact customers by phone
- **Benefits:** Urgent communication, booking confirmations
- **Drawbacks:** Some customers prefer email-only communication
- **⭐ Pro Tip:** Collect if you do phone confirmations or have urgent updates

#### Address
- **Status:** Optional (you choose whether to collect)
- **When to collect:** You ship physical items or need location data
- **Benefits:** Complete customer records, marketing segmentation
- **Drawbacks:** More fields = lower registration rates
- **⭐ Pro Tip:** Only collect if you actually use address information

#### City
- **Status:** Optional (you choose whether to collect)
- **When to collect:** You want geographic customer data
- **Benefits:** Location-based marketing, trip preferences
- **Drawbacks:** Additional field to fill out
- **⭐ Pro Tip:** Useful for understanding customer demographics

#### Country
- **Status:** Optional (you choose whether to collect)
- **When to collect:** You have international customers or location-based services
- **Benefits:** Currency preferences, language settings, marketing segmentation
- **Drawbacks:** Extra field for domestic customers
- **⭐ Pro Tip:** Very valuable for international travel businesses

#### Date of Birth
- **Status:** Optional (you choose whether to collect)
- **When to collect:** Age-restricted trips or birthday marketing
- **Benefits:** Age verification, personalized marketing
- **Drawbacks:** Privacy concerns, some customers hesitate to share
- **⚠️ Important:** Only collect if you have legitimate business reason and comply with privacy laws

---

## 🎯 Best Practices for Customer Settings

### 1. Registration Strategy
- **Balance conversion vs. data:** More fields = more data but lower registration rates
- **Start simple:** Begin with essential fields only
- **Add gradually:** Add optional fields as you identify needs
- **Test and measure:** Monitor registration conversion rates

### 2. Customer Experience
- **Make it easy:** Don't ask for information you don't need
- **Be transparent:** Tell customers why you need each piece of information
- **Offer value:** Show benefits of creating an account
- **Mobile-friendly:** Ensure registration works perfectly on phones

### 3. Data Management
- **Privacy compliance:** Follow GDPR, CCPA, and other privacy laws
- **Data security:** Protect customer information properly
- **Data usage:** Only use data for stated purposes
- **Data retention:** Have a policy for how long to keep data

### 4. Account Benefits
- **Clear value proposition:** Why should customers create an account?
- **Useful features:** Booking history, profile management, preferences
- **Exclusive content:** Special offers for account holders
- **Loyalty rewards:** Points or discounts for repeat customers

---

## 📊 Customer Settings Impact

### On Conversion Rates
- **More required fields:** Lower registration rates (each field can reduce by 5-10%)
- **Email verification:** Reduces spam but also reduces legitimate registrations
- **Account requirements:** Can reduce initial bookings but increase repeat business

### On Customer Service
- **Customer accounts:** Reduce support requests for booking information
- **Self-service dashboard:** Customers can manage their own bookings
- **Complete profiles:** Better customer understanding and personalization

### On Marketing
- **Customer data:** Enables targeted marketing campaigns
- **Email lists:** Build permission-based marketing lists
- **Segmentation:** Group customers by location, preferences, behavior

---

## ⚠️ Common Mistakes to Avoid

1. **Too many required fields:** Each additional required field reduces registration significantly
2. **No clear value proposition:** Customers won't register unless they see benefits
3. **Poor mobile experience:** Many customers register on phones
4. **Privacy violations:** Not complying with data protection laws
5. **Unused data:** Collecting information you never actually use
6. **Complicated process:** Making registration too difficult or confusing

---

## 🔗 Related Settings

- **Booking Settings:** Guest checkout vs. required login options
- **Booking Form Settings:** May overlap with customer registration fields
- **Email Settings:** Customer communication and verification emails
- **Notification Settings:** Admin notifications about customer activity

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Decide on customer registration strategy
- [ ] Set Customer Account Page URL
- [ ] Choose which customer fields to collect
- [ ] Configure Customer Dashboard setting

### Recommended (Should Configure)
- [ ] Test registration process end-to-end
- [ ] Set up email templates for customer communications
- [ ] Configure privacy policy and data handling
- [ ] Test customer dashboard functionality

### Optional (Consider Later)
- [ ] Enable email verification (if spam becomes an issue)
- [ ] Add customer loyalty features
- [ ] Set up customer segmentation for marketing
- [ ] Monitor customer registration analytics

---

## 🚨 Privacy and Compliance Considerations

### Data Protection Laws
- **GDPR (Europe):** Requires explicit consent for data collection
- **CCPA (California):** Requires privacy disclosures and rights
- **Other regulations:** Check your local data protection laws

### Best Practices
- **Privacy Policy:** Have a clear, accessible privacy policy
- **Data Minimization:** Only collect data you actually need
- **Consent:** Get explicit consent for marketing communications
- **Data Security:** Protect customer data with proper security measures
- **Data Rights:** Provide ways for customers to view, edit, delete their data

### Customer Rights
- **Access:** Customers should be able to see their data
- **Correction:** Allow customers to update their information
- **Deletion:** Provide option to delete accounts and data
- **Portability:** Allow customers to export their data
