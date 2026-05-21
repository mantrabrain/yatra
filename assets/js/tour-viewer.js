/**
 * Yatra 360° Tour Viewer Module
 * Reusable 360° virtual tour viewer
 * 
 * @package Yatra
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Translation helper. Resolves through wp.i18n.__() when wp-i18n is
  // enqueued (FrontendAssetsProvider registers it as a dependency for
  // this script); falls back to identity so the page never breaks
  // when the i18n runtime is unavailable on older builds.
  //
  // IMPORTANT — call sites MUST pass `'yatra'` as the second arg even
  // though the shim ignores it. `wp i18n make-pot --domain=yatra`
  // filters extraction to calls whose LITERAL second argument is the
  // domain, so a bare `__('x')` is silently dropped from the .pot.
  var __ = (window.wp && window.wp.i18n && window.wp.i18n.__)
    ? function (text, domain) { return window.wp.i18n.__(text, domain || 'yatra'); }
    : function (text) { return text; };

  class YatraTourViewer {
    constructor() {
      this.modal = null;
      this.iframe = null;
      this.currentTour = null;
      this.init();
    }

    init() {
      this.createModal();
      this.attachEventListeners();
    }

    createModal() {
      // Check if modal already exists
      if (document.getElementById('yatra-tour-viewer-modal')) {
        this.modal = document.getElementById('yatra-tour-viewer-modal');
        this.iframe = document.getElementById('yatra-tour-viewer-iframe');
        return;
      }

      // Pre-compute translated labels OUT of the template literal so
      // makepot extracts them reliably. `wp i18n make-pot` doesn't
      // always traverse into `${ }` interpolations; calls at top-
      // level statements are always picked up.
      var closeTourLabel  = __('Close Tour', 'yatra');
      var fullscreenLabel = __('Fullscreen', 'yatra');

      // Create modal HTML
      const modalHTML = `
        <div id="yatra-tour-viewer-modal" class="yatra-tour-viewer-modal" style="display: none;">
          <div class="yatra-tour-viewer-overlay"></div>
          <div class="yatra-tour-viewer-content">
            <button type="button" class="yatra-tour-viewer-close" aria-label="${closeTourLabel}">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div class="yatra-tour-viewer-header">
              <h3 class="yatra-tour-viewer-title"></h3>
              <div class="yatra-tour-viewer-controls">
                <button type="button" class="yatra-tour-viewer-fullscreen" aria-label="${fullscreenLabel}">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="yatra-tour-viewer-wrapper">
              <iframe id="yatra-tour-viewer-iframe" 
                      width="100%" 
                      height="100%" 
                      frameborder="0" 
                      allowfullscreen 
                      allow="gyroscope; accelerometer; xr-spatial-tracking">
              </iframe>
            </div>
          </div>
        </div>
      `;

      // Append to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      this.modal = document.getElementById('yatra-tour-viewer-modal');
      this.iframe = document.getElementById('yatra-tour-viewer-iframe');
    }

    attachEventListeners() {
      // Close button
      const closeBtn = this.modal.querySelector('.yatra-tour-viewer-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click to close
      const overlay = this.modal.querySelector('.yatra-tour-viewer-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // Fullscreen button
      const fullscreenBtn = this.modal.querySelector('.yatra-tour-viewer-fullscreen');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.style.display === 'flex') {
          this.close();
        }
      });
    }

    /**
     * View a 360° tour
     * @param {Object} tour - Tour object with url, title, tour_type
     */
    view(tour) {
      if (!tour || !tour.url) {
        console.error('YatraTourViewer: Invalid tour object');
        return;
      }

      this.currentTour = tour;
      
      // Set title
      const titleElement = this.modal.querySelector('.yatra-tour-viewer-title');
      if (titleElement) {
        titleElement.textContent = tour.title || __('360° Virtual Tour', 'yatra');
      }

      // Set iframe source
      this.iframe.src = tour.url;
      
      // Show modal
      this.open();
    }

    open() {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Stop tour by clearing iframe src
      this.iframe.src = '';
      this.currentTour = null;
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }

    toggleFullscreen() {
      const wrapper = this.modal.querySelector('.yatra-tour-viewer-wrapper');
      
      if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) {
          wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
        } else if (wrapper.msRequestFullscreen) {
          wrapper.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
  }

  // Create global instance
  window.YatraTourViewer = new YatraTourViewer();
  
  // Log successful initialization
  

})();
