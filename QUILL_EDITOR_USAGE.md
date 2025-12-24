# Quill Editor Sanitization - Usage Guide

## Overview

The Yatra plugin includes comprehensive sanitization functions for Quill rich text editor HTML output. These functions ensure that user-generated content is safe for database storage and display while preserving the formatting capabilities provided by the Quill editor.

## Available Functions

All functions are located in `Yatra\Helpers\FormatHelper` class.

### 1. `FormatHelper::sanitizeQuillHtml($html)`

**Purpose:** Sanitize raw HTML from Quill editor before saving to database.

**When to use:** Always use this function when saving Quill editor content to the database.

**What it does:**
- Removes all unsafe HTML tags and attributes
- Allows only tags that match Quill toolbar configuration
- Ensures links have proper security attributes (noopener, noreferrer)
- Removes empty paragraphs
- Validates text-align styles

**Allowed HTML elements:**
- Headers: `<h1>`, `<h2>`, `<h3>`
- Text formatting: `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`, `<s>`, `<strike>`
- Lists: `<ol>`, `<ul>`, `<li>`
- Paragraphs: `<p>` (with text-align style)
- Links: `<a>` (with href, title, target, rel attributes)
- Line breaks: `<br>`

**Example:**
```php
use Yatra\Helpers\FormatHelper;

// In your controller when saving activity/trip description
$raw_description = $_POST['description'] ?? '';
$sanitized_description = FormatHelper::sanitizeQuillHtml($raw_description);

// Save to database
$activity->description = $sanitized_description;
$activity->save();
```

### 2. `FormatHelper::displayQuillHtml($html)`

**Purpose:** Prepare sanitized HTML for frontend display.

**When to use:** When outputting Quill content on the frontend (templates, single pages, etc.)

**What it does:**
- Applies WordPress content filters
- Processes shortcodes (if any)
- Skips wpautop (since Quill handles paragraphs)

**Example:**
```php
use Yatra\Helpers\FormatHelper;

// In your template file
$description = $activity->description;
$display_html = FormatHelper::displayQuillHtml($description);

echo $display_html;
```

### 3. `FormatHelper::quillToPlainText($html)`

**Purpose:** Convert Quill HTML to plain text (for excerpts, meta descriptions, search indexing).

**When to use:** When you need plain text version without HTML tags.

**What it does:**
- Strips all HTML tags
- Normalizes whitespace
- Returns clean plain text

**Example:**
```php
use Yatra\Helpers\FormatHelper;

// Generate excerpt for listing page
$description = $activity->description;
$excerpt = FormatHelper::quillToPlainText($description);
$excerpt = FormatHelper::truncate($excerpt, 150); // Limit to 150 chars

echo esc_html($excerpt);
```

## Implementation Examples

### Example 1: Activity Form Controller

```php
namespace Yatra\Controllers;

use Yatra\Helpers\FormatHelper;
use Yatra\Services\ActivityService;

class ActivityController
{
    public function store(array $data): array
    {
        // Sanitize Quill HTML content
        if (isset($data['description'])) {
            $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
        }

        // Save to database
        $activity = $this->activityService->create($data);

        return [
            'success' => true,
            'data' => $activity
        ];
    }

    public function update(int $id, array $data): array
    {
        // Sanitize Quill HTML content
        if (isset($data['description'])) {
            $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
        }

        // Update in database
        $activity = $this->activityService->update($id, $data);

        return [
            'success' => true,
            'data' => $activity
        ];
    }
}
```

### Example 2: Trip Form Controller

```php
namespace Yatra\Controllers;

use Yatra\Helpers\FormatHelper;
use Yatra\Services\TripService;

class TripController
{
    public function store(array $data): array
    {
        // Sanitize multiple Quill fields
        $quill_fields = ['description', 'overview', 'included', 'excluded', 'notes'];
        
        foreach ($quill_fields as $field) {
            if (isset($data[$field])) {
                $data[$field] = FormatHelper::sanitizeQuillHtml($data[$field]);
            }
        }

        // Save to database
        $trip = $this->tripService->create($data);

        return [
            'success' => true,
            'data' => $trip
        ];
    }
}
```

### Example 3: Frontend Template Display

```php
<?php
/**
 * Template: single-activity.php
 */

use Yatra\Helpers\FormatHelper;

$activity = get_activity_data(); // Your function to get activity
?>

<div class="activity-content">
    <h1><?php echo esc_html($activity->name); ?></h1>
    
    <!-- Display sanitized HTML content -->
    <div class="activity-description">
        <?php echo FormatHelper::displayQuillHtml($activity->description); ?>
    </div>
</div>
```

### Example 4: Activity Listing with Excerpts

```php
<?php
/**
 * Template: listing-activity.php
 */

use Yatra\Helpers\FormatHelper;

foreach ($activities as $activity) {
    // Get plain text excerpt
    $excerpt = FormatHelper::quillToPlainText($activity->description);
    $excerpt = FormatHelper::truncate($excerpt, 120);
    ?>
    
    <div class="activity-card">
        <h3><?php echo esc_html($activity->name); ?></h3>
        <p class="excerpt"><?php echo esc_html($excerpt); ?></p>
        <a href="<?php echo esc_url($activity->url); ?>">Read More</a>
    </div>
    
    <?php
}
?>
```

### Example 5: REST API Response

```php
namespace Yatra\Controllers\API;

use Yatra\Helpers\FormatHelper;

class ActivityAPIController
{
    public function show(int $id): array
    {
        $activity = $this->activityService->find($id);

        return [
            'id' => $activity->id,
            'name' => $activity->name,
            'description' => $activity->description, // Already sanitized in database
            'description_plain' => FormatHelper::quillToPlainText($activity->description),
            'excerpt' => FormatHelper::truncate(
                FormatHelper::quillToPlainText($activity->description),
                200
            ),
        ];
    }
}
```

## Security Best Practices

1. **Always sanitize on input:** Use `sanitizeQuillHtml()` when saving to database
2. **Never trust user input:** Even if it comes from your own editor
3. **Sanitize once, display many:** Sanitize when saving, not when displaying
4. **Use proper escaping:** When displaying, use `displayQuillHtml()` which applies WordPress filters
5. **Plain text for meta:** Use `quillToPlainText()` for meta descriptions, excerpts, etc.

## Testing Your Implementation

```php
// Test sanitization
$test_html = '<h1>Test</h1><p>Paragraph with <strong>bold</strong> text.</p><script>alert("XSS")</script>';
$sanitized = FormatHelper::sanitizeQuillHtml($test_html);

// Expected output: '<h1>Test</h1><p>Paragraph with <strong>bold</strong> text.</p>'
// The <script> tag is removed for security

echo $sanitized;
```

## Common Pitfalls to Avoid

❌ **Don't do this:**
```php
// Saving without sanitization
$activity->description = $_POST['description'];
$activity->save();
```

✅ **Do this instead:**
```php
// Always sanitize before saving
$activity->description = FormatHelper::sanitizeQuillHtml($_POST['description']);
$activity->save();
```

❌ **Don't do this:**
```php
// Using wp_kses_post directly (too permissive)
$description = wp_kses_post($_POST['description']);
```

✅ **Do this instead:**
```php
// Use our specific Quill sanitizer
$description = FormatHelper::sanitizeQuillHtml($_POST['description']);
```

❌ **Don't do this:**
```php
// Escaping HTML when displaying (will show tags as text)
echo esc_html($activity->description);
```

✅ **Do this instead:**
```php
// Use display function for proper HTML output
echo FormatHelper::displayQuillHtml($activity->description);
```

## Quill Toolbar Configuration

The sanitization function matches this Quill toolbar configuration:

```javascript
// In rich-text-editor.tsx
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],           // h1, h2, h3
    ['bold', 'italic', 'underline', 'strike'],  // Text formatting
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
    [{ 'align': [] }],                          // Text alignment
    ['link'],                                   // Links
    ['clean']                                   // Remove formatting
  ],
};
```

If you modify the Quill toolbar, update the `sanitizeQuillHtml()` function accordingly.

## Summary

- **Input:** Use `FormatHelper::sanitizeQuillHtml()` when saving
- **Output:** Use `FormatHelper::displayQuillHtml()` when displaying
- **Plain Text:** Use `FormatHelper::quillToPlainText()` for excerpts/meta
- **Reusable:** Use these functions everywhere you have Quill editor content
- **Secure:** Prevents XSS attacks and malicious HTML injection
