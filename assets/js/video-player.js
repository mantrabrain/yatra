/**
 * Yatra Video Player Module
 * Reusable video player for YouTube and other video sources
 * 
 * @package Yatra
 * @version 1.0.0
 */

(function() {
  'use strict';

  class YatraVideoPlayer {
    constructor() {
      this.modal = null;
      this.iframe = null;
      this.currentVideo = null;
      this.init();
    }

    init() {
      this.createModal();
      this.attachEventListeners();
    }

    createModal() {
      // Check if modal already exists
      if (document.getElementById('yatra-video-player-modal')) {
        this.modal = document.getElementById('yatra-video-player-modal');
        this.iframe = document.getElementById('yatra-video-player-iframe');
        return;
      }

      // Create modal HTML
      const modalHTML = `
        <div id="yatra-video-player-modal" class="yatra-video-player-modal" style="display: none;">
          <div class="yatra-video-player-overlay"></div>
          <div class="yatra-video-player-content">
            <button type="button" class="yatra-video-player-close" aria-label="Close Video">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div class="yatra-video-player-wrapper">
              <iframe id="yatra-video-player-iframe" 
                      width="100%" 
                      height="100%" 
                      frameborder="0" 
                      allowfullscreen 
                      allow="autoplay; encrypted-media; picture-in-picture">
              </iframe>
            </div>
          </div>
        </div>
      `;

      // Append to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      this.modal = document.getElementById('yatra-video-player-modal');
      this.iframe = document.getElementById('yatra-video-player-iframe');
    }

    attachEventListeners() {
      // Close button
      const closeBtn = this.modal.querySelector('.yatra-video-player-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click to close
      const overlay = this.modal.querySelector('.yatra-video-player-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.style.display === 'flex') {
          this.close();
        }
      });
    }

    /**
     * Play a video
     * @param {Object} video - Video object with url, embed_url, video_id, title
     */
    play(video) {
      if (!video || !video.url) {
        console.error('YatraVideoPlayer: Invalid video object');
        return;
      }

      
      this.currentVideo = video;
      
      // Determine the embed URL
      let embedUrl = '';
      
      if (video.embed_url) {
        // Use provided embed URL
        embedUrl = video.embed_url;
      } else if (video.video_id) {
        // YouTube video ID provided
        embedUrl = `https://www.youtube.com/embed/${video.video_id}?autoplay=1&rel=0`;
      } else if (video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
        // Extract YouTube video ID from URL
        const videoId = this.extractYoutubeVideoId(video.url);
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
      } else if (video.url.includes('vimeo.com')) {
        // Vimeo video
        const vimeoId = video.url.split('/').pop();
        embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      } else {
        // Direct video URL
        embedUrl = video.url;
      }

      
      
      

      // Add load event handlers for debugging
      this.iframe.onload = () => {
        
      };
      
      this.iframe.onerror = (error) => {
        console.error('YouTube iframe failed to load:', error);
      };
      
      // Set iframe source
      
      this.iframe.src = embedUrl;
      
      // Verify iframe src was set
      setTimeout(() => {
        
        
      }, 100);
      
      // Show modal
      this.open();
    }

    /**
     * Extract YouTube video ID from various URL formats
     * @param {string} url - YouTube URL
     * @returns {string|null} Video ID or null
     */
    extractYoutubeVideoId(url) {
      const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/v\/([^?]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      return null;
    }

    open() {
      
      
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
    }

    close() {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Stop video playback by clearing iframe src
      this.iframe.src = '';
      this.currentVideo = null;
    }
  }

  // Create global instance
  window.YatraVideoPlayer = new YatraVideoPlayer();
  
  // Log successful initialization
  

})();
