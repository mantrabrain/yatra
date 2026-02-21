# Yatra Media Modules

Reusable video player and 360° tour viewer modules for the Yatra WordPress plugin.

## Overview

These modules provide standalone, reusable components for displaying videos and 360° virtual tours anywhere in your WordPress site.

## Modules

### 1. Video Player Module

**Files:**
- `video-player.js` - JavaScript module
- `video-player.css` - Styling

**Features:**
- YouTube video support with auto-detection
- Vimeo video support
- Direct video URL support
- Responsive modal design
- Keyboard controls (ESC to close)
- Auto-pause on close

**Usage:**

```javascript
// The module creates a global instance: window.YatraVideoPlayer

// Play a YouTube video
YatraVideoPlayer.play({
  url: 'https://www.youtube.com/watch?v=VIDEO_ID',
  title: 'My Video Title',
  video_id: 'VIDEO_ID', // Optional, will be extracted from URL
  embed_url: 'https://www.youtube.com/embed/VIDEO_ID' // Optional
});

// Play a Vimeo video
YatraVideoPlayer.play({
  url: 'https://vimeo.com/123456789',
  title: 'My Vimeo Video'
});

// Close the player
YatraVideoPlayer.close();
```

### 2. 360° Tour Viewer Module

**Files:**
- `tour-viewer.js` - JavaScript module
- `tour-viewer.css` - Styling

**Features:**
- 360° virtual tour support
- Fullscreen mode
- Responsive modal design
- Keyboard controls (ESC to close)
- VR/AR support
- Gyroscope support for mobile

**Usage:**

```javascript
// The module creates a global instance: window.YatraTourViewer

// View a 360° tour
YatraTourViewer.view({
  url: 'https://example.com/360-tour',
  title: '360° Virtual Tour',
  tour_type: '360' // Optional
});

// Close the viewer
YatraTourViewer.close();

// Toggle fullscreen
YatraTourViewer.toggleFullscreen();
```

## Integration

### WordPress Enqueue

Add these modules to your WordPress theme or plugin:

```php
// Enqueue Video Player
wp_enqueue_style('yatra-video-player', plugins_url('assets/css/video-player.css', YATRA_PLUGIN_FILE), [], '1.0.0');
wp_enqueue_script('yatra-video-player', plugins_url('assets/js/video-player.js', YATRA_PLUGIN_FILE), [], '1.0.0', true);

// Enqueue Tour Viewer
wp_enqueue_style('yatra-tour-viewer', plugins_url('assets/css/tour-viewer.css', YATRA_PLUGIN_FILE), [], '1.0.0');
wp_enqueue_script('yatra-tour-viewer', plugins_url('assets/js/tour-viewer.js', YATRA_PLUGIN_FILE), [], '1.0.0', true);
```

### HTML Integration

Simply call the global instances from any JavaScript code:

```html
<button onclick="YatraVideoPlayer.play({url: 'https://youtube.com/watch?v=abc123', title: 'My Video'})">
  Play Video
</button>

<button onclick="YatraTourViewer.view({url: 'https://example.com/tour', title: '360° Tour'})">
  View Tour
</button>
```

### React/JavaScript Integration

```javascript
// In your component or script
document.querySelector('.play-video-btn').addEventListener('click', () => {
  window.YatraVideoPlayer.play({
    url: videoData.url,
    title: videoData.title,
    video_id: videoData.video_id
  });
});

document.querySelector('.view-tour-btn').addEventListener('click', () => {
  window.YatraTourViewer.view({
    url: tourData.url,
    title: tourData.title
  });
});
```

## API Reference

### YatraVideoPlayer

#### Methods

- `play(video)` - Play a video
  - **Parameters:**
    - `video` (Object) - Video object
      - `url` (string, required) - Video URL
      - `title` (string, optional) - Video title
      - `video_id` (string, optional) - YouTube video ID
      - `embed_url` (string, optional) - Embed URL

- `close()` - Close the video player

#### Supported Video Sources

- YouTube (youtube.com, youtu.be)
- Vimeo (vimeo.com)
- Direct video URLs (MP4, WebM, etc.)

### YatraTourViewer

#### Methods

- `view(tour)` - View a 360° tour
  - **Parameters:**
    - `tour` (Object) - Tour object
      - `url` (string, required) - Tour URL
      - `title` (string, optional) - Tour title
      - `tour_type` (string, optional) - Tour type (e.g., '360', 'VR')

- `close()` - Close the tour viewer

- `toggleFullscreen()` - Toggle fullscreen mode

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features

### Video Player
- ✅ Auto-detect YouTube video IDs
- ✅ Support for multiple video platforms
- ✅ Responsive design
- ✅ Keyboard shortcuts
- ✅ Auto-pause on close
- ✅ Loading states
- ✅ Smooth animations

### Tour Viewer
- ✅ 360° panorama support
- ✅ Fullscreen mode
- ✅ VR/AR ready
- ✅ Gyroscope support
- ✅ Responsive design
- ✅ Keyboard shortcuts
- ✅ Loading states
- ✅ Smooth animations

## Customization

Both modules can be customized by modifying their CSS files. Key CSS classes:

### Video Player
- `.yatra-video-player-modal` - Main modal container
- `.yatra-video-player-overlay` - Dark overlay
- `.yatra-video-player-content` - Content wrapper
- `.yatra-video-player-close` - Close button
- `.yatra-video-player-wrapper` - Video wrapper

### Tour Viewer
- `.yatra-tour-viewer-modal` - Main modal container
- `.yatra-tour-viewer-overlay` - Dark overlay
- `.yatra-tour-viewer-content` - Content wrapper
- `.yatra-tour-viewer-close` - Close button
- `.yatra-tour-viewer-header` - Header with title
- `.yatra-tour-viewer-wrapper` - Tour wrapper

## License

Part of the Yatra WordPress Plugin
