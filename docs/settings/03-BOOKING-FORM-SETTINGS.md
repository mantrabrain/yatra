# Booking Form Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Booking Form

---

## 🎯 Overview

The Booking Form Builder is your powerful tool for customizing exactly what information you collect from customers during the booking process. Think of it as building the perfect questionnaire that gets you all the information you need while keeping it simple for customers.

### 📋 What You Can Configure

You have complete control over **three separate forms**:

1. **👤 Contact Form:** Information about the person making the booking
2. **🆘 Emergency Contact Form:** Who to contact in case of emergency during the trip
3. **🧳 Traveler Form:** Details about each person traveling (if different from booker)

---

## 🏗️ Form Builder Interface

### Understanding the Three Form Types

#### 👤 Contact Form
- **Purpose:** Collects primary contact information from the person booking the trip
- **When it's used:** Every single booking goes through this form
- **Default fields you'll see:**
  - Name (who's booking)
  - Email (for confirmations and communication)
  - Phone (for urgent contact)
  - Address (where to send documents)
  - City, Country (location context)
- **Why it's important:** This is your main communication channel with customers
- **Customization level:** Fully customizable - add, remove, or reorder any fields

#### 🆘 Emergency Contact Form
- **Purpose:** Collects emergency contact details for safety during trips
- **When it's used:** Optional - only if you enable this form
- **Default fields you'll see:**
  - Emergency Contact Name (who to call)
  - Emergency Contact Phone (how to reach them)
  - Relationship (who they are to the traveler)
- **Why it's important:** Critical for safety and emergency situations
- **Customization level:** Fully customizable based on your safety requirements
- **⭐ Pro Tip:** Always enable this for any trip involving travel, activities, or overnight stays

#### 🧳 Traveler Form
- **Purpose:** Collects information about each individual person traveling
- **When it's used:** When the booker is different from travelers, or for group bookings
- **Default fields you'll see:**
  - Traveler Name (each person's full name)
  - Email (if different from booker)
  - Phone (if different from booker)
  - Date of Birth (for age verification and insurance)
  - Nationality (for visa and documentation)
  - Passport Number (for international travel)
- **Why it's important:** Essential for travel documentation, insurance, and logistics
- **Customization level:** Highly customizable for different trip types

---

## ⚙️ Form Configuration Options

### Form Title
- **Field Type:** Text Input
- **Description:** Title displayed at the top of the form
- **What it does:** Sets the heading that customers see when they start filling out the form
- **Why it matters:** Helps customers understand what information they're about to provide
- **Good Examples:**
  - Contact Form: "Your Contact Information"
  - Emergency Form: "Emergency Contact Details"
  - Traveler Form: "Traveler Information"
- **⭐ Pro Tip:** Use clear, friendly language that reduces anxiety about filling out forms

### Form Description
- **Field Type:** Textarea
- **Description:** Brief explanation shown below the title
- **What it does:** Provides context and instructions for filling out the form
- **Why it matters:** Can reduce form abandonment by explaining why you need certain information
- **Good Examples:**
  - "We'll use this information to send your booking confirmation and trip details"
  - "Please provide someone we can contact in case of emergency during your trip"
  - "Tell us about each person traveling so we can prepare the perfect experience"
- **⭐ Pro Tip:** Keep it short and focused on the benefit to the customer

### Enable/Disable Form
- **Field Type:** Checkbox
- **Description:** Turn the entire form on or off
- **What it does:** Completely shows or hides the form from customers
- **When to disable:**
  - Emergency Contact Form: For local day trips where emergency contact isn't critical
  - Traveler Form: When booker and travelers are always the same person
  - Contact Form: Never disable - this is essential
- **⚠️ Important:** Disabling forms can simplify the booking process but may leave you without critical information

---

## 📝 Field Configuration Deep Dive

### Available Field Types (Your Building Blocks)

#### 1. **Text Field** 📝
- **Use for:** Short answers like names, cities, states
- **Examples:** First Name, Last Name, City, State
- **Best for:** Single-line responses
- **⭐ Pro Tip:** Use separate text fields for First Name and Last Name instead of one "Name" field

#### 2. **Email Field** 📧
- **Use for:** Email addresses only
- **Built-in validation:** Checks for proper email format
- **Examples:** Email Address, Alternative Email
- **Best for:** Any field that must be a valid email
- **⚠️ Important:** Only use this field type for email addresses

#### 3. **Phone Field** 📱
- **Use for:** Phone numbers
- **Mobile-friendly:** Shows numeric keyboard on mobile devices
- **Examples:** Phone Number, Mobile Phone, Emergency Phone
- **Best for:** Any phone number field
- **⭐ Pro Tip:** Include country code instructions in the field description

#### 4. **Date Field** 📅
- **Use for:** Dates only
- **Calendar popup:** Shows date picker for easy selection
- **Examples:** Date of Birth, Travel Date, Passport Expiry
- **Best for:** Any date information
- **⭐ Pro Tip:** Use this instead of text fields for dates to ensure consistent format

#### 5. **Select Field** 📋
- **Use for:** Multiple choice options where customer selects one
- **Dropdown format:** Clean, space-efficient option list
- **Examples:** Title (Mr/Mrs/Ms), Country, Meal Preference
- **Best for:** Predefined options with clear choices
- **⭐ Pro Tip:** Include "Please select..." as the first option to guide users

#### 6. **Country Field** 🌍
- **Use for:** Country selection only
- **Complete list:** All countries included automatically
- **Examples:** Country, Nationality, Passport Country
- **Best for:** Any country-related field
- **⭐ Pro Tip:** This is better than a select field because it's standardized and complete

#### 7. **Textarea Field** 📄
- **Use for:** Longer responses and notes
- **Multi-line:** Allows for paragraphs of text
- **Examples:** Special Requirements, Medical Conditions, Dietary Restrictions
- **Best for:** Detailed information or comments
- **⭐ Pro Tip:** Use placeholder text to guide customers on what to include

#### 8. **Checkbox Field** ☑️
- **Use for:** Yes/No options or agreements
- **Single option:** Customer checks or leaves unchecked
- **Examples:** I agree to terms, I need airport pickup, Send me marketing emails
- **Best for:** Binary choices or opt-ins
- **⚠️ Important:** Don't use for multiple choice options (use Select instead)

#### 9. **Number Field** 🔢
- **Use for:** Numeric data only
- **Number keyboard:** Shows numeric keypad on mobile
- **Examples:** Age, Number of Travelers, Group Size
- **Best for:** Any field that must be a number
- **⭐ Pro Tip:** Set minimum and maximum values when applicable

---

### Field Settings Explained

#### Field Label
- **What it is:** The text displayed above the input field
- **Why it matters:** Tells customers exactly what information to provide
- **Good examples:** "First Name", "Email Address", "Emergency Contact Phone"
- **Bad examples:** "Name", "Contact", "Info" (too vague)
- **⭐ Pro Tip:** Be specific and clear. "Phone Number" is better than "Phone"

#### Field Placeholder
- **What it is:** Gray text that appears in empty fields
- **Why it matters:** Provides examples and guidance without cluttering the interface
- **Good examples:** 
  - "Enter your first name"
  - "your@email.com"
  - "+1-555-123-4567"
- **⭐ Pro Tip:** Don't repeat the label in the placeholder. Use it to show format examples.

#### Required Field
- **Field Type:** Checkbox
- **What it does:** Makes a field mandatory before form submission
- **When to use:**
  - **Required:** Name, Email, Phone (essential for communication)
  - **Optional:** Address, Special Requirements (nice to have but not essential)
- **Impact:** Customers cannot submit form until required fields are filled
- **⚠️ Important:** Don't make too many fields required - this increases form abandonment
- **📊 Rule of thumb:** Keep required fields to 5 or fewer per form

#### Field Width
- **Options:**
  - **Full (100%):** Takes entire width - good for important fields
  - **Half (50%):** Takes half width - perfect for paired fields
  - **Third (33%):** Takes one-third width - for three-column layouts
- **Best practices:**
  - **Full width:** Email, Address, Comments, any important field
  - **Half width:** First Name + Last Name, City + State, Phone + Email
  - **Third width:** Day + Month + Year (if using separate fields)
- **⭐ Pro Tip:** Use consistent spacing - don't mix full and half width randomly

#### Field Order
- **What it does:** Controls the sequence customers see fields
- **How to change:** Drag and drop fields, or use up/down arrows for precise positioning
- **Best practices:**
  - Start with most important fields (Name, Email)
  - Group related fields together (address fields together)
  - End with optional or less important fields
- **⭐ Pro Tip:** Test your form by filling it out yourself - does the flow feel natural?

#### Locked Fields
- **What they are:** Fields that cannot be deleted or modified
- **Why they exist:** These fields are essential for the booking system to work
- **Locked fields by form:**
  - **Contact Form:** Name, Email (cannot be deleted)
  - **Emergency Contact Form:** Emergency Contact Name, Emergency Contact Phone (cannot be deleted)
  - **Traveler Form:** Traveler Name (cannot be deleted)
- **⚠️ Important:** These are locked for good reason - the system needs this information to function

---

## 🎛️ Field Options (For Select Fields)

### Option Value
- **What it is:** The internal value stored in your database
- **Format:** Typically short codes or abbreviations
- **Examples:** "us", "uk", "ca" for countries; "mr", "mrs", "ms" for titles
- **Why it matters:** Used for data processing and reporting
- **⭐ Pro Tip:** Use simple, consistent codes without spaces or special characters

### Option Label
- **What it is:** The text customers see in the dropdown
- **Format:** Full, descriptive text
- **Examples:** "United States", "United Kingdom", "Canada" for countries
- **Why it matters:** This is what your customers interact with
- **⭐ Pro Tip:** Use clear, familiar names that customers will recognize

---

## 🎯 Best Practices for Form Design

### 1. Keep It Simple and Focused
- **Fewer fields = Higher conversion:** Each additional field reduces completion rates
- **Ask only what you need:** Don't collect information "just in case"
- **Question every field:** "Do I really need this information right now?"
- **📊 Reality check:** Forms with 3-5 fields have 80%+ completion rates, while forms with 10+ fields drop to 40%

### 2. Smart Field Organization
- **Logical grouping:** Put related fields together
- **Visual hierarchy:** Important fields should be more prominent
- **Consistent layout:** Use the same spacing and alignment throughout
- **Mobile-first design:** Ensure forms work perfectly on small screens

### 3. Required vs Optional Strategy
- **Essential only:** Mark only truly critical fields as required
- **Clear indicators:** Use asterisks (*) or "Required" labels
- **Progressive disclosure:** Start with required fields, optional fields later
- **📊 Rule:** Maximum 5 required fields per form

### 4. Label and Placeholder Excellence
- **Clear, simple language:** Avoid jargon and technical terms
- **Action-oriented labels:** "Enter your email" vs "Email"
- **Helpful placeholders:** Show format examples (+1-555-123-4567)
- **Consistent tone:** Match your brand voice

### 5. Mobile Optimization
- **Test on real phones:** Don't just rely on desktop previews
- **Thumb-friendly buttons:** Make checkboxes and dropdowns easy to tap
- **Proper keyboards:** Use tel fields for phones, email fields for emails
- **Avoid zooming:** Ensure form fits screen width without zooming

---

## 📂 Form Sections (Advanced Organization)

### What Are Form Sections?
- **Purpose:** Group related fields into logical categories
- **Visual impact:** Creates visual breaks and improves readability
- **User benefit:** Helps customers understand the form structure

### When to Use Sections
- **Long forms:** 10+ fields benefit from sectioning
- **Complex information:** Different types of data (personal vs travel vs preferences)
- **Multi-step processes:** Sections can guide customers through the process

### Section Examples
- **Personal Information:** Name, Email, Phone
- **Contact Details:** Address, City, Country
- **Travel Preferences:** Meal options, room preferences
- **Emergency Information:** Emergency contact details
- **Special Requirements:** Medical conditions, dietary needs

---

## 🔒 Understanding Locked Fields

### Which Fields Are Locked and Why

#### Contact Form Locked Fields
- **Name:** Essential for identifying who booked
- **Email:** Critical for sending confirmations and communication

#### Emergency Contact Form Locked Fields  
- **Emergency Contact Name:** Needed to know who to contact
- **Emergency Contact Phone:** Needed to know how to reach them

#### Traveler Form Locked Fields
- **Traveler Name:** Essential for travel documentation and bookings

### Why These Fields Can't Be Deleted
- **System requirements:** The booking system needs this data to function
- **Legal requirements:** Some information is required for travel and insurance
- **Safety requirements:** Emergency contact information is critical
- **Communication:** Without email/phone, you can't contact customers

### What You Can Do With Locked Fields
- **Change the label:** Customize how the field is described
- **Add descriptions:** Provide helpful context
- **Adjust width and position:** Control how it appears in the form
- **Set required status:** Most are required by default

---

## 🔗 Related Settings That Affect Your Forms

### Customer Settings
- **Customer registration fields:** May overlap with your booking form fields
- **Account requirements:** Affects whether customers need to register
- **Field synchronization:** Some fields may be pre-filled for registered customers

### Email Settings
- **Form submission notifications:** Configure what you receive when forms are submitted
- **Customer confirmation emails:** Forms data appears in confirmation emails
- **Email templates:** Customize how form data is presented in emails

### Booking Settings
- **Guest checkout:** Affects whether customers see registration forms
- **Required login:** Changes how much information you collect upfront
- **Auto-confirmation:** Affects how form data is processed

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Review Contact Form fields (ensure Name and Email are set up correctly)
- [ ] Decide if you need Emergency Contact Form (enable for most travel)
- [ ] Determine if you need Traveler Form (enable for group bookings)
- [ ] Set required fields appropriately (don't require too many)
- [ ] Test form flow end-to-end

### Recommended (Should Configure)
- [ ] Customize form titles and descriptions for clarity
- [ ] Organize fields in logical order
- [ ] Use appropriate field widths for better layout
- [ ] Add helpful placeholder text
- [ ] Test on mobile devices

### Optional (Nice to Have)
- [ ] Add form sections for long forms
- [ ] Customize field labels to match your brand
- [ ] Add conditional fields (advanced feature)
- [ ] Set up form validation messages
- [ ] Monitor form completion rates and optimize

---

## ⚠️ Common Mistakes to Avoid

1. **Too many required fields:** Each required field reduces conversion by 5-10%
2. **Vague field labels:** "Info" or "Details" doesn't tell customers what to enter
3. **Poor mobile experience:** Forms that don't work well on phones lose 50%+ customers
4. **Inconsistent field types:** Using text fields for emails or phones
5. **No logical organization:** Random field order confuses customers
6. **Missing emergency contact:** Critical for safety and liability
7. **Collecting unnecessary information:** "Nice to have" data isn't worth losing customers over
