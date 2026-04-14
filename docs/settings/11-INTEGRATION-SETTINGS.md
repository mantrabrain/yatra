# Integration Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Integration

---

## 🔗 Integration Overview

Integration settings allow you to connect Yatra with external services and tools to extend functionality and automate workflows. Think of this as connecting your travel booking system to the broader ecosystem of business tools.

---

## 📅 Google Calendar Integration (Pro Feature)

### 🎯 What is Google Calendar Integration?
Google Calendar integration automatically syncs your booking schedules with Google Calendar, giving you a unified view of all your travel activities in one place.

### Enable Google Calendar Integration
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Pro Feature:** Yes - Requires Yatra Pro license
- **Description:** Connect your Google Calendar to sync booking schedules
- **What it does:** Automatically creates calendar events for new bookings
- **When enabled:**
  - New bookings automatically appear in Google Calendar
  - Booking changes sync to calendar
  - Cancellations remove calendar events
  - All trip dates visible in your Google Calendar
- **Benefits:**
  - **Unified scheduling:** See all activities in one calendar
  - **Team coordination:** Share calendar with staff and guides
  - **Mobile access:** Access schedule on any device with Google Calendar
  - **Integration:** Works with other Google Calendar tools
- **When to use:**
  - **Multi-guide operations:** Different guides need schedule access
  - **Team coordination:** Staff need to see booking schedules
  - **Mobile management:** Need schedule access on phones/tablets
  - **Existing Google Calendar users:** Already using Google Calendar for business
- **⚠️ Important:** Requires Google API setup and authentication

### Google Calendar Configuration

#### Google Client ID
- **Field Type:** Text Input
- **Description:** Google API Client ID for authentication
- **What it is:** Unique identifier for your Google API application
- **How to get:**
  1. Go to Google Cloud Console
  2. Create new project or use existing
  3. Enable Google Calendar API
  4. Create OAuth 2.0 credentials
  5. Copy Client ID to this field
- **Why it's needed:** Authenticates your application with Google services
- **⚠️ Important:** Must be valid Google API Client ID

#### Google Client Secret
- **Field Type:** Password Input
- **Description:** Google API Client Secret for authentication
- **What it is:** Secret key that pairs with your Client ID
- **How to get:** Generated with Client ID in Google Cloud Console
- **Security notes:**
  - Treat like a password
  - Never share or expose
  - Keep secure and private
- **Why it's needed:** Completes authentication with Google services
- **⚠️ Critical:** Must match your Client ID and be kept secure

#### Calendar ID
- **Field Type:** Text Input
- **Description:** Google Calendar ID where events will be created
- **What it is:** Unique identifier for specific Google Calendar
- **How to find:**
  1. Open Google Calendar
  2. Go to calendar settings
  3. Find "Calendar ID" in integration section
  4. Copy the ID (usually email format)
- **Examples:**
  - **Primary calendar:** yourname@gmail.com
  - **Custom calendar:** groupcalendar@group.google.com
  - **Business calendar:** calendar@yourdomain.com
- **Why it's important:** Determines which calendar receives booking events
- **⭐ Pro Tip:** Create a dedicated calendar for Yatra bookings

#### Event Details Configuration
- **Field Type:** Textarea
- **Description:** Template for Google Calendar event details
- **What it does:** Controls what information appears in calendar events
- **Default template includes:**
  - Customer name and contact information
  - Trip details and dates
  - Number of travelers
  - Booking reference
  - Special requirements
- **Customization options:**
  - Add your own formatting
  - Include additional booking details
  - Add meeting point information
  - Include guide assignments
- **Template variables:** Use placeholders like {customer_name}, {trip_title}, etc.
- **⭐ Pro Tip:** Include all information guides need for the trip

### Google Calendar Setup Steps

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google Calendar API" from API Library
4. Wait for API to be enabled (usually takes a few minutes)

#### Step 2: Create OAuth Credentials
1. Go to "Credentials" section
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen (if prompted)
4. Select "Web application" as application type
5. Add authorized redirect URI (your WordPress site URL)
6. Create credentials and copy Client ID and Secret

#### Step 3: Configure Calendar
1. Open Google Calendar
2. Create new calendar for Yatra bookings (recommended)
3. Go to calendar settings
4. Find and copy Calendar ID
5. Share calendar with staff members if needed

#### Step 4: Connect in Yatra
1. Enter Google Client ID and Secret in Yatra settings
2. Enter Calendar ID
3. Click "Connect to Google Calendar"
4. Authorize access when prompted
5. Test connection with sample booking

---

## 🔌 Other Integration Options

### Webhook Configuration
- **Field Type:** URL Input
- **Description:** Webhook URL for external service integration
- **What it does:** Sends booking data to external systems
- **When to use:**
  - **CRM integration:** Send booking data to customer relationship management
  - **Accounting systems:** Send financial data to accounting software
  - **Marketing automation:** Trigger marketing workflows
  - **Custom applications:** Send data to your custom systems
- **How it works:**
  - Yatra sends HTTP POST requests to your webhook URL
  - Data includes booking details, customer information, payment status
  - Triggered on booking events (new, updated, cancelled)
- **Webhook data format:** JSON with complete booking information
- **Security considerations:**
  - Use HTTPS URLs for secure transmission
  - Implement authentication in your receiving system
  - Validate incoming webhook data
- **⭐ Pro Tip:** Use webhook for custom integrations beyond standard services

### API Access Configuration
- **Field Type:** Checkbox
- **Description:** Enable API access for third-party integrations
- **What it does:** Allows external applications to access Yatra data via API
- **When to enable:**
  - **Custom applications:** Your own apps need access
  - **Third-party tools:** External services need integration
  - **Mobile apps:** Mobile applications need data access
  - **Partner integrations:** Other businesses need access
- **Security features:**
  - API key authentication required
  - Rate limiting to prevent abuse
  - Permission-based access control
  - Activity logging and monitoring
- **⚠️ Important:** Only enable if you need API access and understand security implications

---

## 🎯 Integration Best Practices

### 1. Security First
- **Protect credentials:** Never share API keys or secrets
- **Use HTTPS:** Always use secure connections
- **Regular updates:** Rotate API keys periodically
- **Monitor access:** Track who has access to your integrations

### 2. Testing and Validation
- **Test thoroughly:** Verify all integrations work correctly
- **Monitor performance:** Check integration reliability
- **Test edge cases:** What happens with errors or timeouts
- **Document setup:** Keep records of integration configurations

### 3. Data Management
- **Sync strategy:** Understand how data flows between systems
- **Conflict resolution:** Know what happens when data conflicts
- **Backup data:** Keep backups of integration data
- **Data quality:** Ensure data is clean and accurate

### 4. Business Continuity
- **Fallback plans:** What happens if integrations fail
- **Manual processes:** Have manual workarounds ready
- **Monitoring:** Set up alerts for integration failures
- **Recovery procedures:** Know how to restore integrations

---

## 📊 Integration Benefits

### For Business Operations
- **Automation:** Reduce manual data entry and processes
- **Accuracy:** Eliminate human errors in data transfer
- **Efficiency:** Streamline workflows between systems
- **Visibility:** Unified view of business data

### For Customer Experience
- **Consistency:** Same information across all systems
- **Speed:** Faster processing and response times
- **Reliability:** More dependable service delivery
- **Communication:** Better coordinated customer service

### For Team Productivity
- **Collaboration:** Shared access to scheduling and data
- **Mobility:** Access information from anywhere
- **Specialization:** Use best tools for specific tasks
- **Coordination:** Better team coordination and communication

---

## ⚠️ Common Integration Issues and Solutions

### 1. Google Calendar Not Syncing
- **Problem:** Bookings not appearing in Google Calendar
- **Causes:** API credentials wrong, calendar ID incorrect, permissions issue
- **Solutions:** Verify credentials, check calendar ID, ensure proper permissions

### 2. Authentication Failures
- **Problem:** Unable to connect to Google services
- **Causes:** Invalid credentials, expired tokens, permission issues
- **Solutions:** Refresh credentials, re-authenticate, check API settings

### 3. Webhook Failures
- **Problem:** Webhook data not reaching destination
- **Causes:** Wrong URL, server issues, authentication problems
- **Solutions:** Verify URL, check server logs, test authentication

### 4. Data Sync Issues
- **Problem:** Data inconsistency between systems
- **Causes:** Timing issues, conflicts, API limitations
- **Solutions:** Implement conflict resolution, sync timing adjustments

---

## 🔗 Related Settings

- **Booking Settings:** Booking data used in integrations
- **Notification Settings:** May trigger integration workflows
- **Email Settings:** Integration may affect email systems
- **Customer Settings:** Customer data used in integrations

---

## 📋 Quick Setup Checklist

### For Google Calendar Integration
- [ ] Create Google Cloud Project
- [ ] Enable Google Calendar API
- [ ] Create OAuth credentials
- [ ] Create dedicated calendar for bookings
- [ ] Configure Yatra with credentials
- [ ] Test integration with sample booking
- [ ] Share calendar with team members

### For Webhook Integration
- [ ] Create webhook endpoint URL
- [ ] Implement authentication in receiving system
- [ ] Test webhook data transmission
- [ ] Monitor webhook delivery and processing
- [ ] Set up error handling and retry logic

### For API Access
- [ ] Determine if API access is needed
- [ ] Generate API keys if required
- [ ] Configure API permissions and limits
- [ ] Document API usage and security
- [ ] Monitor API access and usage

---

## 🚨 Security Considerations

### API Key Management
- **Secure storage:** Store API keys securely
- **Regular rotation:** Change keys periodically
- **Access control:** Limit who has access to keys
- **Monitoring:** Track API key usage and anomalies

### Data Protection
- **Encryption:** Use HTTPS for all data transmission
- **Validation:** Verify all incoming data
- **Privacy:** Protect customer information
- **Compliance:** Follow data protection regulations

### System Security
- **Updates:** Keep integration systems updated
- **Monitoring:** Watch for unusual activity
- **Backups:** Maintain system backups
- **Recovery:** Have disaster recovery plans
