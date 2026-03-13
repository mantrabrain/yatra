# Yatra Setup Wizard Implementation

## Overview

This document explains the complete implementation of the Yatra Setup Wizard system that follows the legacy logic you described.

## Core Logic

The setup wizard follows this exact logic:

1. **Default State**: `yatra_setup_wizard_ran` option defaults to `false` (not set)
2. **Force Redirect**: If `yatra_setup_wizard_ran != '1'`, users are forcefully redirected to the setup wizard
3. **Completion**: When setup wizard is completed, `yatra_setup_wizard_ran` is set to `'1'`
4. **Bypass**: Once `yatra_setup_wizard_ran == '1'`, the setup wizard no longer appears

## Implementation Details

### 1. Option Name (Legacy Compatibility)

```php
const WIZARD_COMPLETED_OPTION = 'yatra_setup_wizard_ran';
```

Uses the exact legacy option name for compatibility.

### 2. Force Redirect Logic

Located in `SetupWizardService::forceWizardRedirect()`:

```php
public static function forceWizardRedirect(): void
{
    // Only apply to users who can manage options
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Check if setup wizard is enabled via filter (legacy compatibility)
    if (!apply_filters('yatra_enable_setup_wizard', true)) {
        return;
    }
    
    // Check if wizard has been completed (yatra_setup_wizard_ran != '1')
    if (get_option('yatra_setup_wizard_ran') !== '1') {
        // Don't redirect if we're already on the setup wizard page
        if (isset($_GET['page']) && $_GET['page'] === 'yatra-setup') {
            return;
        }
        
        // Don't redirect on AJAX requests
        if (wp_doing_ajax()) {
            return;
        }
        
        // Force redirect to setup wizard
        wp_safe_redirect(admin_url('tools.php?page=yatra-setup'));
        exit;
    }
}
```

### 3. Wizard Completion

When the wizard is completed in `SetupWizardController::setup_complete()`:

```php
// Mark wizard as completed with value '1' for legacy compatibility
update_option(self::WIZARD_COMPLETED_OPTION, '1');
```

### 4. Check Methods

```php
public static function is_wizard_completed()
{
    return get_option(self::WIZARD_COMPLETED_OPTION, '0') === '1';
}

public static function should_run_wizard()
{
    return get_option(self::WIZARD_COMPLETED_OPTION, '0') !== '1' && 
           apply_filters('yatra_enable_setup_wizard', true) && 
           current_user_can('manage_options');
}
```

## Flow Summary

1. **Plugin Activation**: Sets transient redirect flag if wizard not completed
2. **Admin Init**: Checks `yatra_setup_wizard_ran` option on every admin page load
3. **Redirect**: If option != '1' and user can manage options, force redirect to setup wizard
4. **Completion**: Wizard sets option to '1' when user completes all steps
5. **Normal Operation**: Once option is '1', no more redirects occur

## Filter Support

The implementation supports the legacy filter:

```php
apply_filters('yatra_enable_setup_wizard', true)
```

This allows the wizard to be disabled if needed.

## Security & Edge Cases

- Only users with `manage_options` capability are affected
- AJAX requests are excluded from redirects
- Already on setup wizard page? No redirect loop
- Transient used for activation redirect (30-second window)

## Testing

To test the wizard flow:

```php
// Reset wizard (will trigger on next admin page load)
SetupWizardController::reset_wizard();

// Check if wizard should run
$should_run = SetupWizardController::should_run_wizard();

// Check if wizard is completed
$is_completed = SetupWizardController::is_wizard_completed();
```

## Files Modified

1. `app/Controllers/SetupWizardController.php` - Core wizard logic
2. `app/Services/SetupWizardService.php` - Service layer with force redirect
3. `app/Bootstrap.php` - Activation hook integration

This implementation exactly matches your legacy requirements while being properly integrated into the new Yatra 3.0 architecture.
