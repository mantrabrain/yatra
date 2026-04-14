# Advanced Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Advanced

---

## ⚙️ Advanced Settings Overview

Advanced settings provide technical configuration options for fine-tuning your Yatra booking system. Think of this as the "under the hood" settings that control system behavior, performance, and technical operations.

---

## 🐛 Debug Mode

### Enable Debug Mode
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Enable WordPress debug mode for troubleshooting
- **What it does:** Activates WordPress debugging features
- **When enabled:**
  - PHP errors and warnings displayed on screen
  - Debug information added to page source
  - Database queries shown (if configured)
  - More detailed error messages
- **When you should enable it:**
  - **Troubleshooting problems:** When something isn't working
  - **Development:** When developing customizations
  - **Plugin conflicts:** When diagnosing plugin issues
  - **Performance issues:** When investigating slow loading
- **When you should NOT enable it:**
  - **Live production site:** Customers will see error messages
  - **Public-facing site:** Debug information can reveal system details
  - **Security concerns:** Debug info can be exploited by attackers
- **What you'll see:**
  - PHP error messages and warnings
  - Notices about deprecated functions
  - Debug information in HTML comments
  - Stack traces for errors
- **⚠️ Critical Warning:** Only enable on development sites or when actively troubleshooting
- **⭐ Pro Tip:** Enable temporarily when problems occur, disable immediately after

---

## 🗄️ Database Settings

### Database Cleanup
- **Field Type:** Button/Action
- **Description:** Clean up old and unused data from database
- **What it does:** Removes unnecessary data to optimize database performance
- **Data that gets cleaned:**
  - **Expired sessions:** Old booking session data
  - **Failed bookings:** Incomplete booking attempts
  - **Old logs:** System logs beyond retention period
  - **Temporary data:** Cache and temporary files
- **When to use:**
  - **Performance issues:** When site is running slowly
  - **Database size:** When database becomes large
  - **Maintenance:** Regular cleanup as part of system maintenance
  - **Before backup:** To reduce backup size
- **Benefits:**
  - **Faster performance:** Smaller database runs faster
  - **Reduced storage:** Less disk space used
  - **Better backups:** Smaller, faster backups
  - **System stability:** Removes problematic old data
- **Safety features:**
  - **Confirmation required:** Won't delete without confirmation
  - **Backup reminder:** Reminds to backup before cleanup
  - **Selective cleanup:** Only removes safe-to-delete data
- **⚠️ Important:** Cannot be undone - backup before running cleanup

### Database Optimization
- **Field Type:** Button/Action
- **Description:** Optimize database tables for better performance
- **What it does:** Runs MySQL optimization commands on database tables
- **When to use:**
  - **Slow queries:** When database queries are slow
  - **Performance issues:** General site slowness
  - **Regular maintenance:** As part of routine optimization
  - **After cleanup:** To optimize after removing data
- **What it does technically:**
  - **Defragments tables:** Reorganizes table data storage
  - **Updates statistics:** Improves query planning
  - **Rebuilds indexes:** Optimizes index structures
  - **Frees space:** Reclaims unused space
- **Benefits:**
  - **Faster queries:** Database operations run quicker
  - **Better performance:** Overall site speed improvement
  - **Efficient storage:** Better use of database space
  - **Stability:** Reduces database-related errors
- **⭐ Pro Tip:** Run optimization monthly for best performance

---

## 📊 Performance Settings

### Enable Caching
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Enable system caching for improved performance
- **What it does:** Stores frequently accessed data in memory
- **When enabled:**
  - **Faster page loads:** Cached data loads instantly
  - **Reduced database queries:** Fewer database calls needed
  - **Better user experience:** Site feels more responsive
  - **Lower server load:** Less processing power needed
- **What gets cached:**
  - **Trip data:** Trip information and pricing
  - **Settings:** Configuration data
  - **Templates:** Rendered template fragments
  - **Query results:** Database query results
- **When to disable:**
  - **Development:** When making frequent changes
  - **Troubleshooting:** When debugging caching issues
  - **Memory constraints:** If server has limited memory
- **Cache management:**
  - **Auto-clearing:** Cache clears when content changes
  - **Manual clearing:** Can clear cache manually if needed
  - **Size limits:** Automatic cache size management
  - **Expiration:** Cache expires after set time periods
- **⭐ Pro Tip:** Keep enabled for production sites

### Cache Expiration Time
- **Field Type:** Number Input
- **Default:** 3600 (1 hour)
- **Description:** How long cached data remains valid (in seconds)
- **What it controls:** Cache refresh frequency
- **Common settings:**
  - **300 seconds (5 minutes):** Very fresh data, more server load
  - **1800 seconds (30 minutes):** Good balance for most sites
  - **3600 seconds (1 hour):** Standard setting, good performance
  - **7200 seconds (2 hours):** Better performance, less fresh data
- **When to use different settings:**
  - **Short expiration:** Frequently changing content
  - **Long expiration:** Static content, performance priority
  - **Business hours:** Align with business update patterns
- **Impact considerations:**
  - **Shorter expiration:** More database queries, fresher data
  - **Longer expiration:** Better performance, potentially stale data
- **⭐ Pro Tip:** Use 1 hour for most travel booking sites

---

## 🔐 Security Settings

### Enable Security Headers
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Add security headers to HTTP responses
- **What it does:** Implements security best practices in HTTP headers
- **Security headers included:**
  - **X-Frame-Options:** Prevents clickjacking attacks
  - **X-XSS-Protection:** Enables browser XSS protection
  - **X-Content-Type-Options:** Prevents MIME-type sniffing
  - **Referrer-Policy:** Controls referrer information sharing
- **When enabled:**
  - **Better security:** Protection against common attacks
  - **Browser protection:** Enables built-in browser security features
  - **Data protection:** Better control over data sharing
  - **Compliance:** Helps meet security standards
- **When to disable:**
  - **Compatibility issues:** If headers break functionality
  - **Testing:** When debugging specific issues
  - **Legacy systems:** If old browsers have problems
- **⚠️ Important:** Keep enabled unless you have specific compatibility issues

### Rate Limiting
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Limit request frequency to prevent abuse
- **What it does:** Prevents excessive requests from single sources
- **Protection against:**
  - **Brute force attacks:** Prevents repeated login attempts
  - **DDoS attacks:** Limits overwhelming request volume
  - **Spam submissions:** Reduces automated form submissions
  - **Resource abuse:** Prevents system overuse
- **Rate limits applied:**
  - **Login attempts:** Limited failed login tries
  - **Form submissions:** Limited booking form submissions
  - **API requests:** Limited API call frequency
  - **Page requests:** General request rate limiting
- **When to disable:**
  - **High traffic:** Legitimate high-volume traffic
  - **Testing:** When testing system performance
  - **Special events:** During promotional campaigns
- **⭐ Pro Tip:** Keep enabled for normal operations

---

## 📝 Logging Settings

### Enable System Logging
- **Field Type:** Checkbox
- **Default:** Enabled (true) ✅
- **Description:** Log system events and errors for troubleshooting
- **What it does:** Records important system activities
- **Events logged:**
  - **Booking events:** New bookings, payments, cancellations
  - **System errors:** PHP errors, database issues
  - **User actions:** Login attempts, configuration changes
  - **Performance issues:** Slow queries, memory usage
- **Log storage:**
  - **Database:** Stored in dedicated database tables
  - **File system:** Optional file-based logging
  - **Rotation:** Automatic log file rotation
  - **Retention:** Configurable retention periods
- **When to use:**
  - **Troubleshooting:** When investigating problems
  - **Monitoring:** Regular system health checks
  - **Security:** Tracking suspicious activities
  - **Compliance:** Meeting audit requirements
- **Log access:**
  - **Admin dashboard:** View logs in WordPress admin
  - **File access:** Direct file system access
  - **Export:** Export logs for analysis
  - **Search:** Search logs for specific events
- **⭐ Pro Tip:** Keep logging enabled but implement log rotation

### Log Level
- **Field Type:** Dropdown Select
- **Default:** Error
- **Description:** Minimum severity level for log entries
- **Options:**
  - **Error:** Only log errors and critical issues
  - **Warning:** Log warnings and errors
  - **Info:** Log info, warnings, and errors
  - **Debug:** Log everything including debug information
- **When to use different levels:**
  - **Error:** Production sites, minimize log size
  - **Warning:** Normal operations, important issues
  - **Info:** Development, detailed monitoring
  - **Debug:** Troubleshooting, development environments
- **Impact considerations:**
  - **Higher levels:** More detailed logs, larger log files
  - **Lower levels:** Less detail, smaller log files
  - **Performance:** Very detailed logging can affect performance
- **⭐ Pro Tip:** Use Warning level for most production sites

---

## 🔄 System Maintenance

### Maintenance Mode
- **Field Type:** Checkbox
- **Default:** Disabled (false) ❌
- **Description:** Enable maintenance mode for system updates
- **What it does:** Shows maintenance page to visitors
- **When enabled:**
  - **Maintenance page:** Visitors see friendly maintenance message
  - **Admin access:** Administrators can still access admin area
  - **Booking system:** Temporarily disabled for customers
  - **System updates:** Safe environment for updates
- **When to use:**
  - **Plugin updates:** When updating Yatra or related plugins
  - **WordPress updates:** During WordPress core updates
  - **Major changes:** When making significant system changes
  - **Emergency:** When fixing critical issues
- **Maintenance page customization:**
  - **Message:** Customizable maintenance message
  - **Branding:** Add your logo and branding
  - **Contact info:** Provide alternative contact methods
  - **Return time:** Estimated completion time
- **Safety features:**
  - **Auto-disable:** Automatically disables after set time
  - **Admin bypass:** Administrators can bypass maintenance mode
  - **Warning period:** Advance notice before enabling
- **⚠️ Important:** Only enable when actually performing maintenance

### Backup Settings
- **Field Type:** Button/Action
- **Description:** Create system backup before major changes
- **What it does:** Creates complete backup of Yatra data
- **Backup includes:**
  - **Database tables:** All Yatra database tables
  - **Settings:** Complete configuration settings
  - **Media files:** Trip images and documents
  - **Templates:** Custom template files
- **When to create backups:**
  - **Before updates:** Before plugin or WordPress updates
  - **Before changes:** Before major configuration changes
  - **Regular schedule:** Automated periodic backups
  - **Before migration:** Before moving sites
- **Backup options:**
  - **Location:** Choose backup storage location
  - **Compression:** Compress backup files
  - **Encryption:** Encrypt sensitive data
  - **Scheduling:** Automated backup scheduling
- **⭐ Pro Tip:** Create backup before any major system change

---

## 🎯 Advanced Best Practices

### 1. Performance Optimization
- **Regular maintenance:** Schedule regular system optimization
- **Monitoring:** Monitor system performance metrics
- **Caching strategy:** Balance performance vs. data freshness
- **Resource management:** Monitor server resource usage

### 2. Security Management
- **Regular updates:** Keep system updated and secure
- **Access control:** Limit admin access to trusted users
- **Monitoring:** Watch for suspicious activities
- **Backup security:** Secure backup storage and access

### 3. Troubleshooting
- **Debug mode:** Use only when actively troubleshooting
- **Log analysis:** Regularly review system logs
- **Error tracking:** Track and resolve errors promptly
- **Performance testing:** Test system performance regularly

### 4. Maintenance Planning
- **Scheduled maintenance:** Plan regular maintenance windows
- **Communication:** Notify users about planned maintenance
- **Backup strategy:** Maintain reliable backup system
- **Recovery planning:** Have recovery procedures ready

---

## ⚠️ Common Advanced Issues and Solutions

### 1. Performance Problems
- **Problem:** Site running slowly
- **Causes:** Large database, caching issues, server resources
- **Solutions:** Optimize database, adjust caching, upgrade hosting
- **Prevention:** Regular maintenance and monitoring

### 2. Security Concerns
- **Problem:** Suspicious activities or attacks
- **Causes:** Outdated software, weak security settings
- **Solutions:** Update system, strengthen security settings
- **Prevention:** Regular security audits and updates

### 3. Database Issues
- **Problem:** Database errors or corruption
- **Causes:** Large database, server issues, plugin conflicts
- **Solutions:** Database cleanup, optimization, backup restore
- **Prevention:** Regular database maintenance

### 4. System Errors
- **Problem:** Unexplained system errors
- **Causes:** Plugin conflicts, server issues, code errors
- **Solutions:** Debug mode, log analysis, systematic troubleshooting
- **Prevention:** Regular testing and monitoring

---

## 🔗 Related Settings

- **General Settings:** Basic system configuration
- **Email Settings:** System email configuration
- **Booking Settings:** Core booking system settings
- **Payment Settings:** Payment system configuration

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Review debug mode setting (keep disabled on production)
- [ ] Configure caching settings appropriately
- [ ] Enable security headers
- [ ] Set up system logging

### Recommended (Should Configure)
- [ ] Set up regular database cleanup schedule
- [ ] Configure backup system
- [ ] Monitor system performance
- [ ] Review security settings

### Optional (Consider Later)
- [ ] Set up advanced monitoring
- [ ] Configure automated maintenance
- [ ] Implement advanced security measures
- [ ] Set up performance optimization

---

## 🚨 Critical Advanced Considerations

### Before Making Advanced Changes
- [ ] Create complete system backup
- [ ] Schedule maintenance window
- [ ] Notify users of planned changes
- [ ] Test changes on staging site first

### After Making Advanced Changes
- [ ] Test system functionality thoroughly
- [ ] Monitor system performance
- [ ] Review system logs for issues
- [ ] Verify customer-facing functionality

### Ongoing Advanced Management
- [ ] Regular system maintenance
- [ ] Monitor security and performance
- [ ] Keep system updated
- [ ] Maintain reliable backup system
