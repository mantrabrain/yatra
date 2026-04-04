# General Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → General

---

## 🏢 Company Information

### Company Name
- **Field Type:** Text Input
- **Required:** Yes ✅
- **Description:** Your travel agency or company name
- **What it does:** This is your business name that appears everywhere customers interact with your travel agency
- **Where it appears:** 
  - Email signatures and booking confirmations
  - Website headers and footers
  - Invoice headers
  - Customer receipts
- **Why it's important:** Establishes your brand identity and builds trust with customers
- **Example:** "Adventure Travel Co.", "Trekking Nepal Tours", "Beach Holiday Adventures"
- **⭐ Pro Tip:** Use the exact name you want customers to remember and search for online

### Company Email
- **Field Type:** Email Input
- **Required:** Yes ✅
- **Description:** Primary contact email address
- **What it does:** This is the main email address for all customer communications
- **Where it's used:**
  - As the "from" address in booking confirmation emails
  - For customer support inquiries
  - Admin notifications about new bookings
- **Why it's important:** This is your primary communication channel with customers
- **Example:** company@example.com, info@adventuretravels.com, support@trekkingnepal.com
- **⚠️ Important:** Use an email you check regularly and that can handle customer volume
- **⭐ Pro Tip:** Create a dedicated email like "bookings@yourcompany.com" for better organization

### Company Phone
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** Primary contact phone number
- **What it does:** Provides customers with a direct way to call your business
- **Where it appears:** Contact pages, booking confirmations, emergency contact information
- **Why it's important:** Some customers prefer phone communication over email
- **Example:** +1-234-567-8900, +44-20-1234-5678, +977-1-23456789
- **⭐ Pro Tip:** Include country code (+1, +44, etc.) for international customers

### Street Address
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** Street address of your company
- **What it does:** Provides your physical business location
- **Where it appears:**
  - Invoices and receipts for legal purposes
  - Contact information pages
  - Google Maps integration (if enabled)
- **Why it's important:** Required for legal compliance and customer trust
- **Example:** 123 Main Street, Suite 456, 789 Tourism Boulevard
- **⭐ Pro Tip:** Even if you work from home, use a professional address or virtual office address

### City
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** City where your company is located
- **What it does:** Completes your business address
- **Where it appears:** Combined with other address fields in contact information
- **Example:** New York, London, Kathmandu, Sydney
- **⭐ Pro Tip:** Use the full city name (e.g., "New York" not "NYC")

### State/Province
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** State or province
- **What it does:** Specifies your state or province within the country
- **Where it appears:** Part of your complete address
- **Example:** California, Ontario, Bavaria, Queensland
- **⭐ Pro Tip:** Use the official state/province name for legal documents

### Country
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** Country where your company is located
- **What it does:** Identifies your business country for legal and tax purposes
- **Where it appears:** Complete address, currency settings, tax calculations
- **Example:** United States, United Kingdom, Nepal, Australia
- **⭐ Pro Tip:** Use full country names for international clarity

### ZIP/Postal Code
- **Field Type:** Text Input
- **Required:** No ❌
- **Description:** ZIP or postal code
- **What it does:** Postal code for mail delivery and location identification
- **Where it appears:** Complete address, shipping calculations (if applicable)
- **Example:** 10001, SW1A 0AA, 44600, 2000
- **⭐ Pro Tip:** Include postal code even if you don't receive mail at this address

### Website URL
- **Field Type:** URL Input
- **Required:** No ❌
- **Description:** Your company website address
- **What it does:** Links customers to your main website
- **Where it appears:** Email footers, booking confirmations, social media profiles
- **Why it's important:** Drives traffic back to your website and builds brand consistency
- **Example:** https://example.com, https://www.adventuretravels.com
- **⭐ Pro Tip:** Always include https:// for proper linking

---

## 🌍 Regional Settings

### Timezone
- **Field Type:** Dropdown Select
- **Required:** Yes ✅
- **Default:** UTC
- **Description:** Select your local timezone
- **What it does:** Sets the time reference for all booking calculations and schedules
- **Why it's critical:** Affects EVERY time-related function in your system
- **Impact areas:**
  - **Booking times:** When customers book, the time is recorded in your timezone
  - **Email scheduling:** Reminder emails are sent based on your timezone
  - **Availability display:** Trip times are shown in your local timezone
  - **Reporting:** All reports use your timezone as reference
- **Available options:**
  - UTC (Coordinated Universal Time - global standard)
  - America/New_York (Eastern US)
  - Europe/London (UK time)
  - Asia/Kathmandu (Nepal time)
  - Asia/Dubai (UAE time)
  - Asia/Kolkata (India time)
- **⚠️ Critical Warning:** If you set this wrong, all your booking times will be incorrect
- **⭐ Pro Tip:** Set this to your physical business location, not your customer location

### Date Format
- **Field Type:** Dropdown Select
- **Required:** Yes ✅
- **Default:** Y-m-d (YYYY-MM-DD)
- **Description:** How dates are displayed throughout the site
- **What it does:** Controls the visual format of dates customers see
- **Where it affects:**
  - Booking confirmation emails
  - Trip schedule displays
  - Availability calendars
  - Invoice dates
  - Customer dashboard
- **Format options explained:**
  - **Y-m-d (2024-03-15):** International standard, clear and unambiguous
  - **m/d/Y (03/15/2024):** US format, common in North America
  - **d/m/Y (15/03/2024):** European format, common outside US
  - **M j, Y (Mar 15, 2024):** User-friendly, easy to read
  - **F j, Y (March 15, 2024):** Full month name, very clear
  - **l, F j, Y (Friday, March 15, 2024):** Most detailed format
- **🎯 Recommendation:** Choose based on your target audience:
  - US customers: m/d/Y format
  - International customers: d/m/Y format
  - Professional documents: F j, Y format
- **⭐ Pro Tip:** Test your chosen format to ensure it's clear for your customers

### Time Format
- **Field Type:** Dropdown Select
- **Required:** Yes ✅
- **Default:** H:i (24 Hour)
- **Description:** 12-hour or 24-hour format for time display
- **What it does:** Controls how times are displayed to customers
- **Where it appears:**
  - Booking confirmation times
  - Trip departure times
  - Meeting point times
  - Email notifications
- **Format options:**
  - **H:i (14:30):** 24-hour format, common internationally
  - **h:i A (2:30 PM):** 12-hour format with AM/PM, common in US
- **🎯 Recommendation:** Match your date format choice:
  - If using US date format (m/d/Y), use 12-hour time (h:i A)
  - If using international date format (d/m/Y), use 24-hour time (H:i)
- **⭐ Pro Tip:** Consistency between date and time formats improves user experience

---

## 🎯 Best Practices for General Settings

### 1. Company Information Setup
- **Complete all fields:** Even optional fields build trust and professionalism
- **Use real information:** Customers expect to be able to contact you
- **Keep it current:** Update phone numbers or addresses if they change
- **Professional presentation:** Use proper capitalization and spelling

### 2. Timezone Configuration
- **Set correctly the first time:** Changing later can confuse existing bookings
- **Consider your team:** Set to where your staff actually works
- **Think about customers:** Your timezone affects when they receive emails
- **Test after setting:** Create a test booking to verify times are correct

### 3. Date/Time Format Selection
- **Know your audience:** US vs international preferences
- **Test readability:** Make sure formats are clear and unambiguous
- **Stay consistent:** Use the same format throughout your communications
- **Consider mobile:** Some formats work better on small screens

### 4. Common Mistakes to Avoid
- **Wrong timezone:** This causes booking time confusion
- **Incomplete contact info:** Customers can't reach you
- **Inconsistent formats:** Confusing date displays
- **Using personal email:** Use business email addresses

---

## 🔗 Related Settings

- **Email Settings:** Uses company email as sender address for all communications
- **Booking Settings:** Uses timezone for booking calculations and reminders
- **Payment Settings:** Uses company information for invoices and receipts
- **Customer Settings:** Company address appears in customer account information

---

## 📋 Quick Setup Checklist

### Essential (Must Do)
- [ ] Set Company Name (required)
- [ ] Set Company Email (required)
- [ ] Set Timezone (required)
- [ ] Choose Date Format (required)
- [ ] Choose Time Format (required)

### Recommended (Should Do)
- [ ] Add Company Phone
- [ ] Add complete Street Address
- [ ] Add City, State, Country
- [ ] Add ZIP/Postal Code
- [ ] Add Website URL

### Optional (Nice to Have)
- [ ] Test booking with current settings
- [ ] Verify email delivery with company email
- [ ] Confirm timezone affects booking times correctly
