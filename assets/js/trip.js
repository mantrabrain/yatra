/**
 * Yatra Single Trip Page JavaScript
 * Class-based implementation for trip page features
 */
/* jshint esversion: 6 */

(function() {
  'use strict';

  /**
   * Convert PHP date format (WordPress/Yatra) to Flatpickr format.
   * Covers the common tokens exposed in Yatra Settings UI.
   *
   * @param {string} php
   * @returns {string}
   */
  const phpDateFormatToFlatpickr = (php) => {
    if (!php || typeof php !== 'string') return 'F j, Y';
    const map = {
      // Day
      d: 'd',
      j: 'j',
      D: 'D',
      l: 'l',
      // Month
      m: 'm',
      n: 'n',
      M: 'M',
      F: 'F',
      // Year
      Y: 'Y',
      y: 'y',
      // Time (for any datetime pickers)
      H: 'H',
      G: 'H',
      h: 'h',
      g: 'h',
      i: 'i',
      s: 'S',
      a: 'K',
      A: 'K'
    };

    let out = '';
    let escaping = false;
    for (let i = 0; i < php.length; i++) {
      const ch = php[i];
      if (escaping) {
        out += ch;
        escaping = false;
        continue;
      }
      if (ch === '\\') {
        escaping = true;
        continue;
      }
      out += map[ch] || ch;
    }
    return out || 'F j, Y';
  };

  const getTripAltDateFormat = () => {
    const cfg = window.yatraTripData || {};
    const php = cfg.dateFormat || cfg.date_format || 'Y-m-d';
    return phpDateFormatToFlatpickr(php);
  };

  const getRestBase = () => {
    const siteUrl =
        (window.yatraTripData && window.yatraTripData.siteUrl) ||
        (window.yatraAdmin && window.yatraAdmin.siteUrl) ||
        window.location.origin ||
        '';
    let base =
        (window.yatraTripData && (window.yatraTripData.apiUrl || window.yatraTripData.restUrl)) ||
        (window.wpApiSettings && window.wpApiSettings.root) ||
        `${siteUrl.replace(/\/$/, '')}/wp-json`;
    base = base.replace(/\/$/, '');
    // Support plain permalinks via rest_route when pretty permalinks are off
    const permalinkStructure =
        (window.yatraTripData && window.yatraTripData.permalinkStructure) ||
        (window.yatraAdmin && window.yatraAdmin.permalinkStructure) ||
        '';
    const isPlain = permalinkStructure === 'plain' || !permalinkStructure;
    return { base, isPlain };
  };

  /**
   * YYYY-MM from a calendar day; server maps to its locale M-Y to match card data-month.
   * @param {string} dateStr YYYY-MM-DD
   */
  const monthFilterKeyFromIsoDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return 'all';
    }
    const m = dateStr.match(/^(\d{4})-(\d{2})-\d{2}/);
    if (!m) {
      return 'all';
    }
    return `${m[1]}-${m[2]}`;
  };

  /**
   * Build public REST URL for trip availability HTML (full section or card fragment).
   * @param {string|number} tripId
   * @param {{date?: string, month_filter?: string, sort?: string, page?: number, per_page?: number, partial?: boolean}} params
   */

  const buildAvailabilityTemplateUrl = (tripId, params = {}) => {
    const { base: baseUrl, isPlain } = getRestBase();
    const q = new URLSearchParams();
    if (params.date) {
      q.set('date', params.date);
    }
    const mf = params.month_filter != null && params.month_filter !== '' ? params.month_filter : 'all';
    q.set('month_filter', mf);
    q.set('sort', params.sort || 'date-asc');
    q.set('page', String(Math.max(1, parseInt(params.page, 10) || 1)));
    q.set('per_page', String(Math.min(50, Math.max(1, parseInt(params.per_page, 10) || 10))));
    if (params.partial) {
      q.set('partial', '1');
    }
    const qs = q.toString();
    if (isPlain && baseUrl.includes('rest_route=')) {
      return `${baseUrl}/trips/${tripId}/availability-template&${qs}`;
    }
    if (baseUrl.includes('/yatra/v1')) {
      return `${baseUrl}/trips/${tripId}/availability-template?${qs}`;
    }
    return `${baseUrl}/yatra/v1/trips/${tripId}/availability-template?${qs}`;
  };

  // Currency formatting helper for trip page (uses localized yatraTripData)
  if (typeof window.yatra_format_price_js !== 'function') {
    window.yatra_format_price_js = function(amount) {
      const cfg = window.yatraTripData || {};
      const symbol = (typeof cfg.currencySymbol === 'string' && cfg.currencySymbol.length)
          ? cfg.currencySymbol
          : (typeof cfg.currency === 'string' ? cfg.currency : '$');

      const position = (
        cfg.currencyPosition ||
        cfg.currency_position ||
        'before'
      ).toString().toLowerCase().trim();
      const decimals = Number.isFinite(Number(cfg.decimalPlaces)) ? Number(cfg.decimalPlaces) : 2;
      const thousandSep = (typeof cfg.thousandSeparator === 'string') ? cfg.thousandSeparator : ',';
      const decimalSep = (typeof cfg.decimalSeparator === 'string') ? cfg.decimalSeparator : '.';

      const num = Number(amount) || 0;

      const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num)
          .replace(/,/g, 'TEMP_THOUSAND')
          .replace(/\./g, 'TEMP_DECIMAL')
          .replace(/TEMP_THOUSAND/g, thousandSep)
          .replace(/TEMP_DECIMAL/g, decimalSep);

      var pos = position;
      if (pos === 'before') {
        pos = 'left_space';
      } else if (pos === 'after') {
        pos = 'right_space';
      }
      if (pos === 'right') {
        return formatted + symbol;
      }
      if (pos === 'right_space') {
        return formatted + ' ' + symbol;
      }
      if (pos === 'left') {
        return symbol + formatted;
      }
      return symbol + ' ' + formatted;
    };
  }

  /**
   * Resolve the real image URL from an <img> element.
   *
   * Caching / performance plugins (LiteSpeed Cache, WP Rocket, W3 Total Cache,
   * Autoptimize, etc.) replace the `src` attribute with a tiny base64
   * placeholder and store the real URL in a data-* attribute.  We check our
   * own `data-yatra-src` first (added in PHP templates and never touched by
   * any third-party plugin), then fall back to the most common lazy-load
   * attribute names, and finally fall back to `img.src` while filtering out
   * obvious placeholders so we never pass a base64 GIF to the modal.
   */
  function getImageSrc(img) {
    // 1. Our own reliable attribute – always present on Yatra gallery images.
    const yatra = img.getAttribute('data-yatra-src');
    if (yatra) return yatra;

    // 2. Common lazy-load attributes used by popular caching plugins.
    const lazyAttrs = [
      'data-src',            // LiteSpeed Cache, WP Rocket, Smush, BJ Lazy Load
      'data-lazyload',       // LiteSpeed Cache (older attribute)
      'data-lazy-src',       // WordPress core lazy-load
      'data-original',       // jQuery.lazyLoad plugin
      'data-pagespeed-lazy-src', // Google PageSpeed / mod_pagespeed
      'data-lazy',           // Jetpack
      'data-full-size',      // Yatra itinerary images
    ];
    for (const attr of lazyAttrs) {
      const val = img.getAttribute(attr);
      if (val && !val.startsWith('data:')) return val;
    }

    // 3. Native src – only use if it is not a placeholder.
    const src = img.src || '';
    if (src && !src.startsWith('data:')) return src;

    return '';
  }

  /**
   * Gallery Modal Class
   * Handles image gallery modal functionality
   */
  class GalleryModal {
    constructor() {
      this.modal = null;
      this.images = [];
      this.currentIndex = 0;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      // Wait for DOM to be ready if needed
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeGallery());
      } else {
        this.initializeGallery();
      }
    }

    initializeGallery() {
      this.modal = document.getElementById('hero-gallery');
      if (!this.modal) {
        console.warn('Hero gallery modal not found');
        return;
      }

      this.collectImages();
      this.createThumbnails();
      this.attachEventListeners();
      this.attachItineraryVideoListeners();
    }

    collectImages() {
      this.images = [];

      // Helper: deduplicate by resolved URL.
      const add = (img, fallbackAlt) => {
        const src = getImageSrc(img);
        if (!src) return;
        if (!this.images.some(i => i.src === src)) {
          this.images.push({ src, alt: img.alt || fallbackAlt });
        }
      };

      // 1. Prefer the JSON media-data blob (never touched by caching plugins).
      const mediaScript = document.getElementById('yatra-hero-media-data');
      if (mediaScript) {
        try {
          const mediaData = JSON.parse(mediaScript.textContent || '{}');
          const imageUrls = Array.isArray(mediaData.images) ? mediaData.images : [];
          imageUrls.forEach((url, index) => {
            if (url && typeof url === 'string' && !this.images.some(i => i.src === url)) {
              this.images.push({ src: url, alt: `Gallery Image ${index + 1}` });
            }
          });
        } catch (e) {
          // JSON parse error – fall through to DOM-based collection.
        }
      }

      // 2. Collect from hero slides (covers any images not in the JSON blob).
      document.querySelectorAll('.yatra-trip-hero-slide img').forEach((img, index) => {
        add(img, `Gallery Image ${index + 1}`);
      });

      // 3. Collect from gallery section (hero gallery only, NOT itinerary).
      document.querySelectorAll('.yatra-trip-gallery .yatra-gallery-item img').forEach((img) => {
        add(img, 'Gallery Image');
      });

      // 4. Collect from hero main image.
      const heroMainImg = document.querySelector('.yatra-hero-main-img');
      if (heroMainImg) add(heroMainImg, 'Main Image');

      // 5. Collect from side images.
      document.querySelectorAll('.yatra-side-image-item img').forEach((img) => {
        add(img, 'Side Image');
      });
    }

    createThumbnails() {
      const container = this.modal.querySelector('.yatra-gallery-thumbnails-container');
      if (!container) return;

      container.innerHTML = '';
      const totalCount = this.modal.querySelector('.yatra-gallery-total-count');
      if (totalCount) {
        totalCount.textContent = this.images.length;
      }

      this.images.forEach((img, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'yatra-gallery-thumbnail';
        thumbnail.setAttribute('data-index', index);
        if (index === 0) thumbnail.classList.add('active');

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = img.src;
        thumbnailImg.alt = img.alt;
        thumbnail.appendChild(thumbnailImg);

        thumbnail.addEventListener('click', () => this.showImage(index));
        container.appendChild(thumbnail);
      });
    }

    showImage(index) {
      if (index < 0 || index >= this.images.length) return;

      this.currentIndex = index;
      const image = this.images[index];
      const modalImage = this.modal.querySelector('.yatra-gallery-modal-image');
      const modalLoader = this.modal.querySelector('.yatra-gallery-modal-loader');
      const currentIndexSpan = this.modal.querySelector('.yatra-gallery-current-index');
      const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
      const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');

      if (currentIndexSpan) {
        currentIndexSpan.textContent = index + 1;
      }

      // Update thumbnails
      const thumbnails = this.modal.querySelectorAll('.yatra-gallery-thumbnail');
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });

      // Show loader
      if (modalLoader) modalLoader.classList.add('active');
      if (modalImage) modalImage.classList.remove('loaded');

      // Load image
      const img = new Image();
      img.onload = () => {
        if (modalImage) {
          modalImage.src = image.src;
          modalImage.alt = image.alt;
          modalImage.classList.add('loaded');
        }
        if (modalLoader) modalLoader.classList.remove('active');
      };
      img.onerror = () => {
        if (modalLoader) modalLoader.classList.remove('active');
        if (modalImage) modalImage.src = image.src;
      };
      img.src = image.src;

      // Update button states
      if (prevBtn) {
        prevBtn.style.opacity = index === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
      }
      if (nextBtn) {
        nextBtn.style.opacity = index === this.images.length - 1 ? '0.5' : '1';
        nextBtn.style.pointerEvents = index === this.images.length - 1 ? 'none' : 'auto';
      }
    }

    open(startIndex = 0) {
      if (this.images.length === 0) return;
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.showImage(startIndex);
    }

    close() {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    next() {
      if (this.currentIndex < this.images.length - 1) {
        this.showImage(this.currentIndex + 1);
      }
    }

    prev() {
      if (this.currentIndex > 0) {
        this.showImage(this.currentIndex - 1);
      }
    }

    attachItineraryVideoListeners() {
      // This method is called from setup() but the actual event listeners
      // are handled in the inline script in content-itinerary.php
      // This is just a placeholder to prevent errors
    }

    attachEventListeners() {
      // Close button
      const closeBtn = this.modal.querySelector('.yatra-gallery-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay
      const overlay = this.modal.querySelector('.yatra-gallery-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // Navigation buttons
      const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
      const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');
      if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
      if (nextBtn) nextBtn.addEventListener('click', () => this.next());

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.modal.classList.contains('active')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });

      // Open from play button
      const playButton = document.querySelector('.yatra-hero-gallery-play');
      const galleryPlayBtn = document.querySelector('.yatra-gallery-play-btn');
      if (playButton) {
        playButton.addEventListener('click', () => this.open(0));
      }
      if (galleryPlayBtn) {
        galleryPlayBtn.addEventListener('click', () => this.open(0));
      }

      // Open from gallery items
      const galleryItems = document.querySelectorAll('.yatra-trip-gallery .yatra-gallery-item');
      galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
          const img = item.querySelector('img');
          if (img) {
            const src = getImageSrc(img);
            const imageIndex = this.images.findIndex(i => i.src === src);
            this.open(imageIndex >= 0 ? imageIndex : index);
          }
        });
      });

      // Open from side images
      const sideImages = document.querySelectorAll('.yatra-side-image-item');
      sideImages.forEach((item) => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.yatra-favorite-btn') || e.target.closest('.yatra-view-all-photos-btn')) {
            return;
          }
          const img = item.querySelector('img');
          if (img) {
            const src = getImageSrc(img);
            const imageIndex = this.images.findIndex(i => i.src === src);
            this.open(imageIndex >= 0 ? imageIndex : 0);
          }
        });
      });

      // Open from main image link
      const mainImageLink = document.querySelector('.yatra-hero-main-img-link');
      if (mainImageLink) {
        mainImageLink.addEventListener('click', (e) => {
          // Check if gallery should be prevented (for non-image media types)
          if (mainImageLink.getAttribute('data-prevent-gallery') === 'true') {
            // Don't prevent default - let the overlay handle the click
            return;
          }
          e.preventDefault();
          this.open(0); // Open with featured image as first image
        });
      }
    }
  }

  /**
   * Itinerary Gallery Modal Class
   * Separate gallery modal for itinerary section - independent from hero gallery
   */
  class ItineraryGalleryModal {
    constructor() {
      this.modal = null;
      this.images = [];
      this.currentIndex = 0;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.modal = document.getElementById('itinerary-gallery');
      if (!this.modal) {
        console.warn('Itinerary gallery modal not found');
        return;
      }

      console.log('Itinerary gallery modal found, collecting images...');
      this.collectImages();
      console.log('Itinerary gallery images collected:', this.images.length);
      this.createThumbnails();
      this.attachEventListeners();
    }

    collectImages() {
      this.images = [];

      const add = (img, fallbackAlt) => {
        const src = img.getAttribute('data-full-size') || getImageSrc(img);
        if (!src) return;
        if (!this.images.some(i => i.src === src)) {
          this.images.push({ src, alt: img.alt || fallbackAlt });
        }
      };

      // Collect from itinerary gallery section (hidden gallery)
      document.querySelectorAll('.yatra-itinerary-trip-gallery .yatra-gallery-item img').forEach((img) => {
        add(img, `Itinerary Image ${this.images.length + 1}`);
      });

      // Collect from visible itinerary gallery items
      document.querySelectorAll('.yatra-entry-gallery .yatra-media-card img').forEach((img) => {
        add(img, `Itinerary Gallery Image ${this.images.length + 1}`);
      });

      // Collect from itinerary video items
      document.querySelectorAll('.yatra-entry-video .yatra-media-card img, .yatra-entry-gallery .yatra-itinerary-video-link img').forEach((img) => {
        add(img, `Itinerary Video Image ${this.images.length + 1}`);
      });
    }

    createThumbnails() {
      const container = this.modal.querySelector('.yatra-gallery-thumbnails-container');
      if (!container) return;

      container.innerHTML = '';
      const totalCount = this.modal.querySelector('.yatra-gallery-total-count');
      if (totalCount) {
        totalCount.textContent = this.images.length;
      }

      this.images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'yatra-gallery-thumbnail';
        thumb.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
        thumb.addEventListener('click', () => this.showImage(index));
        container.appendChild(thumb);
      });
    }

    showImage(index) {
      if (index < 0 || index >= this.images.length) return;

      this.currentIndex = index;
      const image = this.images[index];
      const modalImage = this.modal.querySelector('.yatra-gallery-modal-image');
      const modalLoader = this.modal.querySelector('.yatra-gallery-modal-loader');
      const currentIndexSpan = this.modal.querySelector('.yatra-gallery-current-index');
      const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
      const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');

      if (currentIndexSpan) {
        currentIndexSpan.textContent = index + 1;
      }

      // Show loader
      if (modalLoader) modalLoader.classList.add('active');
      if (modalImage) modalImage.classList.remove('loaded');

      // Load image
      const img = new Image();
      img.onload = () => {
        if (modalImage) {
          modalImage.src = image.src;
          modalImage.alt = image.alt;
          modalImage.classList.add('loaded');
        }
        if (modalLoader) modalLoader.classList.remove('active');
      };
      img.onerror = () => {
        if (modalLoader) modalLoader.classList.remove('active');
        if (modalImage) modalImage.src = image.src;
      };
      img.src = image.src;

      // Update button states
      if (prevBtn) {
        prevBtn.style.opacity = index === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
      }
      if (nextBtn) {
        nextBtn.style.opacity = index === this.images.length - 1 ? '0.5' : '1';
        nextBtn.style.pointerEvents = index === this.images.length - 1 ? 'none' : 'auto';
      }

      // Update thumbnails
      const thumbnails = this.modal.querySelectorAll('.yatra-gallery-thumbnail');
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    }

    open(startIndex = 0) {
      if (this.images.length === 0) return;
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.showImage(startIndex);
    }

    close() {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    next() {
      if (this.currentIndex < this.images.length - 1) {
        this.showImage(this.currentIndex + 1);
      }
    }

    prev() {
      if (this.currentIndex > 0) {
        this.showImage(this.currentIndex - 1);
      }
    }

    attachEventListeners() {
      // Close button
      const closeBtn = this.modal.querySelector('.yatra-gallery-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay
      const overlay = this.modal.querySelector('.yatra-gallery-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // Navigation buttons
      const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
      const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');
      if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
      if (nextBtn) nextBtn.addEventListener('click', () => this.next());

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.modal.classList.contains('active')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });

      // Attach click handlers to itinerary gallery links
      const galleryLinks = document.querySelectorAll('.yatra-itinerary-gallery-link');
      console.log('Attaching listeners to itinerary gallery links:', galleryLinks.length);
      galleryLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const imageIndex = parseInt(link.getAttribute('data-image-index') || '0');
          console.log('Itinerary gallery link clicked, opening at index:', imageIndex);
          this.open(imageIndex);
        });
      });

      // Attach click handlers to itinerary gallery items in hidden section
      const galleryItems = document.querySelectorAll('.yatra-itinerary-trip-gallery .yatra-gallery-item');
      galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
          const img = item.querySelector('img');
          if (img) {
            const src = img.getAttribute('data-full-size') || getImageSrc(img);
            const imageIndex = this.images.findIndex(i => i.src === src);
            this.open(imageIndex >= 0 ? imageIndex : index);
          }
        });
      });
    }
  }

  /**
   * Hero Media Switcher Class
   * Handles media type switching in the hero section
   */
  class HeroMediaSwitcher {
    constructor() {
      this.currentMediaType = 'images';
      this.mediaData = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      // Get media data from JSON script
      const mediaDataScript = document.getElementById('yatra-hero-media-data');
      if (!mediaDataScript) return;

      try {
        this.mediaData = JSON.parse(mediaDataScript.textContent);
      } catch (e) {
        console.error('Error parsing media data:', e);
        return;
      }

      this.attachEventListeners();
    }

    attachEventListeners() {
      // Media switcher buttons
      const switcherBtns = document.querySelectorAll('.yatra-media-switcher-btn');
      switcherBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mediaType = e.currentTarget.dataset.media;
          this.switchMediaType(mediaType);
        });
      });

      // Media badges click
      const mediaBadges = document.querySelectorAll('.yatra-media-badge');
      mediaBadges.forEach(badge => {
        badge.addEventListener('click', (e) => {
          const badgeType = e.currentTarget.classList.contains('yatra-media-badge-image') ? 'images' :
                           e.currentTarget.classList.contains('yatra-media-badge-video') ? 'videos' :
                           e.currentTarget.classList.contains('yatra-media-badge-youtube') ? 'youtube' :
                           e.currentTarget.classList.contains('yatra-media-badge-tour') ? 'tours' : 'documents';
          this.switchMediaType(badgeType);
        });
      });
    }

    switchMediaType(mediaType) {
      if (this.currentMediaType === mediaType) return;
      
      this.currentMediaType = mediaType;
      this.updateSwitcherButtons();
      this.updateMediaBadgesVisibility();
      this.updateMainContent();
      this.updateSideContent();
      this.updateSideImagesVisibility();
    }

    updateSwitcherButtons() {
      const switcherBtns = document.querySelectorAll('.yatra-media-switcher-btn');
      switcherBtns.forEach(btn => {
        if (btn.dataset.media === this.currentMediaType) {
          btn.classList.add('yatra-media-switcher-active');
        } else {
          btn.classList.remove('yatra-media-switcher-active');
        }
      });
    }

    updateMediaBadgesVisibility() {
      const badges = {
        image: document.querySelector('.yatra-media-badge-image'),
        video: document.querySelector('.yatra-media-badge-video'),
        youtube: document.querySelector('.yatra-media-badge-youtube'),
        tour: document.querySelector('.yatra-media-badge-tour'),
        document: document.querySelector('.yatra-media-badge-document')
      };

      // Hide all badges first
      Object.values(badges).forEach(badge => {
        if (badge) badge.style.display = 'none';
      });

      // Show only the active media type badge
      switch (this.currentMediaType) {
        case 'images':
          if (badges.image) badges.image.style.display = 'inline-flex';
          break;
        case 'videos':
          if (badges.video) badges.video.style.display = 'inline-flex';
          break;
        case 'youtube':
          if (badges.youtube) badges.youtube.style.display = 'inline-flex';
          break;
        case 'tours':
          if (badges.tour) badges.tour.style.display = 'inline-flex';
          break;
        case 'documents':
          if (badges.document) badges.document.style.display = 'inline-flex';
          break;
      }
    }

    updateMainContent() {
      const mainImageLink = document.querySelector('.yatra-hero-main-img-link');
      const mainImage = document.querySelector('.yatra-hero-main-img');
      
      if (!mainImage) return;

      switch (this.currentMediaType) {
        case 'videos':
          this.showVideoContent(mainImageLink, mainImage);
          break;
        case 'youtube':
          this.showYoutubeContent(mainImageLink, mainImage);
          break;
        case 'tours':
          this.showTourContent(mainImageLink, mainImage);
          break;
        case 'documents':
          this.showDocumentContent(mainImageLink, mainImage);
          break;
        default: // images
          this.showImageContent(mainImageLink, mainImage);
      }
    }

    showImageContent(link, img) {
      const images = this.mediaData.images || [];
      
      // Remove any existing overlays (YouTube, tour, document, etc.)
      const container = img.parentElement;
      if (container) {
        const existingOverlay = container.querySelector('.yatra-media-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }
      }
      
      if (images.length > 0) {
        img.src = images[0];
        img.alt = 'Trip Image 1';
        if (link) {
          link.href = '#';
          link.dataset.imageIndex = '0';
        }
      }
    }

    showVideoContent(link, img) {
      const videos = this.mediaData.videos || [];
      
      // Remove any existing overlays from other media types
      const container = img.parentElement;
      if (container) {
        const existingOverlay = container.querySelector('.yatra-media-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }
      }
      
      if (videos.length > 0) {
        const video = videos[0];
        // Show video thumbnail
        img.src = video.thumbnail || img.src; // Keep current image if no thumbnail
        img.alt = video.title || 'Trip Video';
        
        // Add play button overlay
        this.addPlayButtonOverlay(img.parentElement);
        
        if (link) {
          link.href = video.url || '#';
          link.dataset.videoUrl = video.url;
          link.dataset.videoTitle = video.title || '';
          
          // Prevent link from opening in new tab
          link.addEventListener('click', (e) => {
            e.preventDefault();
            return false;
          });
        }
      }
    }

    showYoutubeContent(link, img) {
      const youtubeVideos = this.mediaData.youtube_videos || [];
      
      if (youtubeVideos.length > 0) {
        const video = youtubeVideos[0];
        
        // Prevent link from opening in new tab
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            return false;
          });
        }
        
        // Show YouTube thumbnail
        img.src = video.thumbnail || img.src; // Keep current image if no thumbnail
        img.alt = video.title || 'YouTube Video';
        
        // Add YouTube play button overlay
        this.addYoutubePlayButtonOverlay(img.parentElement, video);
        
        if (link) {
          link.href = video.url || '#';
          link.dataset.youtubeUrl = video.url;
          link.dataset.youtubeVideoId = video.video_id || '';
          link.dataset.youtubeTitle = video.title || '';
          link.dataset.embedUrl = video.embed_url || '';
        }
      } else {
        console.warn('No YouTube videos available');
      }
    }

    showTourContent(link, img) {
      const tours = this.mediaData.virtual_tours || [];
      
      if (tours.length > 0) {
        const tour = tours[0];
        
        // Prevent link from opening in new tab
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            return false;
          });
        }
        // Show tour thumbnail or keep current image
        if (tour.thumbnail) {
          img.src = tour.thumbnail;
        }
        img.alt = tour.title || '360° Virtual Tour';
        
        // Add 360° tour overlay
        this.addTourOverlay(img.parentElement, tour);
        
        if (link) {
          link.href = tour.url || '#';
          link.dataset.tourUrl = tour.url;
          link.dataset.tourTitle = tour.title || '';
          link.dataset.tourType = tour.tour_type || '360';
          link.dataset.isEmbeddable = tour.is_embeddable || 'false';
        }
      }
    }

    showDocumentContent(link, img) {
      const documents = this.mediaData.documents || [];
      if (documents.length > 0) {
        const doc = documents[0];
        // Keep current image for document display
        img.alt = doc.title || 'Trip Document';
        
        // Add document icon overlay
        this.addDocumentIconOverlay(img.parentElement, doc);
        
        if (link) {
          link.href = doc.url || '#';
          link.dataset.documentUrl = doc.url;
          link.dataset.documentTitle = doc.title || '';
          link.dataset.downloadable = doc.is_downloadable || 'false';
        }
      }
    }

    addPlayButtonOverlay(container) {
      // Remove existing overlays
      const existingOverlay = container.querySelector('.yatra-media-overlay');
      if (existingOverlay) existingOverlay.remove();

      const overlay = document.createElement('div');
      overlay.className = 'yatra-media-overlay yatra-media-play-overlay';
      overlay.innerHTML = `
        <div class="yatra-play-button">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)"/>
            <path d="M10 8l6 4-6 4V8z" fill="white"/>
          </svg>
        </div>
      `;
      
      // Add click handler to play video using YatraVideoPlayer module
      overlay.addEventListener('click', (e) => {
        // Only handle real user clicks, not programmatic ones
        if (!e.isTrusted) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Get the video data from the current media type
        const videos = this.mediaData.videos || [];
        if (videos.length > 0 && window.YatraVideoPlayer) {
          window.YatraVideoPlayer.play(videos[0]);
        } else {
          console.error('Cannot play video - missing video data or YatraVideoPlayer', {
            hasVideo: videos.length > 0,
            hasPlayer: !!window.YatraVideoPlayer
          });
        }
      }, { capture: false });
      
      container.appendChild(overlay);
    }

    addYoutubePlayButtonOverlay(container, video) {
      // Remove existing overlays
      const existingOverlay = container.querySelector('.yatra-media-overlay');
      if (existingOverlay) existingOverlay.remove();

      const overlay = document.createElement('div');
      overlay.className = 'yatra-media-overlay yatra-media-youtube-overlay';
      overlay.innerHTML = `
        <div class="yatra-youtube-play-button">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill="rgba(255, 0, 0, 0.9)" stroke="white" stroke-width="3"/>
            <path d="M40 30 L70 50 L40 70 Z" fill="white"/>
          </svg>
        </div>
      `;
      
      // Add click handler to open YouTube video using YatraVideoPlayer module
      overlay.addEventListener('click', (e) => {
        // Only handle real user clicks, not programmatic ones
        if (!e.isTrusted) {
          
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        
        
        if (video.url && window.YatraVideoPlayer) {
          
          window.YatraVideoPlayer.play(video);
        } else {
          console.error('Cannot play video - missing url or YatraVideoPlayer', {
            hasUrl: !!video.url,
            hasPlayer: !!window.YatraVideoPlayer
          });
        }
      }, { capture: false });
      
      container.appendChild(overlay);
    }

    addTourOverlay(container, tour) {
      // Remove existing overlays
      const existingOverlay = container.querySelector('.yatra-media-overlay');
      if (existingOverlay) existingOverlay.remove();

      const overlay = document.createElement('div');
      overlay.className = 'yatra-media-overlay yatra-media-tour-overlay';
      overlay.innerHTML = `
        <div class="yatra-tour-info">
          <div class="yatra-tour-icon">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" fill="rgba(16, 185, 129, 0.9)" stroke="white" stroke-width="3"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
              <circle cx="50" cy="50" r="25" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
              <path d="M 50 5 Q 75 50 50 95" stroke="white" stroke-width="2" fill="none" opacity="0.4"/>
              <path d="M 50 5 Q 25 50 50 95" stroke="white" stroke-width="2" fill="none" opacity="0.4"/>
              <line x1="5" y1="50" x2="95" y2="50" stroke="white" stroke-width="2" opacity="0.4"/>
              <text x="50" y="58" text-anchor="middle" fill="white" font-size="24" font-weight="bold">360°</text>
            </svg>
          </div>
          <div class="yatra-tour-details">
            <div class="yatra-tour-title">${tour.title || '360° Virtual Tour'}</div>
            <div class="yatra-tour-type">${tour.tour_type || '360°'} Experience</div>
            <div class="yatra-tour-action">Click to explore</div>
          </div>
        </div>
      `;
      
      // Add click handler to open virtual tour using YatraTourViewer module
      overlay.addEventListener('click', (e) => {
        // Only handle real user clicks, not programmatic ones
        if (!e.isTrusted) {
          
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        
        
        if (tour.url && window.YatraTourViewer) {
          
          window.YatraTourViewer.view(tour);
        } else {
          console.error('Cannot view tour - missing url or YatraTourViewer', {
            hasUrl: !!tour.url,
            hasViewer: !!window.YatraTourViewer
          });
        }
      }, { capture: false });
      
      container.appendChild(overlay);
    }

    addDocumentIconOverlay(container, doc) {
      // Remove existing overlays
      const existingOverlay = container.querySelector('.yatra-media-overlay');
      if (existingOverlay) existingOverlay.remove();

      const overlay = document.createElement('div');
      overlay.className = 'yatra-media-overlay yatra-media-document-overlay';
      overlay.innerHTML = `
        <div class="yatra-document-info">
          <div class="yatra-document-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="rgba(255,255,255,0.9)"/>
              <path d="M14 2v6h6" fill="rgba(255,255,255,0.7)"/>
              <path d="M16 13H8" stroke="#374151" stroke-width="2"/>
              <path d="M16 17H8" stroke="#374151" stroke-width="2"/>
            </svg>
          </div>
          <div class="yatra-document-details">
            <div class="yatra-document-title">${doc.title || 'Document'}</div>
            <div class="yatra-document-size">${this.formatFileSize(doc.file_size || 0)}</div>
          </div>
        </div>
      `;
      container.appendChild(overlay);
    }

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateSideContent() {
      const sideImages = document.querySelectorAll('.yatra-side-image-item');
      
      switch (this.currentMediaType) {
        case 'videos':
          this.updateSideVideos(sideImages);
          break;
        case 'youtube':
          this.updateSideYoutubeVideos(sideImages);
          break;
        case 'tours':
          this.updateSideTours(sideImages);
          break;
        case 'documents':
          this.updateSideDocuments(sideImages);
          break;
        default: // images
          this.updateSideImages(sideImages);
      }
    }

    updateSideImages(sideImages) {
      const images = this.mediaData.images || [];
      sideImages.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img && images[index + 1]) {
          img.src = images[index + 1];
          img.alt = `Trip Image ${index + 2}`;
        }
      });
    }

    updateSideVideos(sideImages) {
      const videos = this.mediaData.videos || [];
      sideImages.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img && videos[index + 1]) {
          const video = videos[index + 1];
          if (video.thumbnail) {
            img.src = video.thumbnail;
          }
          img.alt = video.title || 'Trip Video';
        }
      });
    }

    updateSideYoutubeVideos(sideImages) {
      const youtubeVideos = this.mediaData.youtube_videos || [];
      sideImages.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img && youtubeVideos[index + 1]) {
          const video = youtubeVideos[index + 1];
          if (video.thumbnail) {
            img.src = video.thumbnail;
          }
          img.alt = video.title || 'YouTube Video';
        }
      });
    }

    updateSideTours(sideImages) {
      const virtualTours = this.mediaData.virtual_tours || [];
      sideImages.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img && virtualTours[index + 1]) {
          const tour = virtualTours[index + 1];
          if (tour.thumbnail) {
            img.src = tour.thumbnail;
          }
          img.alt = tour.title || '360° Virtual Tour';
        }
      });
    }

    updateSideDocuments(sideImages) {
      const documents = this.mediaData.documents || [];
      sideImages.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img && documents[index + 1]) {
          const doc = documents[index + 1];
          // Keep existing image for documents
          img.alt = doc.title || 'Trip Document';
        }
      });
    }

    updateSideImagesVisibility() {
      const sideImagesContainer = document.querySelector('.yatra-hero-side-images');
      const heroImagesContainer = document.querySelector('.yatra-hero-images');
      const mainImageLink = document.querySelector('.yatra-hero-main-img-link');
      
      if (!sideImagesContainer) return;

      // Hide side images for non-image media types and make main image full width
      if (this.currentMediaType === 'images') {
        sideImagesContainer.classList.remove('yatra-media-non-image');
        if (heroImagesContainer) {
          heroImagesContainer.classList.remove('yatra-media-full-width');
        }
        // Re-enable gallery click for images
        if (mainImageLink) {
          mainImageLink.removeAttribute('data-prevent-gallery');
        }
      } else {
        sideImagesContainer.classList.add('yatra-media-non-image');
        if (heroImagesContainer) {
          heroImagesContainer.classList.add('yatra-media-full-width');
        }
        // Mark to prevent gallery opening for non-image media
        if (mainImageLink) {
          mainImageLink.setAttribute('data-prevent-gallery', 'true');
        }
      }
    }
  }

  /**
   * Booking Sidebar Class
   * Handles booking form interactions (Check Availability & Make Enquiry buttons)
   * Also handles date picker and travelers selector for main booking form
   */
  class BookingSidebar {
    constructor() {
      this.checkAvailabilityBtn = null;
      this.makeEnquiryBtn = null;
      this.heroBookNowBtn = null;
      this.dateInput = null;
      this.participantsSelect = null;
      this.datepickerInstance = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.checkAvailabilityBtn = document.getElementById('check-availability-btn');
      this.makeEnquiryBtn = document.getElementById('open-enquiry-modal');
      this.heroBookNowBtn = document.getElementById('yatra-hero-book-now-btn');
      this.dateInput = document.getElementById('travel_date');
      this.participantsSelect = document.querySelector('.yatra-participants-select');

      if (!this.checkAvailabilityBtn) {
        console.warn('Check Availability button not found');
      }

      this.attachEventListeners();
      this.initDateField();
      this.initTravelersField();
    }

    attachEventListeners() {
      // Check Availability button
      if (this.checkAvailabilityBtn) {
        this.checkAvailabilityBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleCheckAvailability();
        });
      }

      // Hero "Book Now" (should behave like Check Availability)
      if (this.heroBookNowBtn) {
        this.heroBookNowBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const disabled =
              this.heroBookNowBtn.classList.contains('is-disabled') ||
              this.heroBookNowBtn.getAttribute('aria-disabled') === 'true';
          if (disabled) return;

          const bookingSidebar = document.getElementById('booking') || document.querySelector('.yatra-trip-sidebar');
          if (bookingSidebar && bookingSidebar.scrollIntoView) {
            bookingSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // Trigger the same availability flow
          if (this.checkAvailabilityBtn) {
            this.handleCheckAvailability();
          }
        });
      }

      // Make Enquiry button
      if (this.makeEnquiryBtn) {
        this.makeEnquiryBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleMakeEnquiry();
        });
      }
    }

    initDateField() {
      if (!this.dateInput || typeof flatpickr === 'undefined') return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Format today's date as Y-m-d
      const todayStr = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');

      // Set today's date as default value
      this.dateInput.value = todayStr;
      
      // Enable button since we have a default date
      if (this.checkAvailabilityBtn) {
        this.checkAvailabilityBtn.disabled = false;
        this.checkAvailabilityBtn.classList.remove('disabled');
      }

      // Destroy existing instance if any
      if (this.dateInput._flatpickr) {
        this.dateInput._flatpickr.destroy();
      }

      const altFormat = getTripAltDateFormat();

      this.datepickerInstance = flatpickr(this.dateInput, {
        // Keep backend value stable (Y-m-d), only change display
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat,
        minDate: today,
        defaultDate: today,
        enableTime: false,
        clickOpens: true,
        allowInput: false,
        static: false,
        monthSelectorType: 'static',
        animate: true,
        locale: {
          firstDayOfWeek: 1
        },
        onChange: (selectedDates, dateStr) => {
          this.dateInput.value = dateStr;

          // Enable Check Availability button when date is selected
          if (this.checkAvailabilityBtn && dateStr) {
            this.checkAvailabilityBtn.disabled = false;
            this.checkAvailabilityBtn.classList.remove('disabled');
          }
        }
      });

      // Make container clickable
      const container = this.dateInput.closest('.yatra-booking-field-select');
      if (container) {
        container.style.cursor = 'pointer';
        const openPicker = (e) => {
          // Do not interfere with other actionable controls in the same row
          if (e && e.target && e.target.closest && e.target.closest('button, a, select, textarea')) {
            return;
          }
          // Prevent container clicks from triggering other toggles
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (this.datepickerInstance && !this.datepickerInstance.isOpen) {
            this.datepickerInstance.open();
          }
        };

        // Container click (icon/arrow/background)
        container.addEventListener('click', openPicker);

        // Flatpickr altInput is the visible field when altInput:true
        if (this.dateInput && this.dateInput._flatpickr && this.dateInput._flatpickr.altInput) {
          this.dateInput._flatpickr.altInput.addEventListener('click', openPicker);
        }
      }
    }

    initInlineQuantityControls() {
      // Handle inline quantity controls for simple booking (num_travelers)
      const inlineControls = document.querySelectorAll('.yatra-quantity-controls-inline');

      inlineControls.forEach(controlsContainer => {
        const input = controlsContainer.querySelector('.yatra-quantity-input-simple');
        if (!input) return;

        const minusBtn = controlsContainer.querySelector('.yatra-quantity-minus');
        const plusBtn = controlsContainer.querySelector('.yatra-quantity-plus');

        if (!minusBtn || !plusBtn) return;

        const updateButtonStates = () => {
          const current = parseInt(input.value) || 1;
          const min = parseInt(input.getAttribute('min')) || 1;
          const max = parseInt(input.getAttribute('max')) || 20;

          minusBtn.disabled = current <= min;
          plusBtn.disabled = current >= max;
        };

        // Minus button click
        minusBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const current = parseInt(input.value) || 1;
          const min = parseInt(input.getAttribute('min')) || 1;

          if (current > min) {
            input.value = current - 1;
            updateButtonStates();
            this.updateTotalDisplay();
          }
        });

        // Plus button click
        plusBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const current = parseInt(input.value) || 1;
          const max = parseInt(input.getAttribute('max')) || 20;

          if (current < max) {
            input.value = current + 1;
            updateButtonStates();
            this.updateTotalDisplay();
          }
        });

        // Initialize button states
        updateButtonStates();
      });
    }

    updateTotalDisplay() {
      // Update total price display based on current travelers count
      const numTravelersInput = document.getElementById('num_travelers');
      const totalAmountEl = document.getElementById('total-amount');
      const displayPriceEl = document.getElementById('display-price');

      if (!numTravelersInput) return;

      const travelers = parseInt(numTravelersInput.value) || 1;
      const pricePerPerson = parseFloat(numTravelersInput.getAttribute('data-price')) || 0;
      const totalPrice = travelers * pricePerPerson;

      // Update total display if exists
      if (totalAmountEl && typeof yatra_format_price_js === 'function') {
        totalAmountEl.textContent = yatra_format_price_js(totalPrice);
      }
    }

    initTravelersField() {
      // First, initialize inline quantity controls for num_travelers (simple booking)
      this.initInlineQuantityControls();

      // Initialize all dropdown travelers fields (there may be multiple instances)
      const participantsSelects = document.querySelectorAll('.yatra-participants-select');

      participantsSelects.forEach((participantsSelect) => {
        this.initSingleTravelersField(participantsSelect);
      });
    }

    initSingleTravelersField(participantsSelect) {
      if (!participantsSelect) return;

      // Find display and selector within this specific participants select container
      const display = participantsSelect.querySelector('.yatra-participants-display');
      const selector = participantsSelect.querySelector('.yatra-booking-quantity-selector');

      if (!display || !selector) return;

      // Get all traveler category inputs dynamically
      const travelerInputs = selector.querySelectorAll('input[id^="traveler_"], input[id^="mobile_traveler_"]');

      if (travelerInputs.length === 0) return;

      // Make display clickable
      display.style.cursor = 'pointer';

      // Toggle dropdown
      participantsSelect.onclick = (e) => {
        if (e.target.closest('.yatra-quantity-btn')) return;
        if (selector.contains(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        participantsSelect.classList.toggle('active');
      };

      // Update display function - dynamically build text from all traveler inputs
      const updateDisplay = () => {
        const parts = [];
        travelerInputs.forEach((input) => {
          const value = parseInt(input.value || 0);
          if (value > 0) {
            const categoryLabel = input.getAttribute('data-category-label') || 'Traveler';
            parts.push(`${categoryLabel} x ${value}`);
          }
        });

        if (parts.length === 0) {
          // Default to first category with value 1
          const firstInput = travelerInputs[0];
          if (firstInput) {
            const categoryLabel = firstInput.getAttribute('data-category-label') || 'Traveler';
            display.textContent = `${categoryLabel} x 1`;
          } else {
            display.textContent = '1 Traveler';
          }
        } else {
          display.textContent = parts.join(', ');
        }
      };

      // Quantity button handlers
      selector.onclick = (e) => {
        const btn = e.target.closest('.yatra-quantity-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const targetId = btn.getAttribute('data-target');
        let input = null;
        if (targetId) {
          try {
            input = selector.querySelector('#' + CSS.escape(targetId));
          } catch (_) {
            // ignore
          }
          if (!input) {
            input = document.getElementById(targetId);
          }
        }
        if (!input) return;

        const current = parseInt(input.value || 0);
        const min = parseInt(input.getAttribute('min') || 0);
        const max = parseInt(input.getAttribute('max') || 999);
        const isPlus = btn.classList.contains('yatra-quantity-plus');
        const isMinus = btn.classList.contains('yatra-quantity-minus');

        let newValue = current;
        if (isPlus && current < max) {
          newValue = current + 1;
        } else if (isMinus && current > min) {
          newValue = current - 1;
        }

        if (newValue !== current) {
          input.value = newValue;
          updateDisplay();

          // Update button states
          const row = input.closest('.yatra-quantity-row');
          if (row) {
            const minusBtn = row.querySelector('.yatra-quantity-minus');
            const plusBtn = row.querySelector('.yatra-quantity-plus');
            if (minusBtn) minusBtn.disabled = newValue <= min;
            if (plusBtn) plusBtn.disabled = newValue >= max;
          }

          // Sync to availability cards
          syncToAvailabilityCards(travelerInputs);
        }
      };

      // Function to sync sidebar travelers to availability cards
      const syncToAvailabilityCards = (inputs) => {
        const availabilitySection = document.getElementById('availability');
        if (!availabilitySection) return;

        inputs.forEach((input) => {
          const categoryId = input.id.replace(/^mobile_/, '').replace('traveler_', '');
          const value = parseInt(input.value) || 0;

          // Find all matching inputs in availability cards
          const availInputs = availabilitySection.querySelectorAll(`.yatra-availability-category[data-category="${categoryId}"]`);
          availInputs.forEach((availInput) => {
            availInput.value = value;

            // Update button states
            const row = availInput.closest('.yatra-quantity-row');
            if (row) {
              const min = parseInt(availInput.getAttribute('min') || 0);
              const max = parseInt(availInput.getAttribute('max') || 999);
              const minusBtn = row.querySelector('.yatra-quantity-minus');
              const plusBtn = row.querySelector('.yatra-quantity-plus');
              if (minusBtn) minusBtn.disabled = value <= min;
              if (plusBtn) plusBtn.disabled = value >= max;
            }

            // Update display for this card
            const participantsSelect = availInput.closest('.yatra-availability-participants');
            if (participantsSelect) {
              const display = participantsSelect.querySelector('.yatra-availability-participants-display');
              const categoryInputs = participantsSelect.querySelectorAll('.yatra-availability-category');
              if (display && categoryInputs.length > 0) {
                const parts = [];
                categoryInputs.forEach((catInput) => {
                  const catValue = parseInt(catInput.value) || 0;
                  if (catValue > 0) {
                    const catRow = catInput.closest('.yatra-quantity-row');
                    const categoryLabel = catRow ? catRow.querySelector('.yatra-quantity-title')?.textContent : 'Traveler';
                    parts.push(`${categoryLabel} x ${catValue}`);
                  }
                });
                if (parts.length > 0) {
                  display.textContent = parts.join(', ');
                }
              }
            }
          });
        });
        if (window.availabilitySection && typeof window.availabilitySection.updateAllCardTotals === 'function') {
          window.availabilitySection.updateAllCardTotals();
        }
      };

      // Close dropdown when clicking outside
      const closeHandler = (e) => {
        if (!participantsSelect.contains(e.target)) {
          participantsSelect.classList.remove('active');
        }
      };
      document.addEventListener('click', closeHandler);

      // Initialize display
      updateDisplay();

      // Initialize button states for all traveler inputs
      travelerInputs.forEach((input) => {
        const value = parseInt(input.value || 0);
        const min = parseInt(input.getAttribute('min') || 0);
        const max = parseInt(input.getAttribute('max') || 999);
        const row = input.closest('.yatra-quantity-row');
        if (row) {
          const minusBtn = row.querySelector('.yatra-quantity-minus');
          const plusBtn = row.querySelector('.yatra-quantity-plus');
          if (minusBtn) minusBtn.disabled = value <= min;
          if (plusBtn) plusBtn.disabled = value >= max;
        }
      });
    }

    handleCheckAvailability() {
      

      // Get form values - support regular pricing (num_travelers), old structure (adults/children), and traveler-based pricing
      const dateInput = document.getElementById('travel_date');
      const numTravelersInput = document.getElementById('num_travelers');
      const adultsInput = document.getElementById('adults');
      const childrenInput = document.getElementById('children');

      // Check for traveler-based pricing inputs (dynamic category inputs)
      const travelerInputs = document.querySelectorAll('input[id^="traveler_"]');

      const date = dateInput ? dateInput.value : '';

      // Check for travelers - prioritize traveler-based pricing, then num_travelers, then adults/children
      let totalTravelers = 0;
      if (travelerInputs.length > 0) {
        // Traveler-based pricing: sum all category inputs
        travelerInputs.forEach((input) => {
          totalTravelers += parseInt(input.value) || 0;
        });
      } else if (numTravelersInput) {
        // Regular pricing: single number input
        totalTravelers = parseInt(numTravelersInput.value) || 0;
      } else {
        // Old structure: adults + children
        const adults = adultsInput ? parseInt(adultsInput.value) || 0 : 0;
        const children = childrenInput ? parseInt(childrenInput.value) || 0 : 0;
        totalTravelers = adults + children;
      }

      

      // Basic validation
      if (!date) {
        alert('Please select a travel date');
        return;
      }

      if (totalTravelers === 0) {
        alert('Please select number of travelers');
        return;
      }

      // Show loading state
      if (this.checkAvailabilityBtn && !this.checkAvailabilityBtn.dataset.originalHtml) {
        this.checkAvailabilityBtn.dataset.originalHtml = this.checkAvailabilityBtn.innerHTML;
      }
      if (this.checkAvailabilityBtn) {
        this.checkAvailabilityBtn.innerHTML = '<svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Checking...';
        this.checkAvailabilityBtn.disabled = true;
      }

      // Get trip ID from data attribute or global variable
      const tripId = this.checkAvailabilityBtn?.dataset?.tripId ||
          document.querySelector('[data-trip-id]')?.dataset?.tripId ||
          (window.yatraTripData && window.yatraTripData.tripId) ||
          1; // Fallback to 1 for dummy data

      // Check if availability section already exists
      let availabilitySection = document.getElementById('availability');

      if (availabilitySection) {
        // Section already loaded, reload it with new date filter
        this.reloadAvailabilityWithDate(date, tripId);
        return;
      }

      const monthKey = monthFilterKeyFromIsoDate(date);
      const restUrl = buildAvailabilityTemplateUrl(tripId, {
        date,
        month_filter: monthKey,
        sort: 'date-asc',
        page: 1,
        per_page: 10,
      });

      fetch(restUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Public endpoint: do not send cookies/nonces
        credentials: 'omit',
      })
          .then(response => {
            
            if (!response.ok) {
              // Try to get error message from response
              return response.json().then(err => {
                console.error('API Error:', err);
                throw new Error(err.message || 'Failed to fetch availability');
              }).catch(() => {
                throw new Error('Failed to fetch availability (Status: ' + response.status + ')');
              });
            }
            return response.json();
          })
          .then(data => {
            
            if (!data || !data.html) {
              throw new Error('No HTML returned from server');
            }

            // Find the currently active section (first visible section or overview)
            const activeSection = this.findActiveSection();

            // Create a temporary container to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.html;
            const newSection = tempDiv.firstElementChild;

            if (!newSection) {
              throw new Error('Invalid HTML structure');
            }

            // Insert before the active section
            if (activeSection && activeSection.parentNode) {
              activeSection.parentNode.insertBefore(newSection, activeSection);
            } else {
              // Fallback: insert at the end of main content
              const mainContent = document.querySelector('.yatra-trip-main');
              if (mainContent) {
                mainContent.appendChild(newSection);
              }
            }

            // Add menu item to sticky nav at the same position
            // Pass the activeSection so we can find the corresponding menu item
            this.addAvailabilityMenuItem(activeSection);

            // Initialize availability section handlers
            if (window.availabilitySection) {
              window.availabilitySection.setup();
            } else {
              // Initialize if not already done
              window.availabilitySection = new AvailabilitySection();
              window.availabilitySection.setup();
            }

            // Re-setup sticky nav to include the new menu item
            if (window.stickyNav) {
              window.stickyNav.setup();
            }

            // Scroll to the new section
            this.scrollToAvailability(newSection);

            // Auto-select the card matching the selected date
            this.autoSelectDateCard(date);

            // Sync sidebar travelers to cards
            this.syncSidebarTravelersToCards();

            // Reset button state
            this.resetButton();
          })
          .catch(error => {
            console.error('Error loading availability:', error);
            alert('Failed to load availability. Please try again.');
            this.resetButton();
          });
    }

    findActiveSection() {
      // Find the first visible section or default to overview
      const sections = document.querySelectorAll('.yatra-trip-section');
      for (let section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight) {
          return section;
        }
      }
      // Default to overview section
      return document.getElementById('overview') || sections[0];
    }

    addAvailabilityMenuItem(activeSection) {
      const stickyNav = document.querySelector('.yatra-sticky-nav-container');
      if (!stickyNav) return;

      // Check if menu item already exists
      if (document.querySelector('.yatra-sticky-nav-item[href="#availability"]')) {
        return;
      }

      // Find the corresponding menu item for the active section
      let insertBeforeItem = null;
      let activeSectionId = null;

      if (activeSection) {
        activeSectionId = activeSection.id;
        if (activeSectionId) {
          // Find the menu item that links to this section
          insertBeforeItem = document.querySelector('.yatra-sticky-nav-item[href="#' + activeSectionId + '"]');
        }
      }

      // If no active section or menu item found, default to inserting after "What's Included"
      if (!insertBeforeItem) {
        insertBeforeItem = document.querySelector('.yatra-sticky-nav-item[href="#included"]');
        if (insertBeforeItem) {
          insertBeforeItem = insertBeforeItem.nextSibling; // Insert after "What's Included"
        }
      }

      // Create new menu item
      const newItem = document.createElement('a');
      newItem.href = '#availability';
      newItem.className = 'yatra-sticky-nav-item';
      newItem.innerHTML = `
                <svg class="yatra-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Availability</span>
            `;

      // Insert before the target item (or after "What's Included" if no target)
      if (insertBeforeItem && insertBeforeItem.parentNode) {
        insertBeforeItem.parentNode.insertBefore(newItem, insertBeforeItem);
      } else {
        // Fallback: append to the end
        stickyNav.appendChild(newItem);
      }

      // Update sticky nav to handle new item
      if (window.stickyNav) {
        // Add availability to sections array if not already there
        // Insert it in the correct position based on where the section was inserted
        if (!window.stickyNav.sections.includes('availability')) {
          if (activeSectionId) {
            const activeIndex = window.stickyNav.sections.indexOf(activeSectionId);
            if (activeIndex >= 0) {
              // Insert availability before the active section
              window.stickyNav.sections.splice(activeIndex, 0, 'availability');
            } else {
              window.stickyNav.sections.push('availability');
            }
          } else {
            window.stickyNav.sections.push('availability');
          }
        }
        // Re-setup to attach event listeners to new menu item
        window.stickyNav.setup();
      }
    }

    scrollToAvailability(section) {
      setTimeout(() => {
        const offset = 150;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update sticky nav active state after scroll completes
        setTimeout(() => {
          if (window.stickyNav) {
            window.stickyNav.updateActiveNav();
          }
        }, 300); // Wait for smooth scroll to complete
      }, 100);
    }

    resetButton() {
      if (this.checkAvailabilityBtn) {
        const originalHtml = this.checkAvailabilityBtn.dataset.originalHtml;
        if (originalHtml) {
          this.checkAvailabilityBtn.innerHTML = originalHtml;
        }
        this.checkAvailabilityBtn.disabled = false;
      }
    }
    
    reloadAvailabilityWithDate(date, tripId) {
      // Show loading state
      if (this.checkAvailabilityBtn && !this.checkAvailabilityBtn.dataset.originalHtml) {
        this.checkAvailabilityBtn.dataset.originalHtml = this.checkAvailabilityBtn.innerHTML;
      }
      if (this.checkAvailabilityBtn) {
        this.checkAvailabilityBtn.innerHTML = '<svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Loading...';
        this.checkAvailabilityBtn.disabled = true;
      }
      
      const availSection = document.getElementById('availability');
      const listEl = availSection ? availSection.querySelector('.yatra-availability-list') : null;
      const sortKey = listEl?.dataset?.sort || 'date-asc';
      const monthKey = monthFilterKeyFromIsoDate(date);

      const restUrl = buildAvailabilityTemplateUrl(tripId, {
        date,
        month_filter: monthKey,
        sort: sortKey,
        page: 1,
        per_page: 10,
      });

      fetch(restUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }
        return response.json();
      })
      .then(data => {
        if (!data || !data.html) {
          throw new Error('No HTML returned from server');
        }
        
        // Replace existing availability section
        const existingSection = document.getElementById('availability');
        if (existingSection) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.html;
          const newSection = tempDiv.firstElementChild;
          
          if (newSection) {
            existingSection.parentNode.replaceChild(newSection, existingSection);
            
            // Re-initialize availability section handlers
            if (window.availabilitySection) {
              window.availabilitySection.setup();
            }
            
            // Scroll to section
            this.scrollToAvailability(newSection);
            
            // Sync sidebar travelers to cards
            this.syncSidebarTravelersToCards();
          }
        }
        
        // Reset button state
        this.resetButton();
      })
      .catch(error => {
        console.error('Error reloading availability:', error);
        alert('Failed to reload availability. Please try again.');
        this.resetButton();
      });
    }

    autoSelectDateCard(selectedDate) {
      if (!selectedDate) return;

      // Wait a bit for the availability section to render
      setTimeout(() => {
        const availabilityCards = document.querySelectorAll('.yatra-availability-card');
        if (!availabilityCards.length) return;

        let matchingCard = null;
        let nearestCard = null;
        let minDiff = Infinity;

        const selectedTime = new Date(selectedDate).getTime();

        // Find exact match or nearest date
        availabilityCards.forEach(card => {
          const cardDate = card.dataset.date;
          if (!cardDate) return;

          if (cardDate === selectedDate) {
            matchingCard = card;
          } else {
            const cardTime = new Date(cardDate).getTime();
            const diff = Math.abs(cardTime - selectedTime);
            if (diff < minDiff) {
              minDiff = diff;
              nearestCard = card;
            }
          }
        });

        // Use exact match if found, otherwise use nearest
        const cardToOpen = matchingCard || nearestCard;

        if (cardToOpen) {
          // Open the card
          const toggle = cardToOpen.querySelector('.yatra-availability-toggle');
          if (toggle && !cardToOpen.classList.contains('open')) {
            toggle.click();
          }

          // Scroll to the card
          setTimeout(() => {
            const offset = 150;
            const elementPosition = cardToOpen.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }, 300);
        }
      }, 500);
    }

    updateSidebarForDate(dateStr) {
      if (!dateStr) return;

      // Get trip ID
      const tripId = this.checkAvailabilityBtn?.dataset?.tripId ||
          document.querySelector('[data-trip-id]')?.dataset?.tripId ||
          (window.yatraTripData && window.yatraTripData.tripId);

      if (!tripId) return;

      // Build REST URL
      const { base: baseUrl, isPlain } = getRestBase();

      let restUrl;
      if (isPlain && !baseUrl.includes('/yatra/v1')) {
        restUrl = `${baseUrl}/?rest_route=/yatra/v1/trips/${tripId}/date-pricing&date=${dateStr}`;
      } else if (baseUrl.includes('/yatra/v1')) {
        restUrl = baseUrl + '/trips/' + tripId + '/date-pricing?date=' + dateStr;
      } else {
        restUrl = baseUrl + '/yatra/v1/trips/' + tripId + '/date-pricing?date=' + dateStr;
      }

      const nonce = (window.yatraTripData && window.yatraTripData.nonce) || '';

      // Fetch date-specific data
      fetch(restUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        credentials: 'same-origin'
      })
          .then(response => response.json())
          .then(data => {
            if (data && data.success) {
              // Update departures available text
              const departuresText = document.querySelector('.yatra-departures-available-text');
              if (departuresText && data.departures_count !== undefined) {
                departuresText.textContent = data.departures_count + ' departure' + (data.departures_count !== 1 ? 's' : '') + ' available';
              }

              // Update traveler dropdown HTML
              const quantitySelector = document.getElementById('quantity-selector');
              if (quantitySelector && data.travelers_html) {
                quantitySelector.innerHTML = data.travelers_html;
                // Re-initialize quantity controls
                this.initQuantityControls();
              }

              // Update total price
              this.updateTotal();
            }
          })
          .catch(error => {
            console.error('Error fetching date pricing:', error);
          });
    }

    /**
     * Sync sidebar travelers to all availability cards
     */
    syncSidebarTravelersToCards() {
      // Get sidebar traveler values
      const travelerInputs = document.querySelectorAll('#quantity-selector input[id^="traveler_"]');
      const numTravelersInput = document.getElementById('num_travelers');

      if (travelerInputs.length === 0 && !numTravelersInput) {
        return; // No traveler inputs found
      }

      // Get all availability cards
      const availabilityCards = document.querySelectorAll('.yatra-availability-card');
      if (availabilityCards.length === 0) {
        return; // No availability cards found
      }

      availabilityCards.forEach((card) => {
        const itemId = card.getAttribute('data-availability-id') || card.getAttribute('data-item');
        if (!itemId) return;

        // Check if this card uses traveler-based pricing or simple pricing
        const travelerSelector = card.querySelector('.yatra-availability-quantity-selector[data-item="' + itemId + '"]');
        const simpleTravelers = card.querySelector('.yatra-availability-num-travelers[data-item="' + itemId + '"]');

        if (travelerSelector && travelerInputs.length > 0) {
          // Traveler-based pricing - sync by category
          travelerInputs.forEach((input) => {
            const categoryId = input.id.replace('traveler_', '');
            const value = parseInt(input.value) || 0;

            const row = travelerSelector.querySelector('.yatra-quantity-row[data-category-id="' + categoryId + '"]');
            if (row) {
              const cardInput = row.querySelector('input[type="number"]');
              if (cardInput) {
                const max = parseInt(cardInput.getAttribute('max')) || 99;
                cardInput.value = Math.min(value, max);

                // Update button states
                const minusBtn = row.querySelector('.yatra-quantity-minus');
                const plusBtn = row.querySelector('.yatra-quantity-plus');
                const min = parseInt(cardInput.getAttribute('min')) || 0;
                if (minusBtn) minusBtn.disabled = cardInput.value <= min;
                if (plusBtn) plusBtn.disabled = cardInput.value >= max;
              }
            }
          });

          // Update the display text for this card
          this.updateAvailabilityCardDisplay(itemId);

        } else if (simpleTravelers && numTravelersInput) {
          // Simple pricing - sync total count
          const totalCount = parseInt(numTravelersInput.value) || 1;
          const max = parseInt(simpleTravelers.getAttribute('max')) || 99;
          simpleTravelers.value = Math.min(totalCount, max);

          // Update button states
          const controls = simpleTravelers.closest('.yatra-quantity-controls-inline');
          if (controls) {
            const minusBtn = controls.querySelector('.yatra-quantity-minus');
            const plusBtn = controls.querySelector('.yatra-quantity-plus');
            const min = parseInt(simpleTravelers.getAttribute('min')) || 1;
            if (minusBtn) minusBtn.disabled = simpleTravelers.value <= min;
            if (plusBtn) plusBtn.disabled = simpleTravelers.value >= max;
          }
        }

        // Update card totals
        this.updateAvailabilityCardTotals(itemId);
      });
    }

    /**
     * Update availability card participants display
     */
    updateAvailabilityCardDisplay(itemId) {
      const display = document.querySelector('.yatra-availability-participants-display[data-item="' + itemId + '"]');
      if (!display) return;

      const selector = document.querySelector('.yatra-availability-quantity-selector[data-item="' + itemId + '"]');
      if (!selector) return;

      const rows = selector.querySelectorAll('.yatra-quantity-row');
      const parts = [];

      rows.forEach((row) => {
        const input = row.querySelector('input[type="number"]');
        const labelEl = row.querySelector('.yatra-quantity-title');
        if (input && labelEl) {
          const count = parseInt(input.value) || 0;
          if (count > 0) {
            parts.push(labelEl.textContent.trim() + ' x ' + count);
          }
        }
      });

      display.textContent = parts.length > 0 ? parts.join(', ') : '0 Travelers';
    }

    /**
     * Update availability card total price
     */
    updateAvailabilityCardTotals(itemId) {
      if (window.availabilitySection && typeof window.availabilitySection.updateTotalPrice === 'function') {
        window.availabilitySection.updateTotalPrice(itemId);
        return;
      }

      const totalAmountEl = document.querySelector('.yatra-card-total-amount[data-item="' + itemId + '"]');
      const totalNoteEl = document.querySelector('.yatra-card-total-note[data-item="' + itemId + '"]');
      if (!totalAmountEl) return;

      let total = 0;
      let totalTravelers = 0;

      // Check for traveler-based pricing first
      const selector = document.querySelector('.yatra-availability-quantity-selector[data-item="' + itemId + '"]');

      if (selector) {
        // Traveler-based pricing
        const rows = selector.querySelectorAll('.yatra-quantity-row');
        rows.forEach((row) => {
          const input = row.querySelector('input[type="number"]');
          const price = parseFloat(row.getAttribute('data-price')) || 0;
          const count = parseInt(input?.value) || 0;
          const pricingMode = row.getAttribute('data-pricing-mode') || (input ? input.getAttribute('data-pricing-mode') : '') || 'per_person';
          
          if (pricingMode === 'per_group') {
            // Per group: charge flat price once if any travelers
            if (count > 0) {
              total += price;
            }
          } else {
            // Per person: charge per traveler
            total += price * count;
          }
          totalTravelers += count;
        });
      } else {
        // Simple pricing
        const numTravelersInput = document.querySelector('.yatra-availability-num-travelers[data-item="' + itemId + '"]');
        if (numTravelersInput) {
          const price = parseFloat(numTravelersInput.getAttribute('data-price')) || parseFloat(totalAmountEl.getAttribute('data-base-price')) || 0;
          const count = parseInt(numTravelersInput.value) || 1;
          total = price * count;
          totalTravelers = count;
        } else {
          total = parseFloat(totalAmountEl.getAttribute('data-base-price')) || 0;
          totalTravelers = 1;
        }
      }

      // Format price (use existing format function if available)
      if (typeof yatra_format_price_js === 'function') {
        totalAmountEl.textContent = yatra_format_price_js(total);
      } else {
        // Fallback formatting
        totalAmountEl.textContent = String(total.toFixed(2));
      }

      if (totalNoteEl) {
        totalNoteEl.textContent = 'for ' + totalTravelers + ' traveler' + (totalTravelers !== 1 ? 's' : '');
      }

      // Update the card participants display
      this.updateAvailabilityCardDisplay(itemId);
    }


    handleMakeEnquiry() {
      // This will be handled by EnquiryModal class
      // Just trigger the modal open
      if (window.enquiryModal) {
        window.enquiryModal.open();
      }
    }

    setTravelers(adults, children) {
      const adultsInput = document.getElementById('adults');
      const childrenInput = document.getElementById('children');

      if (adultsInput) {
        adultsInput.value = adults;
        // Trigger change event to update display
        const event = new Event('change', { bubbles: true });
        adultsInput.dispatchEvent(event);
      }

      if (childrenInput) {
        childrenInput.value = children;
        // Trigger change event to update display
        const event = new Event('change', { bubbles: true });
        childrenInput.dispatchEvent(event);
      }
    }
  }

  /**
   * Enquiry Modal Class
   * Handles enquiry form modal functionality
   */
  class EnquiryModal {
    constructor() {
      this.modal = null;
      this.form = null;
      this.dateInput = null;
      this.participantsSelect = null;
      this.datepickerInstance = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.modal = document.getElementById('enquiry-modal');
      if (!this.modal) return;

      this.form = document.getElementById('enquiry-form');
      this.dateInput = document.getElementById('enquiry-travel-date');
      this.participantsSelect = document.querySelector('.yatra-enquiry-participants');

      this.attachEventListeners();
    }

    attachEventListeners() {
      // Close button
      const closeBtn = document.getElementById('close-enquiry-modal');
      const modalClose = document.querySelector('.yatra-enquiry-modal-close');
      const overlay = document.querySelector('.yatra-enquiry-modal-overlay');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }
      if (modalClose) {
        modalClose.addEventListener('click', () => this.close());
      }
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('active')) {
          this.close();
        }
      });

      // Form submission
      if (this.form) {
        this.form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSubmit();
        });
      }
    }

    open() {
      if (!this.modal) return;
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Initialize form fields after modal is visible
      setTimeout(() => {
        this.initDateField();
        this.initTravelersField();
      }, 300);
    }

    close() {
      if (!this.modal) return;
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    initDateField() {
      if (!this.dateInput || typeof flatpickr === 'undefined') return;

      // Sync date from main form
      const mainDateInput = document.getElementById('travel_date');
      if (mainDateInput && mainDateInput.value) {
        this.dateInput.value = mainDateInput.value;
      }

      // Destroy existing instance
      if (this.dateInput._flatpickr) {
        this.dateInput._flatpickr.destroy();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.datepickerInstance = flatpickr(this.dateInput, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: getTripAltDateFormat(),
        minDate: today,
        enableTime: false,
        clickOpens: true,
        allowInput: false,
        static: false,
        monthSelectorType: 'static',
        animate: true,
        locale: {
          firstDayOfWeek: 1
        },
        onChange: (selectedDates, dateStr) => {
          this.dateInput.value = dateStr;
        }
      });

      // Make container clickable
      const container = this.dateInput.closest('.yatra-booking-field-select');
      if (container) {
        container.style.cursor = 'pointer';
        const openPicker = (e) => {
          if (e && e.target && e.target.closest && e.target.closest('button, a, select, textarea')) {
            return;
          }
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (this.datepickerInstance && !this.datepickerInstance.isOpen) {
            this.datepickerInstance.open();
          }
        };

        container.addEventListener('click', openPicker);
        if (this.dateInput && this.dateInput._flatpickr && this.dateInput._flatpickr.altInput) {
          this.dateInput._flatpickr.altInput.addEventListener('click', openPicker);
        }
      }
    }

    initTravelersField() {
      if (!this.participantsSelect) return;

      const display = document.getElementById('enquiry-participants-display');
      const selector = document.getElementById('enquiry-quantity-selector');
      const adultsInput = document.getElementById('enquiry-adults');
      const childrenInput = document.getElementById('enquiry-children');

      if (!display || !selector || !adultsInput || !childrenInput) return;

      // Make display clickable
      display.style.cursor = 'pointer';

      // Toggle dropdown
      this.participantsSelect.onclick = (e) => {
        if (e.target.closest('.yatra-quantity-btn')) return;
        if (selector.contains(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        this.participantsSelect.classList.toggle('active');
      };

      // Update display function
      const updateDisplay = () => {
        const adults = parseInt(adultsInput.value || 1);
        const children = parseInt(childrenInput.value || 0);
        let text = '';
        if (adults > 0 && children > 0) {
          text = `Adult x ${adults}, Child x ${children}`;
        } else if (adults > 0) {
          text = `Adult x ${adults}`;
        } else if (children > 0) {
          text = `Child x ${children}`;
        } else {
          text = 'Adult x 1';
        }
        display.textContent = text;
      };

      // Quantity button handlers
      selector.onclick = (e) => {
        const btn = e.target.closest('.yatra-quantity-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const current = parseInt(input.value || 0);
        const min = parseInt(input.getAttribute('min') || 0);
        const max = parseInt(input.getAttribute('max') || 999);
        const isPlus = btn.classList.contains('yatra-quantity-plus');
        const isMinus = btn.classList.contains('yatra-quantity-minus');

        let newValue = current;
        if (isPlus && current < max) {
          newValue = current + 1;
        } else if (isMinus && current > min) {
          newValue = current - 1;
        }

        if (newValue !== current) {
          input.value = newValue;
          updateDisplay();

          // Update button states
          const row = input.closest('.yatra-quantity-row');
          if (row) {
            const minusBtn = row.querySelector('.yatra-quantity-minus');
            const plusBtn = row.querySelector('.yatra-quantity-plus');
            if (minusBtn) minusBtn.disabled = newValue <= min;
            if (plusBtn) plusBtn.disabled = newValue >= max;
          }
        }
      };

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.participantsSelect.contains(e.target)) {
          this.participantsSelect.classList.remove('active');
        }
      });

      // Initialize
      updateDisplay();
      [adultsInput, childrenInput].forEach((input) => {
        const value = parseInt(input.value || 0);
        const min = parseInt(input.getAttribute('min') || 0);
        const max = parseInt(input.getAttribute('max') || 999);
        const row = input.closest('.yatra-quantity-row');
        if (row) {
          const minusBtn = row.querySelector('.yatra-quantity-minus');
          const plusBtn = row.querySelector('.yatra-quantity-plus');
          if (minusBtn) minusBtn.disabled = value <= min;
          if (plusBtn) plusBtn.disabled = value >= max;
        }
      });
    }

    handleSubmit() {
      if (!this.form) return;

      const formData = new FormData(this.form);
      const messageBox = document.getElementById('enquiry-message-box');

      // Get values from hidden inputs for adults/children
      const adults = document.getElementById('enquiry-adults')?.value || 1;
      const children = document.getElementById('enquiry-children')?.value || 0;

      // Add adults and children to formData
      formData.set('adults', adults);
      formData.set('children', children);

      // Validation
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');

      if (!name || !email || !message) {
        this.showMessage('error', 'Please fill in all required fields.');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showMessage('error', 'Please enter a valid email address.');
        return;
      }

      if (message.length < 10) {
        this.showMessage('error', 'Please enter a message (at least 10 characters).');
        return;
      }

      // Show loading
      const submitBtn = this.form.querySelector('.yatra-enquiry-submit');
      const originalText = submitBtn ? submitBtn.textContent : 'Send Enquiry';
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
      }

      // Hide any existing messages
      if (messageBox) {
        messageBox.style.display = 'none';
      }

      // Submit via REST API (public endpoint)
      const payload = Object.fromEntries(formData.entries());

      // Build REST URL
      const baseUrlRaw = (window.yatraTripData?.apiUrl || window.yatraTripData?.restUrl || window.wpApiSettings?.root || '/wp-json').replace(/\/$/, '');
      const enquiriesUrl = baseUrlRaw.includes('/yatra/v1')
          ? `${baseUrlRaw}/enquiries`
          : `${baseUrlRaw}/yatra/v1/enquiries`;

      fetch(enquiriesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit', // public endpoint
        body: JSON.stringify(payload),
      })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            this.showMessage('success', result.message || result.data?.message || 'Thank you for your enquiry! We will get back to you soon.');
            this.form.reset();

            // Reset the travelers display
            const display = document.getElementById('enquiry-participants-display');
            if (display) {
              display.textContent = 'Adult x 1';
            }
            const adultsInput = document.getElementById('enquiry-adults');
            const childrenInput = document.getElementById('enquiry-children');
            if (adultsInput) adultsInput.value = 1;
            if (childrenInput) childrenInput.value = 0;

            // Close modal after delay
            setTimeout(() => {
              this.close();
              if (messageBox) {
                messageBox.style.display = 'none';
              }
            }, 3000);
          } else {
            this.showMessage('error', result.message || result.data?.message || 'Failed to submit enquiry. Please try again.');
          }
        })
        .catch(error => {
          console.error('Enquiry submission error:', error);
          this.showMessage('error', 'An error occurred. Please try again later.');
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        });
    }

    showMessage(type, text) {
      const messageBox = document.getElementById('enquiry-message-box');
      if (!messageBox) return;

      messageBox.style.display = 'block';
      messageBox.className = `yatra-enquiry-message yatra-enquiry-message-${type}`;
      messageBox.innerHTML = `<p>${text}</p>`;

      // Scroll message into view
      messageBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Sticky Navigation Class
   * Handles sticky navigation bar functionality
   */
  class StickyNav {
    constructor() {
      this.nav = null;
      this.sidebar = null;
      this.navItems = [];
      this.sections = [];
      this.scrollThreshold = 200;
      this.lastScrollTop = 0;
      this.navHeight = 0;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.nav = document.querySelector('.yatra-sticky-nav');
      if (!this.nav) return;

      this.sidebar = document.querySelector('.yatra-trip-sidebar');
      this.navItems = this.nav.querySelectorAll('.yatra-sticky-nav-item');
      
      // Update sections to match actual page hierarchy
      this.sections = this.getActualSections();

      // Calculate nav height
      this.navHeight = this.nav.offsetHeight || 60;

      this.attachEventListeners();
      this.handleScroll(); // Initial check
      this.updateActiveNav(); // Initial check
      this.updateSidebarPosition(); // Initial check
    }

    getActualSections() {
      // Base sections that are always present in order
      const baseSections = ['overview', 'itinerary', 'included', 'location', 'important-info'];
      
      // Conditional sections that may or may not be present
      const conditionalSections = ['downloads', 'faq', 'trip-story', 'what-makes-special', 'testimonials'];
      
      // Combine all sections and filter to only include those that actually exist on the page
      const allSections = [...baseSections, ...conditionalSections];
      
      return allSections.filter(sectionId => {
        const element = document.getElementById(sectionId);
        return element && element.offsetParent !== null; // Check if element exists and is visible
      });
    }

    attachEventListeners() {
      // Handle clicks on nav items
      this.navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const href = item.getAttribute('href');
          if (href && href.startsWith('#')) {
            const sectionId = href.substring(1);
            this.scrollToSection(sectionId);

            // Update active state
            this.navItems.forEach((nav) => nav.classList.remove('active'));
            item.classList.add('active');
          }
        });
      });

      // Handle scroll events
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });

      // Update sidebar position when nav visibility changes
      const observer = new MutationObserver(() => {
        this.updateSidebarPosition();
      });
      observer.observe(this.nav, { attributes: true, attributeFilter: ['class'] });
    }

    updateSidebarPosition() {
      if (!this.sidebar) return;

      const isNavVisible = this.nav.classList.contains('visible');
      const isAdminBar = document.body.classList.contains('admin-bar');

      // Calculate base top position
      let topPosition = 0;

      if (isAdminBar) {
        // Check if mobile admin bar (782px breakpoint)
        if (window.innerWidth <= 782) {
          topPosition = 46; // Mobile admin bar
        } else {
          topPosition = 32; // Desktop admin bar
        }
      }

      // Add sticky nav height if visible
      if (isNavVisible) {
        topPosition += this.navHeight;
      }

      // Apply to sidebar
      this.sidebar.style.top = topPosition + 'px';
    }

    scrollToAvailability(section) {
      if (!section) return;

      const offset = 100; // Account for sticky header
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    scrollToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (!section) {
        console.warn(`Section with ID "${sectionId}" not found`);
        return;
      }

      // Calculate offset - account for sticky nav and admin bar
      let offset = 100; // Base offset
      const isNavVisible = this.nav.classList.contains('visible');
      if (isNavVisible) {
        offset += this.navHeight;
      }

      // Check for WordPress admin bar
      const adminBar = document.getElementById('wpadminbar');
      if (adminBar) {
        // Check if mobile admin bar (782px breakpoint)
        if (window.innerWidth <= 782) {
          offset += 46; // Mobile admin bar
        } else {
          offset += 32; // Desktop admin bar
        }
      }

      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    autoSelectDateCard(selectedDate) {
      if (!selectedDate) return;

      // Wait a bit for the availability section to render
      setTimeout(() => {
        const availabilityCards = document.querySelectorAll('.yatra-availability-card');
        if (!availabilityCards.length) return;

        let matchingCard = null;
        let nearestCard = null;
        let minDiff = Infinity;

        const selectedTime = new Date(selectedDate).getTime();

        // Find exact match or nearest date
        availabilityCards.forEach(card => {
          const cardDate = card.dataset.date;
          if (!cardDate) return;

          if (cardDate === selectedDate) {
            matchingCard = card;
          } else {
            const cardTime = new Date(cardDate).getTime();
            const diff = Math.abs(cardTime - selectedTime);
            if (diff < minDiff) {
              minDiff = diff;
              nearestCard = card;
            }
          }
        });

        // Use exact match if found, otherwise use nearest
        const cardToOpen = matchingCard || nearestCard;

        if (cardToOpen) {
          // Open the card
          const toggle = cardToOpen.querySelector('.yatra-availability-toggle');
          if (toggle && !cardToOpen.classList.contains('open')) {
            toggle.click();
          }

          // Scroll to the card
          setTimeout(() => {
            const offset = 150;
            const elementPosition = cardToOpen.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }, 300);
        }
      }, 500);
    }

    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Show nav when scrolling down past threshold
      if (scrollTop > this.scrollThreshold) {
        this.nav.classList.add('visible');
      } else {
        this.nav.classList.remove('visible');
      }

      this.lastScrollTop = scrollTop;
    }

    updateActiveNav() {
      const scrollPos = window.scrollY + 150;
      let activeSectionId = null;

      // Find which section is currently in view
      this.sections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
            activeSectionId = sectionId;
          }
        }
      });

      // Update active state based on section ID (not index)
      if (activeSectionId) {
        this.navItems.forEach((nav) => {
          nav.classList.remove('active');
          const href = nav.getAttribute('href');
          if (href === '#' + activeSectionId) {
            nav.classList.add('active');
          }
        });
      }
    }

    onScroll() {
      this.handleScroll();
      this.updateActiveNav();
      this.updateSidebarPosition();
    }
  }

  /**
   * Availability Section Class
   * Handles availability section interactions (filters, load more)
   */
  class AvailabilitySection {
    constructor() {
      this.section = null;
      this.filterButtons = [];
      this.availabilityItems = [];
      this.currentMonthFilter = 'all';
      this.currentSortKey = 'date-asc';
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.section = document.getElementById('availability');
      if (!this.section) return;

      const filterBar = this.section.querySelector('.yatra-availability-filters');
      this.filterButtons = filterBar
        ? filterBar.querySelectorAll('.yatra-availability-filter-btn')
        : this.section.querySelectorAll('.yatra-availability-filter-btn');
      this.availabilityItems = this.section.querySelectorAll('.yatra-availability-card');

      const sortSelect = this.section.querySelector('#availability-sort');
      if (sortSelect && sortSelect.value) {
        this.currentSortKey = sortSelect.value;
      }

      this.attachEventListeners();

      const listEl = this.section.querySelector('.yatra-availability-list');
      if (listEl && listEl.dataset.monthFilter) {
        this.currentMonthFilter = listEl.dataset.monthFilter;
      } else {
        const activeFilterBtn = filterBar
          ? filterBar.querySelector('.yatra-availability-filter-btn.active')
          : this.section.querySelector('.yatra-availability-filter-btn.active');
        if (activeFilterBtn) {
          this.currentMonthFilter = activeFilterBtn.getAttribute('data-filter') || 'all';
        }
      }
      if (listEl && listEl.dataset.sort) {
        this.currentSortKey = listEl.dataset.sort;
      }

      // Scroll to selected card if exists
      this.scrollToSelectedCard();
    }
    
    scrollToSelectedCard() {
      // Find the selected card
      const selectedCard = this.section.querySelector('.yatra-availability-card.selected');
      if (selectedCard) {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          selectedCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }

    /**
     * Single source of truth for availability "Book Now" (Pro: yatraBeforeBooking / additional services popup).
     * Previously attachBookNowHandlers() used a legacy session POST and skipped the hook — inconsistent by date after AJAX refresh.
     */
    handleAvailabilityBookNowClick(btn) {
      const self = this;

      const tripId = btn.getAttribute('data-trip-id') || window.yatraTripData?.tripId;
      const date = btn.getAttribute('data-date');
      const itemIndex = btn.getAttribute('data-item');
      const availabilityId = btn.getAttribute('data-availability-id') || itemIndex;

      const card = btn.closest('.yatra-availability-card');

      let departureTime = '';
      if (card) {
        const timeElement = card.querySelector('.yatra-card-header-date');
        if (timeElement) {
          const timeText = timeElement.textContent?.trim();
          if (timeText && /^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(timeText)) {
            departureTime = timeText;
          }
        }
      }

      let travelers = 0;
      const travelerCounts = {};

      const categoryInputs = card?.querySelectorAll('.yatra-availability-category[data-item="' + itemIndex + '"]');
      if (categoryInputs && categoryInputs.length > 0) {
        categoryInputs.forEach((input) => {
          const categoryId = input.getAttribute('data-category');
          const count = parseInt(input.value) || 0;
          if (categoryId && count > 0) {
            travelerCounts[categoryId] = count;
            travelers += count;
          }
        });
      } else {
        const simpleInput = card?.querySelector('.yatra-availability-num-travelers[data-item="' + itemIndex + '"]');
        if (simpleInput) {
          travelers = parseInt(simpleInput.value) || 1;
        } else {
          const adults = this.getTravelerCount(itemIndex, 'adults');
          const children = this.getTravelerCount(itemIndex, 'children');
          travelers = parseInt(adults) + parseInt(children);
        }
      }

      if (travelers < 1) {
        this.showBookingError(btn, 'Please select at least 1 traveler to continue.');
        return;
      }

      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Processing...';
      btn.disabled = true;

      if (!tripId || isNaN(parseInt(tripId)) || parseInt(tripId) <= 0) {
        console.error('Invalid trip ID:', tripId);
        btn.innerHTML = originalText;
        btn.disabled = false;
        this.showBookingError(btn, 'Unable to process booking. Invalid trip data.');
        return;
      }

      const pricingType = btn.getAttribute('data-pricing-type') || 'regular';
      const isDayTrip = btn.getAttribute('data-is-day-trip') === '1';
      let priceTypesJson = btn.getAttribute('data-price-types') || '';
      let priceTypes = [];
      try {
        if (priceTypesJson) {
          priceTypes = JSON.parse(priceTypesJson);
        }
      } catch (e) {
        console.error('Error parsing price types:', e);
      }

      const btnDepartureTime = btn.getAttribute('data-departure-time') || '';
      if (btnDepartureTime) {
        departureTime = btnDepartureTime;
      }

      const sessionPayload = {
        trip_id: parseInt(tripId, 10),
        travelers: travelers,
        travel_date: date || '',
        departure_time: departureTime,
        availability_id: availabilityId,
        pricing_type: pricingType,
        price_types: priceTypes,
        is_day_trip: isDayTrip,
      };

      if (Object.keys(travelerCounts).length > 0) {
        sessionPayload.traveler_counts = travelerCounts;
      }

      if (typeof window.yatraBeforeBooking === 'function') {
        Promise.resolve(window.yatraBeforeBooking({
          btn: btn,
          originalText: originalText,
          sessionPayload: sessionPayload,
          proceedToBooking: () => self.proceedToBooking(btn, originalText, sessionPayload)
        })).then(handled => {
          if (!handled) {
            self.proceedToBooking(btn, originalText, sessionPayload);
          }
        }).catch(error => {
          console.error('Error in yatraBeforeBooking hook:', error);
          self.proceedToBooking(btn, originalText, sessionPayload);
        });
        return;
      }

      this.proceedToBooking(btn, originalText, sessionPayload);
    }

    attachEventListeners() {
      const filterBar = this.section.querySelector('.yatra-availability-filters');

      // Month filter buttons (server-side filter; buttons live only in .yatra-availability-filters)
      this.filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter') || 'all';
          this.currentMonthFilter = filter;
          this.filterButtons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.reloadAvailabilityFromServer({
            month_filter: filter,
            page: 1,
            sort: this.currentSortKey,
          });
        });
      });

      const showAllCta = this.section.querySelector('.yatra-availability-show-all-dates');
      if (showAllCta && filterBar) {
        showAllCta.addEventListener('click', (e) => {
          e.preventDefault();
          const allPill = filterBar.querySelector('.yatra-availability-filter-btn[data-filter="all"]');
          if (allPill) {
            allPill.click();
          }
        });
      }

      // Sort dropdown (server-side sort)
      const sortSelect = document.getElementById('availability-sort');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          const value = e && e.target ? e.target.value : '';
          this.currentSortKey = value || 'date-asc';
          this.reloadAvailabilityFromServer({
            month_filter: this.currentMonthFilter,
            page: 1,
            sort: this.currentSortKey,
            selectEl: sortSelect,
          });
        });
      }

      this.setupToggleHandlers();

      // Traveler selector buttons
      this.initTravelerSelectors();

      // Book Now buttons - set session and redirect to booking page
      const bookButtons = this.section.querySelectorAll('.yatra-card-book-btn');
      bookButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleAvailabilityBookNowClick(btn);
        });
      });

      // Load more button
      const loadMoreBtn = this.section.querySelector('.yatra-availability-load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          this.handleLoadMore();
        });
      }
    }

    /**
     * Replace availability section from API (sort / month filter / reset page).
     * @param {{ month_filter?: string, page?: number, sort?: string, per_page?: number, selectEl?: HTMLSelectElement }} opts
     */
    reloadAvailabilityFromServer(opts = {}) {
      const tripId = window.yatraTripData?.tripId || this.section?.getAttribute('data-trip-id') || 0;
      if (!tripId) {
        if (opts.sort) {
          this.sortItems(opts.sort);
        }
        return Promise.resolve();
      }

      const listEl = this.section?.querySelector('.yatra-availability-list');
      const monthFilter = opts.month_filter != null
        ? opts.month_filter
        : (listEl?.dataset?.monthFilter || this.currentMonthFilter || 'all');
      const sortKey = opts.sort || listEl?.dataset?.sort || this.currentSortKey || 'date-asc';
      const page = opts.page != null ? opts.page : 1;
      const perPage = opts.per_page != null
        ? opts.per_page
        : (parseInt(listEl?.dataset?.perPage, 10) || 10);
      const selectEl = opts.selectEl;
      const travelDateInput = document.getElementById('travel_date');
      const travelDate = travelDateInput && travelDateInput.value ? travelDateInput.value : undefined;

      const prevDisabled = !!(selectEl && selectEl.disabled);
      if (selectEl) {
        selectEl.disabled = true;
      }

      const url = buildAvailabilityTemplateUrl(tripId, {
        date: travelDate,
        month_filter: monthFilter,
        sort: sortKey,
        page,
        per_page: perPage,
      });

      return fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })
          .then((resp) => resp.json())
          .then((data) => {
            const html = data?.html || data?.data?.html;
            if (!html) {
              throw new Error('No HTML returned');
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const newSection = tempDiv.querySelector('#availability') || tempDiv.firstElementChild;
            if (!newSection) {
              throw new Error('Invalid HTML');
            }

            const oldSection = document.getElementById('availability');
            if (oldSection) {
              oldSection.replaceWith(newSection);
            }

            this.currentMonthFilter = monthFilter;
            this.currentSortKey = sortKey;
            this.setup();
          })
          .catch((err) => {
            console.error('[Yatra] Availability reload failed:', err);
            if (opts.sort) {
              this.sortItems(opts.sort);
            }
          })
          .finally(() => {
            if (selectEl) {
              selectEl.disabled = prevDisabled;
            }
          });
    }

    /**
     * Proceed to booking - creates session and redirects
     */
    proceedToBooking(btn, originalText, sessionPayload) {
      // Track Book Now click as InitiateCheckout (Facebook Pixel)
      if (typeof fbq !== 'undefined' && window.yatraAdmin?.facebookPixel?.connectionStatus?.pixelConnected) {
        const tripData = this.getTripData();
        const totalPrice = this.calculateTotalPrice();
        
        fbq('track', 'InitiateCheckout', {
          content_name: tripData.title || 'Trip',
          content_ids: [sessionPayload.trip_id],
          content_type: 'product',
          value: totalPrice,
          currency: window.yatraBookingData?.currency || 'USD',
          num_items: sessionPayload.travelers || 1
        });
        
        console.log('[Facebook Pixel] InitiateCheckout tracked for trip:', sessionPayload.trip_id);
      }
      
      // Track Book Now click as begin_checkout (Google Analytics 4)
      if (typeof gtag !== 'undefined' && window.yatraAdmin?.googleAnalytics?.measurementId) {
        const tripData = this.getTripData();
        const totalPrice = this.calculateTotalPrice();
        
        gtag('event', 'begin_checkout', {
          currency: window.yatraBookingData?.currency || 'USD',
          value: totalPrice,
          items: [{
            item_id: sessionPayload.trip_id,
            item_name: tripData.title || 'Trip',
            category: 'Travel',
            price: totalPrice / (sessionPayload.travelers || 1),
            quantity: sessionPayload.travelers || 1
          }]
        });
        
        console.log('[Google Analytics] begin_checkout tracked for trip:', sessionPayload.trip_id);
      }
      
      // Set booking session via REST API
      // credentials: 'same-origin' is required to send cookies for session
      const { base: baseUrl, isPlain } = getRestBase();
      let sessionUrl;
      if (isPlain && !baseUrl.includes('/yatra/v1')) {
        sessionUrl = `${baseUrl}/?rest_route=/yatra/v1/booking/session`;
      } else if (baseUrl.includes('/yatra/v1')) {
        sessionUrl = `${baseUrl}/booking/session`;
      } else {
        sessionUrl = `${baseUrl}/yatra/v1/booking/session`;
      }

      fetch(sessionUrl, {
        method: 'POST',
        credentials: 'same-origin', // needed for PHP session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionPayload)
      })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.redirect_url) {
              // Success - redirect to booking page
              window.location.href = data.redirect_url;
            } else {
              // Error - show message and reset button
              console.error('Booking session error:', data);
              btn.innerHTML = originalText;
              btn.disabled = false;
              this.showBookingError(btn, data.message || 'Unable to process booking. Please try again.');
            }
          })
          .catch(error => {
            console.error('Error setting booking session:', error);
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.showBookingError(btn, 'Unable to process booking. Please try again.');
          });
    }

    initTravelerSelectors() {
      // Initialize traveler-based pricing selectors (dropdowns with categories)
      const participantsSelects = this.section.querySelectorAll('.yatra-availability-participants');

      participantsSelects.forEach((select) => {
        const itemIndex = select.getAttribute('data-item');
        const display = select.querySelector('.yatra-availability-participants-display');
        const quantitySelector = select.querySelector('.yatra-availability-quantity-selector');
        const categoryInputs = select.querySelectorAll('.yatra-availability-category');

        if (!display || !quantitySelector || categoryInputs.length === 0) return;

        // Make the whole select area clickable
        select.style.cursor = 'pointer';

        // Toggle dropdown on select click
        select.addEventListener('click', (e) => {
          // Don't toggle if clicking on buttons or inputs
          if (e.target.closest('.yatra-quantity-btn') || e.target.closest('.yatra-quantity-input')) return;
          e.stopPropagation();
          select.classList.toggle('active');
        });

        // Update display text based on category inputs
        const updateDisplay = () => {
          const parts = [];
          categoryInputs.forEach((input) => {
            const value = parseInt(input.value) || 0;
            if (value > 0) {
              const row = input.closest('.yatra-quantity-row');
              const categoryLabel = row ? row.querySelector('.yatra-quantity-title')?.textContent : 'Traveler';
              parts.push(`${categoryLabel} x ${value}`);
            }
          });

          if (parts.length === 0) {
            // Default to first category
            const firstRow = categoryInputs[0]?.closest('.yatra-quantity-row');
            const firstLabel = firstRow ? firstRow.querySelector('.yatra-quantity-title')?.textContent : 'Traveler';
            display.textContent = `${firstLabel} x 1`;
          } else {
            display.textContent = parts.join(', ');
          }
        };

        // Quantity button handlers
        const quantityButtons = select.querySelectorAll('.yatra-quantity-btn');
        quantityButtons.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const targetId = btn.getAttribute('data-target');
            // Find the input in the same row
            const row = btn.closest('.yatra-quantity-row');
            const input = row ? row.querySelector('.yatra-quantity-input') : null;

            if (!input) return;

            const isMinus = btn.classList.contains('yatra-quantity-minus');
            const isPlus = btn.classList.contains('yatra-quantity-plus');

            let current = parseInt(input.value) || 0;
            const min = parseInt(input.getAttribute('min')) || 0;
            const max = parseInt(input.getAttribute('max')) || 999;
            let newValue = current;

            if (isPlus && current < max) {
              newValue = current + 1;
            } else if (isMinus && current > min) {
              newValue = current - 1;
            }

            if (newValue !== current) {
              input.value = newValue;
              updateDisplay();

              // Update button states
              const minusBtn = row.querySelector('.yatra-quantity-minus');
              const plusBtn = row.querySelector('.yatra-quantity-plus');
              if (minusBtn) minusBtn.disabled = newValue <= min;
              if (plusBtn) plusBtn.disabled = newValue >= max;

              // Update total price
              this.updateTotalPrice(itemIndex);

              // Sync with sidebar if exists
              this.syncSidebarTravelers(categoryInputs);
            }
          });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!select.contains(e.target)) {
            select.classList.remove('active');
          }
        });

        // Initialize display
        updateDisplay();

        // Initialize button states
        categoryInputs.forEach((input) => {
          const value = parseInt(input.value || 0);
          const min = parseInt(input.getAttribute('min') || 0);
          const max = parseInt(input.getAttribute('max') || 999);
          const row = input.closest('.yatra-quantity-row');
          if (row) {
            const minusBtn = row.querySelector('.yatra-quantity-minus');
            const plusBtn = row.querySelector('.yatra-quantity-plus');
            if (minusBtn) minusBtn.disabled = value <= min;
            if (plusBtn) plusBtn.disabled = value >= max;
          }
        });

        // Initialize total price for this card
        this.updateTotalPrice(itemIndex);
      });

      // Initialize regular pricing selectors (simple number inputs)
      const simpleTravelerInputs = this.section.querySelectorAll('.yatra-availability-travelers-simple');
      simpleTravelerInputs.forEach((container) => {
        const itemIndex = container.getAttribute('data-item');
        const input = container.querySelector('.yatra-availability-num-travelers');
        const quantityButtons = container.querySelectorAll('.yatra-quantity-btn');

        if (!input) return;

        quantityButtons.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isMinus = btn.classList.contains('yatra-quantity-minus');
            const isPlus = btn.classList.contains('yatra-quantity-plus');

            let current = parseInt(input.value) || 1;
            const min = parseInt(input.getAttribute('min')) || 1;
            const max = parseInt(input.getAttribute('max')) || 999;
            let newValue = current;

            if (isPlus && current < max) {
              newValue = current + 1;
            } else if (isMinus && current > min) {
              newValue = current - 1;
            }

            if (newValue !== current) {
              input.value = newValue;

              // Update button states
              const minusBtn = container.querySelector('.yatra-quantity-minus');
              const plusBtn = container.querySelector('.yatra-quantity-plus');
              if (minusBtn) minusBtn.disabled = newValue <= min;
              if (plusBtn) plusBtn.disabled = newValue >= max;

              // Update total price
              this.updateTotalPrice(itemIndex);
            }
          });
        });

        // Initialize total price for this card
        this.updateTotalPrice(itemIndex);
      });
    }

    setupToggleHandlers() {
      if (!this.availabilityItems || !this.availabilityItems.length) return;
      this.availabilityItems.forEach((item) => {
        const toggle = item.querySelector('.yatra-availability-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isOpen = item.classList.contains('open');
          this.availabilityItems.forEach((other) => other.classList.remove('open'));
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      });
    }

    getTravelerCount(itemIndex, type) {
      const select = this.section.querySelector(
          `.yatra-availability-participants[data-item="${itemIndex}"]`
      );
      if (!select) return type === 'adults' ? 1 : 0;

      const input = select.querySelector(
          type === 'adults' ? '.yatra-availability-adults' : '.yatra-availability-children'
      );
      if (!input) return type === 'adults' ? 1 : 0;
      const value = parseInt(input.value) || 0;
      return type === 'adults' && value === 0 ? 1 : value;
    }

    syncSidebarTravelers(categoryInputs) {
      // Sync availability card travelers to sidebar
      const sidebarDisplay = document.querySelector('.yatra-booking-card .yatra-participants-display');
      if (!sidebarDisplay) return;

      const sidebarSelector = document.querySelector('.yatra-booking-card .yatra-booking-quantity-selector');
      if (!sidebarSelector) return;

      // Build display text from category inputs
      const parts = [];
      categoryInputs.forEach((input) => {
        const value = parseInt(input.value) || 0;
        if (value > 0) {
          const row = input.closest('.yatra-quantity-row');
          const categoryLabel = row ? row.querySelector('.yatra-quantity-title')?.textContent : 'Traveler';
          parts.push(`${categoryLabel} x ${value}`);

          // Also update sidebar inputs if they exist
          const categoryId = input.getAttribute('data-category');
          const sidebarInput = sidebarSelector.querySelector(`input[id="traveler_${categoryId}"]`);
          if (sidebarInput) {
            sidebarInput.value = value;
            // Update button states
            const sidebarRow = sidebarInput.closest('.yatra-quantity-row');
            if (sidebarRow) {
              const min = parseInt(sidebarInput.getAttribute('min') || 0);
              const max = parseInt(sidebarInput.getAttribute('max') || 999);
              const minusBtn = sidebarRow.querySelector('.yatra-quantity-minus');
              const plusBtn = sidebarRow.querySelector('.yatra-quantity-plus');
              if (minusBtn) minusBtn.disabled = value <= min;
              if (plusBtn) plusBtn.disabled = value >= max;
            }
          }
        }
      });

      // Update sidebar display text
      if (parts.length > 0) {
        sidebarDisplay.textContent = parts.join(', ');
      }
    }

    updateTotalPrice(itemIndex) {
      const totalAmountElement = this.section.querySelector(
          `.yatra-card-total-amount[data-item="${itemIndex}"]`
      );
      if (!totalAmountElement) return;

      // Check for traveler-based pricing first
      const categoryInputs = this.section.querySelectorAll(`.yatra-availability-category[data-item="${itemIndex}"]`);
      let totalPrice = 0;
      let totalTravelers = 0;

      if (categoryInputs.length > 0) {
        // Traveler-based pricing: sum up each category's price * quantity (respecting pricing mode)
        categoryInputs.forEach((input) => {
          const quantity = parseInt(input.value) || 0;
          const row = input.closest('.yatra-quantity-row');
          const price = row ? parseFloat(row.getAttribute('data-price')) || 0 : 0;
          const pricingMode = (row ? row.getAttribute('data-pricing-mode') : null) || input.getAttribute('data-pricing-mode') || 'per_person';
          
          if (pricingMode === 'per_group') {
            if (quantity > 0) {
              totalPrice += price;
            }
          } else {
            totalPrice += quantity * price;
          }
          totalTravelers += quantity;
        });
      } else {
        // Regular pricing: simple number of travelers
        const numTravelersInput = this.section.querySelector(`.yatra-availability-num-travelers[data-item="${itemIndex}"]`);
        if (numTravelersInput) {
          totalTravelers = parseInt(numTravelersInput.value) || 1;
          const basePrice = parseFloat(numTravelersInput.getAttribute('data-price')) || parseFloat(totalAmountElement.getAttribute('data-base-price')) || 0;
          totalPrice = totalTravelers * basePrice;
        }
      }

      // Apply group discount if applicable
      const groupDiscountResult = this.calculateGroupDiscount(totalPrice, totalTravelers);
      const finalPrice = groupDiscountResult.finalPrice;
      const groupDiscountApplied = groupDiscountResult.discountApplied;
      const groupDiscountAmount = groupDiscountResult.discountAmount;

      // Format price with shared formatter (uses yatraTripData settings)
      if (typeof yatra_format_price_js === 'function') {
        totalAmountElement.textContent = yatra_format_price_js(finalPrice);
      } else {
        totalAmountElement.textContent = String(finalPrice.toFixed(2));
      }

      // Header "per person" must match chargable average (row totals + group discount), not static PHP.
      const cardRoot = this.section.querySelector('.yatra-availability-card[data-item="' + itemIndex + '"]');
      const headerSaleEl = cardRoot ? cardRoot.querySelector('.yatra-card-header-price .yatra-sale-price') : null;
      if (headerSaleEl) {
        let perPerson = 0;
        if (totalTravelers > 0) {
          perPerson = finalPrice / totalTravelers;
        } else if (totalPrice > 0) {
          perPerson = totalPrice;
        }
        if (perPerson > 0) {
          headerSaleEl.textContent =
            typeof yatra_format_price_js === 'function' ? yatra_format_price_js(perPerson) : String(perPerson.toFixed(2));
        }
      }

      // Update the note text
      const noteElement = this.section.querySelector(
          `.yatra-card-total-note[data-item="${itemIndex}"]`
      );
      if (noteElement) {
        let travelerText = totalTravelers === 1
            ? 'for 1 traveler'
            : `for ${totalTravelers} travelers`;

        // Add group discount info if applied
        if (groupDiscountApplied && groupDiscountAmount > 0) {
          const discountText = (typeof yatra_format_price_js === 'function')
              ? yatra_format_price_js(groupDiscountAmount)
              : String(groupDiscountAmount.toFixed(2));
          travelerText += ` (Group discount: -${discountText})`;
        }
        noteElement.textContent = travelerText;
      }

      // Show/hide group discount applied badge
      this.updateGroupDiscountBadge(itemIndex, groupDiscountApplied, groupDiscountResult);
    }

    /**
     * Calculate group discount based on total travelers
     */
    calculateGroupDiscount(totalPrice, totalTravelers) {
      const result = {
        finalPrice: totalPrice,
        discountApplied: false,
        discountAmount: 0,
        discountPercentage: 0,
        discountType: null
      };

      const groupDiscounts = window.yatraTripData && window.yatraTripData.sidebarGroupDiscounts;
      if (!Array.isArray(groupDiscounts) || groupDiscounts.length === 0) return result;

      // Find the applicable discount based on total travelers
      let applicableDiscount = null;

      for (const discount of groupDiscounts) {
        // Check if discount has ranges (new format)
        if (discount.group_discount_ranges && discount.group_discount_ranges.length > 0) {
          for (const range of discount.group_discount_ranges) {
            const minSize = parseInt(range.min_group_size) || 0;
            const maxSize = range.max_group_size ? parseInt(range.max_group_size) : Infinity;

            if (totalTravelers >= minSize && totalTravelers <= maxSize) {
              applicableDiscount = {
                type: range.discount_type || 'percentage',
                amount: parseFloat(range.discount_amount) || 0
              };
              break;
            }
          }
        } else {
          // Legacy format: single min_group_size
          const minSize = parseInt(discount.min_group_size) || 0;
          const maxSize = discount.max_group_size ? parseInt(discount.max_group_size) : Infinity;

          if (totalTravelers >= minSize && totalTravelers <= maxSize) {
            applicableDiscount = {
              type: discount.discount_type || 'percentage',
              amount: parseFloat(discount.discount_amount) || 0
            };
          }
        }

        if (applicableDiscount) break;
      }

      // Apply the discount if found
      if (applicableDiscount && applicableDiscount.amount > 0) {
        result.discountApplied = true;
        result.discountType = applicableDiscount.type;

        if (applicableDiscount.type === 'percentage') {
          result.discountPercentage = applicableDiscount.amount;
          result.discountAmount = totalPrice * (applicableDiscount.amount / 100);
        } else {
          // Fixed amount discount
          result.discountAmount = applicableDiscount.amount;
        }

        result.finalPrice = Math.max(0, totalPrice - result.discountAmount);
      }

      return result;
    }

    /**
     * Recompute footer + header pricing for every availability card (e.g. after sidebar traveler sync).
     */
    updateAllCardTotals() {
      if (!this.section) return;
      const seen = new Set();
      this.section.querySelectorAll('.yatra-availability-card[data-item]').forEach((card) => {
        const id = card.getAttribute('data-item');
        if (id && !seen.has(id)) {
          seen.add(id);
          this.updateTotalPrice(id);
        }
      });
    }

    /**
     * Update group discount badge visibility
     */
    updateGroupDiscountBadge(itemIndex, discountApplied, discountResult) {
      // Find or create the group discount applied badge for this item
      const availabilityItem = this.section.querySelector(`.yatra-availability-item[data-item="${itemIndex}"]`);
      if (!availabilityItem) return;

      let badge = availabilityItem.querySelector('.yatra-group-discount-applied');

      if (discountApplied && discountResult.discountAmount > 0) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'yatra-group-discount-applied';
          badge.style.cssText = 'background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px;';

          // Insert after the total amount
          const totalSection = availabilityItem.querySelector('.yatra-card-total');
          if (totalSection) {
            totalSection.appendChild(badge);
          }
        }

        // Update badge content
        const discountText = discountResult.discountType === 'percentage'
            ? `${discountResult.discountPercentage}% group discount applied!`
            : `Group discount applied!`;
        badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> ${discountText}`;
      } else if (badge) {
        badge.remove();
      }
    }

    filterByMonth(filter) {
      this.availabilityItems.forEach((item) => {
        if (filter === 'all') {
          item.style.display = 'block';
        } else {
          const itemMonth = item.getAttribute('data-month');
          if (itemMonth === filter) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        }
      });
    }

    sortItems(sortBy) {
      const items = Array.from(this.availabilityItems);
      const list = this.section.querySelector('.yatra-availability-list');
      if (!list) return;

      items.sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
          case 'date-desc':
            return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
          case 'price-asc':
            return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
          case 'price-desc':
            return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
          case 'seats-desc':
            return parseInt(b.getAttribute('data-seats')) - parseInt(a.getAttribute('data-seats'));
          default:
            return 0;
        }
      });

      // Re-append sorted items
      items.forEach((item) => {
        list.appendChild(item);
      });
    }

    handleBookNow(date, price, button, adults = 1, children = 0) {
      // Get travelers from the availability card if not provided
      const itemIndex = button.getAttribute('data-item');
      if (itemIndex) {
        adults = this.getTravelerCount(itemIndex, 'adults');
        children = this.getTravelerCount(itemIndex, 'children');
      }

      // Update the main booking form with selected date
      const dateInput = document.getElementById('travel_date');
      if (dateInput) {
        // Format date for display (YYYY-MM-DD)
        dateInput.value = date;
        // Trigger change event if using Flatpickr
        if (dateInput._flatpickr) {
          dateInput._flatpickr.setDate(date, true);
        }
      }

      // Update travelers in booking sidebar
      if (window.bookingSidebar) {
        window.bookingSidebar.setTravelers(adults, children);
      }

      // Scroll to booking sidebar
      const bookingSidebar = document.getElementById('booking');
      if (bookingSidebar) {
        bookingSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Show success feedback
      const originalText = button.textContent;
      button.textContent = 'Selected!';
      button.style.background = '#10b981';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    }

    handleLoadMore() {
      const tripId = window.yatraTripData?.tripId || this.section?.getAttribute('data-trip-id') || 0;
      const loadMoreContainer = this.section.querySelector('.yatra-availability-load-more');
      const btn = this.section.querySelector('.yatra-availability-load-more-btn');
      const countInfo = this.section.querySelector('.yatra-availability-count-info');
      const list = this.section.querySelector('.yatra-availability-list');

      if (!tripId || !btn || !list || !loadMoreContainer) return;

      const perPage = parseInt(list.dataset.perPage, 10) || parseInt(loadMoreContainer.dataset.perPage, 10) || 10;
      const currentPage = parseInt(list.dataset.page, 10) || 1;
      const nextPage = currentPage + 1;
      const monthFilter = list.dataset.monthFilter || loadMoreContainer.dataset.monthFilter || this.currentMonthFilter || 'all';
      const sortKey = list.dataset.sort || loadMoreContainer.dataset.sort || this.currentSortKey || 'date-asc';
      const travelDateInput = document.getElementById('travel_date');
      const travelDate = travelDateInput && travelDateInput.value ? travelDateInput.value : undefined;

      const originalHTML = btn.innerHTML;
      const loadingSvg = '<svg class="yatra-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> ';
      btn.innerHTML = loadingSvg + 'Loading...';
      btn.disabled = true;

      const url = buildAvailabilityTemplateUrl(tripId, {
        date: travelDate,
        month_filter: monthFilter,
        sort: sortKey,
        page: nextPage,
        per_page: perPage,
        partial: true,
      });

      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })
          .then((resp) => {
            if (!resp.ok) {
              throw new Error('Load more failed');
            }
            return resp.json();
          })
          .then((data) => {
            const html = data?.html || data?.data?.html;
            if (!html || typeof html !== 'string') {
              throw new Error('No HTML returned');
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();

            while (tempDiv.firstChild) {
              list.appendChild(tempDiv.firstChild);
            }

            const total = Number(data.total) || parseInt(list.dataset.total, 10) || 0;
            const loadedCount = Number(data.loaded_count);
            const hasMore = !!data.has_more;
            const displayed = Number.isFinite(loadedCount)
              ? loadedCount
              : (parseInt(list.dataset.displayed, 10) || 0) + perPage;

            list.dataset.total = String(total);
            list.dataset.displayed = String(displayed);
            list.dataset.page = String(nextPage);

            this.availabilityItems = this.section.querySelectorAll('.yatra-availability-card');
            this.setupToggleHandlers();
            this.initTravelerSelectors();
            this.attachBookNowHandlers();

            if (!hasMore) {
              loadMoreContainer.style.display = 'none';
              return;
            }

            const remaining = Math.max(0, total - displayed);
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Load more departures (${remaining} remaining)`;
            btn.disabled = false;

            loadMoreContainer.dataset.currentPage = String(nextPage);
            loadMoreContainer.dataset.loaded = String(displayed);
            loadMoreContainer.dataset.total = String(total);

            if (countInfo) {
              countInfo.textContent = `Showing ${displayed} of ${total} departures`;
            }
          })
          .catch((err) => {
            console.error('[Yatra] Load more failed:', err);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          });
    }

    attachBookNowHandlers() {
      const bookButtons = this.section.querySelectorAll('.yatra-card-book-btn');
      bookButtons.forEach((btn) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleAvailabilityBookNowClick(newBtn);
        });
      });
    }

    /**
     * Show booking error message to user just before the Book Now button
     * @param {HTMLElement} button - The Book Now button that was clicked
     * @param {string} message - Error message to display
     */
    showBookingError(button, message) {
      // Find the card/row containing this button
      const card = button.closest('.yatra-availability-card') || button.closest('.yatra-availability-item');
      if (!card) return;

      // Remove any existing error message in this card
      const existingError = card.querySelector('.yatra-booking-error-toast');
      if (existingError) {
        existingError.remove();
      }

      // Create error toast
      const toast = document.createElement('div');
      toast.className = 'yatra-booking-error-toast';
      toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-top: 12px; margin-bottom: 12px;">
                    <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24" style="flex-shrink: 0;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span style="flex: 1; color: #991b1b; font-size: 13px; font-weight: 500;">${message}</span>
                    <button type="button" style="background: none; border: none; cursor: pointer; padding: 2px; color: #991b1b; line-height: 1;" onclick="this.parentElement.parentElement.remove()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;

      // Insert just before the button (or button's parent row)
      const buttonRow = button.closest('.yatra-card-actions') || button.parentElement;
      if (buttonRow) {
        buttonRow.insertAdjacentElement('beforebegin', toast);
      } else {
        button.insertAdjacentElement('beforebegin', toast);
      }

      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 8000);

      // Scroll to the error message
      toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Itinerary Section Class
   * Handles day toggle functionality for itinerary timeline
   */
  class ItinerarySection {
    constructor() {
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.container = document.querySelector('.yatra-itinerary-timeline');
      if (!this.container) return;

      this.days = this.container.querySelectorAll('.yatra-itinerary-day');
      this.toggleAllBtn = document.getElementById('yatra-toggle-all');
      this.isAllExpanded = false;
      this.attachEventListeners();
      this.initializeDefaultState();
    }

    /** First day is expanded via PHP (`.is-day-expanded`); no inline styles. */
    initializeDefaultState() {}

    attachEventListeners() {
      // Toggle All button
      if (this.toggleAllBtn) {
        this.toggleAllBtn.addEventListener('click', () => this.toggleAll());
      }

      this.days.forEach(day => {
        const header = day.querySelector('.yatra-itinerary-day-header');
        const toggle = day.querySelector('.yatra-day-toggle');
        const content = day.querySelector('.yatra-itinerary-day-content');

        if (header && content) {
          header.addEventListener('click', (e) => {
            // Don't toggle if clicking on a link inside header
            if (e.target.tagName === 'A') return;
            this.toggleDay(day, toggle);
          });
        }
      });
    }

    toggleDay(day, toggle) {
      const isExpanded = day.classList.contains('is-day-expanded');
      if (isExpanded) {
        day.classList.remove('is-day-expanded');
        day.setAttribute('data-expanded', 'false');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      } else {
        day.classList.add('is-day-expanded');
        day.setAttribute('data-expanded', 'true');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
      }
    }

    toggleAll() {
      if (this.isAllExpanded) {
        this.days.forEach(day => {
          const toggle = day.querySelector('.yatra-day-toggle');
          day.classList.remove('is-day-expanded');
          day.setAttribute('data-expanded', 'false');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
        this.updateToggleButton(false);
      } else {
        this.days.forEach(day => {
          const toggle = day.querySelector('.yatra-day-toggle');
          day.classList.add('is-day-expanded');
          day.setAttribute('data-expanded', 'true');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        });
        this.updateToggleButton(true);
      }
      this.isAllExpanded = !this.isAllExpanded;
    }

    updateToggleButton(isExpanded) {
      if (!this.toggleAllBtn) return;
      this.toggleAllBtn.classList.toggle('is-all-expanded', isExpanded);
      const toggleText = this.toggleAllBtn.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = isExpanded ? 'Collapse All' : 'Expand All';
      }
    }
  }

  // ============================================
  // REVIEW FORM
  // ============================================
  class ReviewForm {
    constructor() {
      this.form = document.getElementById('yatra-review-form');
      if (this.form) {
        this.init();
      }
    }

    init() {
      this.setupStarRating();
      this.setupFormSubmission();
    }

    setupStarRating() {
      const ratingContainer = this.form.querySelector('.yatra-star-rating-input');
      if (!ratingContainer) return;

      const ratingInputs = Array.from(ratingContainer.querySelectorAll('input[type="radio"]'));
      const ratingLabels = Array.from(ratingContainer.querySelectorAll('.yatra-star-label'));

      // Get the rating value for a label by its associated input
      const getLabelRating = (label) => {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const input = document.getElementById(forAttr);
          return input ? parseInt(input.value) : 0;
        }
        return 0;
      };

      // Function to update visual state
      const updateStars = (rating) => {
        ratingLabels.forEach((label) => {
          const labelRating = getLabelRating(label);
          if (labelRating <= rating) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
        });
      };

      // Initialize visual state based on currently checked rating
      const checkedInput = ratingContainer.querySelector('input:checked');
      if (checkedInput) {
        const rating = parseInt(checkedInput.value);
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => {
          updateStars(rating);
        }, 0);
      }

      // Handle rating changes via input change event
      ratingInputs.forEach(input => {
        input.addEventListener('change', () => {
          updateStars(parseInt(input.value));
        });
      });

      // Handle direct clicks on labels
      ratingLabels.forEach((label) => {
        label.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const forAttr = label.getAttribute('for');
          if (!forAttr) return;

          const targetInput = document.getElementById(forAttr);
          if (targetInput && !targetInput.disabled) {
            targetInput.checked = true;
            const ratingValue = parseInt(targetInput.value);
            updateStars(ratingValue);
            // Trigger change event for any other listeners
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Hover effect
        label.addEventListener('mouseenter', () => {
          const hoverRating = getLabelRating(label);
          ratingLabels.forEach((l) => {
            const lRating = getLabelRating(l);
            if (lRating <= hoverRating) {
              l.classList.add('hover');
            } else {
              l.classList.remove('hover');
            }
          });
        });
      });

      // Remove hover effect when leaving the container
      ratingContainer.addEventListener('mouseleave', () => {
        ratingLabels.forEach(l => l.classList.remove('hover'));
      });
    }

    setupFormSubmission() {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = this.form.querySelector('.yatra-review-submit-btn');
        const originalText = submitBtn.innerHTML;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="yatra-loading-spinner"></span> Submitting...';

        try {
          const formData = new FormData(this.form);
          formData.append('action', 'yatra_submit_review');

          const response = await fetch(yatraTripData?.ajaxUrl || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
          });

          const result = await response.json();

          if (result.success) {
            // Show success message
            this.showMessage('success', result.data?.message || 'Thank you for your review!');

            // Check if this was an edit or new submission
            const isEdit = this.form.querySelector('input[name="action_type"]')?.value === 'edit';

            if (!isEdit) {
              // Only reset form for new submissions, not edits
              this.form.reset();

              // Reset star rating to 5 stars
              const fiveStarInput = this.form.querySelector('input[name="rating"][value="5"]');
              if (fiveStarInput) {
                fiveStarInput.checked = true;
                // Also update the visual display
                const ratingLabels = this.form.querySelectorAll('.yatra-star-label');
                ratingLabels.forEach(label => label.classList.add('selected'));
              }
            }
          } else {
            this.showMessage('error', result.data?.message || 'Failed to submit review. Please try again.');
          }
        } catch (error) {
          console.error('Review submission error:', error);
          this.showMessage('error', 'An error occurred. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    showMessage(type, message) {
      // Remove any existing messages
      const existingMsg = this.form.querySelector('.yatra-review-message');
      if (existingMsg) existingMsg.remove();

      const msgEl = document.createElement('div');
      msgEl.className = `yatra-review-message yatra-review-message-${type}`;
      msgEl.innerHTML = `<p>${message}</p>`;

      this.form.insertBefore(msgEl, this.form.firstChild);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        msgEl.remove();
      }, 5000);
    }
  }

  /**
   * Similar Adventures Carousel
   * Handles carousel navigation for similar trips section
   */
  class SimilarTripsCarousel {
    constructor() {
      this.track = null;
      this.prevBtn = null;
      this.nextBtn = null;
      this.items = [];
      this.currentPosition = 0;
      this.itemWidth = 0;
      this.visibleItems = 4;
      this.gap = 24;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.track = document.getElementById('similar-carousel');
      this.prevBtn = document.getElementById('similar-prev');
      this.nextBtn = document.getElementById('similar-next');

      if (!this.track || !this.prevBtn || !this.nextBtn) return;

      this.items = Array.from(this.track.querySelectorAll('.yatra-carousel-item'));
      if (this.items.length === 0) return;

      this.calculateDimensions();
      this.attachEventListeners();
      this.updateButtonStates();

      // Recalculate on resize
      window.addEventListener('resize', () => {
        this.calculateDimensions();
        this.updateButtonStates();
      });
    }

    calculateDimensions() {
      const wrapper = this.track.parentElement;
      const wrapperWidth = wrapper.offsetWidth;

      // Determine visible items based on screen width
      if (window.innerWidth <= 600) {
        this.visibleItems = 1;
      } else if (window.innerWidth <= 900) {
        this.visibleItems = 2;
      } else if (window.innerWidth <= 1200) {
        this.visibleItems = 3;
      } else {
        this.visibleItems = 4;
      }

      // Calculate item width
      this.itemWidth = (wrapperWidth - (this.gap * (this.visibleItems - 1))) / this.visibleItems;

      // Apply width to items
      this.items.forEach(item => {
        item.style.flex = `0 0 ${this.itemWidth}px`;
        item.style.minWidth = `${this.itemWidth}px`;
      });

      // Reset position if out of bounds
      const maxPosition = Math.max(0, this.items.length - this.visibleItems);
      if (this.currentPosition > maxPosition) {
        this.currentPosition = maxPosition;
        this.updateTrackPosition();
      }
    }

    attachEventListeners() {
      this.prevBtn.addEventListener('click', () => this.slide('prev'));
      this.nextBtn.addEventListener('click', () => this.slide('next'));

      // Touch/swipe support for mobile
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      this.track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      }, { passive: true });

      this.track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      }, { passive: true });

      this.track.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const diff = startX - currentX;
        const threshold = 50;

        if (diff > threshold) {
          this.slide('next');
        } else if (diff < -threshold) {
          this.slide('prev');
        }
      });
    }

    slide(direction) {
      const maxPosition = Math.max(0, this.items.length - this.visibleItems);

      if (direction === 'next' && this.currentPosition < maxPosition) {
        this.currentPosition++;
      } else if (direction === 'prev' && this.currentPosition > 0) {
        this.currentPosition--;
      }

      this.updateTrackPosition();
      this.updateButtonStates();
    }

    updateTrackPosition() {
      const offset = this.currentPosition * (this.itemWidth + this.gap);
      this.track.style.transform = `translateX(-${offset}px)`;
    }

    updateButtonStates() {
      const maxPosition = Math.max(0, this.items.length - this.visibleItems);

      this.prevBtn.disabled = this.currentPosition <= 0;
      this.nextBtn.disabled = this.currentPosition >= maxPosition;

      // Hide navigation if all items are visible
      const shouldHideNav = this.items.length <= this.visibleItems;
      this.prevBtn.style.display = shouldHideNav ? 'none' : 'flex';
      this.nextBtn.style.display = shouldHideNav ? 'none' : 'flex';
    }
  }


  /**
   * Wishlist Handler
   * Handles save/remove trip from wishlist functionality
   */
  class WishlistHandler {
    constructor() {
      if (!window.yatraTripData?.wishlistEnabled) {
        return;
      }
      this.apiUrl = window.yatraTripData?.apiUrl || '/wp-json/yatra/v1';
      this.nonce = window.yatraTripData?.nonce || '';
      this.tripId = window.yatraTripData?.tripId || 0;
      this.isLoggedIn = window.yatraTripData?.isLoggedIn || false;
      this.init();
    }

    init() {
      // Check if user is logged in and update button states
      if (this.isLoggedIn && this.tripId) {
        this.checkSavedStatus();
      }

      // Handle wishlist button clicks
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.yatra-favorite-btn');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          this.handleWishlistClick(btn);
        }
      });
    }

    async checkSavedStatus() {
      if (!this.tripId) return;

      try {
        const response = await fetch(
            `${this.apiUrl}/saved-trips/check/${this.tripId}`,
            {
              method: 'GET',
              headers: {
                'X-WP-Nonce': this.nonce
              },
              credentials: 'same-origin'
            }
        );

        const data = await response.json();
        if (data.success && data.data.is_saved) {
          this.updateButtonState(true);
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    }

    handleWishlistClick(btn) {
      if (!this.isLoggedIn) {
        this.showLoginPopup();
        return;
      }

      const btnTripId = parseInt(btn.getAttribute('data-trip-id'), 10) || this.tripId;
      if (!btnTripId) {
        return;
      }

      const isSaved = btn.classList.contains('saved');
      if (isSaved) {
        this.removeFromWishlist(btn, btnTripId);
      } else {
        this.addToWishlist(btn, btnTripId);
      }
    }

    async addToWishlist(btn, tripId) {
      const tid = tripId || this.tripId;
      btn.disabled = true;
      btn.classList.add('loading');

      try {
        // application/x-www-form-urlencoded is parsed reliably across hosts; JSON body can be dropped on some stacks.
        const params = new URLSearchParams();
        params.set('trip_id', String(tid));
        const response = await fetch(`${this.apiUrl}/saved-trips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-WP-Nonce': this.nonce
          },
          credentials: 'same-origin',
          body: params.toString()
        });

        const data = await response.json();
        if (data.success) {
          this.updateButtonState(true, tid);
          this.showMessage(data.message || 'Trip saved to wishlist', 'success', btn);
        } else {
          this.showMessage(data.message || 'Failed to save trip', 'error', btn);
        }
      } catch (error) {
        console.error('Error saving trip:', error);
        this.showMessage('An error occurred. Please try again.', 'error', btn);
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    }

    async removeFromWishlist(btn, tripId) {
      const tid = tripId || this.tripId;
      btn.disabled = true;
      btn.classList.add('loading');

      try {
        const response = await fetch(`${this.apiUrl}/saved-trips/${tid}`, {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': this.nonce
          },
          credentials: 'same-origin'
        });

        const data = await response.json();
        if (data.success) {
          this.updateButtonState(false, tid);
          this.showMessage(data.message || 'Trip removed from wishlist', 'success', btn);
        } else {
          this.showMessage(data.message || 'Failed to remove trip', 'error', btn);
        }
      } catch (error) {
        console.error('Error removing trip:', error);
        this.showMessage('An error occurred. Please try again.', 'error', btn);
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    }

    updateButtonState(isSaved, tripId) {
      const tid = tripId || this.tripId;
      const selector = tid
        ? `.yatra-favorite-btn[data-trip-id="${tid}"]`
        : '.yatra-favorite-btn';
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        if (isSaved) {
          btn.classList.add('saved', 'is-saved');
          btn.setAttribute('aria-label', 'Remove from favorites');
          // Fill the heart icon and change color
          const svg = btn.querySelector('svg');
          if (svg) {
            svg.style.fill = 'currentColor';
            svg.style.stroke = 'currentColor';
            btn.style.color = '#ef4444';
          }
        } else {
          btn.classList.remove('saved', 'is-saved');
          btn.setAttribute('aria-label', 'Add to favorites');
          // Unfill the heart icon
          const svg = btn.querySelector('svg');
          if (svg) {
            svg.style.fill = 'none';
            svg.style.stroke = 'currentColor';
            btn.style.color = '';
          }
        }
      });
    }

    showLoginPopup() {
      // Check if enquiry modal exists and reuse its structure, or create a simple login prompt
      const enquiryModal = document.getElementById('enquiry-modal');
      if (enquiryModal) {
        // Show enquiry modal with login message
        enquiryModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Update modal content to show login message
        const modalContent = enquiryModal.querySelector('.yatra-enquiry-modal-content');
        if (modalContent) {
          const loginMessage = document.createElement('div');
          loginMessage.className = 'yatra-login-prompt';
          loginMessage.style.cssText = 'padding: 40px; text-align: center;';
          loginMessage.innerHTML = `
                        <h3 style="margin-bottom: 20px;">Login Required</h3>
                        <p style="margin-bottom: 30px;">Please login to save trips to your wishlist.</p>
                        <a href="${window.yatraTripData?.loginUrl || '/wp-login.php'}" class="yatra-btn" style="display: inline-block; margin-right: 10px;">Login</a>
                        <button type="button" class="yatra-btn-secondary" onclick="this.closest('.yatra-enquiry-modal').classList.remove('active'); document.body.style.overflow = '';">Cancel</button>
                    `;
          modalContent.innerHTML = '';
          modalContent.appendChild(loginMessage);
        }
      } else {
        // Fallback: show alert and redirect to login
        if (confirm('Please login to save trips to your wishlist. Would you like to go to the login page?')) {
          window.location.href = window.yatraTripData?.loginUrl || '/wp-login.php';
        }
      }
    }

    showMessage(message, type, button) {
      // Remove existing toast if any
      const existingToast = document.getElementById('yatra-wishlist-toast');
      if (existingToast) {
        existingToast.remove();
      }

      // Create toast near the button
      const toast = document.createElement('div');
      toast.id = 'yatra-wishlist-toast';
      toast.textContent = message;

      // Position relative to button
      const rect = button.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      toast.style.cssText = `
                position: absolute;
                top: ${rect.bottom + scrollTop + 10}px;
                left: ${rect.left + scrollLeft}px;
                padding: 10px 16px;
                border-radius: 8px;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                white-space: nowrap;
                font-size: 14px;
                pointer-events: none;
                background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
                color: #ffffff;
                opacity: 0;
                transform: translateY(-10px);
            `;

      document.body.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      // Remove after delay
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 3000);
  }
}


/**
 * Trip Page Orchestrator
 * Centralized bootstrapper to keep initialization class-based and organized
 */
class TripPage {
  constructor() {
    this.instances = {};
  }

  init() {
    // Create all feature instances
    this.instances.galleryModal = new GalleryModal();
    this.instances.itineraryGalleryModal = new ItineraryGalleryModal();
    this.instances.heroMediaSwitcher = new HeroMediaSwitcher();
    this.instances.bookingSidebar = new BookingSidebar();
    this.instances.enquiryModal = new EnquiryModal();
    this.instances.stickyNav = new StickyNav();
    this.instances.wishlistHandler = new WishlistHandler();
    this.instances.availabilitySection = new AvailabilitySection();
    this.instances.itinerarySection = new ItinerarySection();
    this.instances.reviewForm = new ReviewForm();
    this.instances.similarTripsCarousel = new SimilarTripsCarousel();

    // Expose for legacy access (existing templates rely on window.*)
    this.exposeGlobals();

    // Extra page-level behaviors
    this.initHeroSmoothScroll();
    this.initGroupDiscountPopovers();

    return this.instances;
  }

  /**
   * Group discount popover in booking sidebar / mobile sticky (tap outside to close, Esc to close).
   */
  initGroupDiscountPopovers() {
    const syncOpenState = (wrap, open) => {
      const btn = wrap.querySelector('.yatra-group-discount-popover__trigger');
      const panel = wrap.querySelector('.yatra-group-discount-popover__panel');
      wrap.classList.toggle('is-open', open);
      if (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (panel) {
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      }
    };

    const closeAll = (exceptWrap = null) => {
      document.querySelectorAll('[data-yatra-group-discount-popover]').forEach((w) => {
        if (exceptWrap && w === exceptWrap) {
          return;
        }
        syncOpenState(w, false);
      });
    };

    const attach = () => {
      document.querySelectorAll('[data-yatra-group-discount-popover]').forEach((wrap) => {
        const btn = wrap.querySelector('.yatra-group-discount-popover__trigger');
        if (!btn || btn.dataset.yatraGdBound === '1') {
          return;
        }
        btn.dataset.yatraGdBound = '1';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const open = !wrap.classList.contains('is-open');
          if (open) {
            closeAll(wrap);
            syncOpenState(wrap, true);
          } else {
            syncOpenState(wrap, false);
          }
        });
      });

      if (document.documentElement.dataset.yatraGroupDiscountPopoverDocBound === '1') {
        return;
      }
      document.documentElement.dataset.yatraGroupDiscountPopoverDocBound = '1';

      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-yatra-group-discount-popover]')) {
          closeAll();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') {
          return;
        }
        const openWrap = document.querySelector('[data-yatra-group-discount-popover].is-open');
        if (openWrap) {
          syncOpenState(openWrap, false);
          const btn = openWrap.querySelector('.yatra-group-discount-popover__trigger');
          if (btn) {
            btn.focus();
          }
        }
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  }

  exposeGlobals() {
    Object.entries(this.instances).forEach(([key, instance]) => {
      window[key] = instance;
    });
    // Templates use window.YatraEnquiry.open() — alias to EnquiryModal instance
    if (this.instances.enquiryModal) {
      window.YatraEnquiry = this.instances.enquiryModal;
    }
    // Also expose orchestrator for potential future hooks
    window.tripPage = this;
  }

  initHeroSmoothScroll() {
    const attachScroll = () => {
      document.querySelectorAll('a[href="#yatra-booking-widget"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.getElementById('yatra-booking-widget');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachScroll);
    } else {
      attachScroll();
    }
  }

  static bootstrap() {
    const start = () => {
      new TripPage().init();
      new ItineraryVideoHandler(); // Initialize itinerary video handler
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }
}

/**
 * Itinerary Video Handler Class
 * Handles video player functionality for itinerary section
 */
class ItineraryVideoHandler {
  constructor() {
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Handle itinerary video clicks on overlay (both in gallery and separate video section)
    const videoOverlays = document.querySelectorAll('.yatra-entry-gallery .yatra-media-overlay, .yatra-entry-video .yatra-media-overlay');
    videoOverlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const link = overlay.closest('a');
        if (!link) return;
        
        const videoUrl = link.getAttribute('href');
        if (!videoUrl || videoUrl === '#') return;
        
        const img = overlay.closest('.yatra-media-card').querySelector('img');
        const videoTitle = img ? img.alt : 'Itinerary Video';
        
        // Extract video ID from URL
        let videoId = '';
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          // YouTube video ID extraction
          const matches = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
          videoId = matches ? matches[1] : '';
        } else if (videoUrl.includes('vimeo.com')) {
          // Vimeo video ID extraction
          const matches = videoUrl.match(/vimeo\.com\/(?:.*#|.\/videos\/)?([0-9]+)/);
          videoId = matches ? matches[1] : '';
        }
        
        // Play video using YatraVideoPlayer
        if (window.YatraVideoPlayer) {
          const videoData = {
            url: videoUrl,
            title: videoTitle
          };
          
          // Only add video_id for YouTube videos, let player detect URL type for others
          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            videoData.video_id = videoId;
          }
          
          window.YatraVideoPlayer.play(videoData);
        }
      });
    });
    
    // Prevent video links from opening in new tab (both in gallery and separate video section)
    const videoLinks = document.querySelectorAll('.yatra-entry-gallery .yatra-itinerary-video-link, .yatra-entry-video .yatra-itinerary-video-link');
    videoLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        return false;
      });
    });
  }
}

/**
 * Downloads Handler Class
 * Handles download section interactions including preview modal
 */
class DownloadsHandler {
  constructor() {
    this.previewModal = null;
    this.currentDownloadId = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.previewModal = document.getElementById('download-preview-modal');
    if (!this.previewModal) return;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Handle download button clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.yatra-download-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.yatra-download-btn');
        const downloadId = btn.dataset.downloadId;
        if (downloadId) {
          this.downloadFile(downloadId);
        }
      }

      // Handle view/preview link clicks
      if (e.target.closest('.yatra-download-view-link, .yatra-download-preview-link')) {
        e.preventDefault();
        const link = e.target.closest('.yatra-download-view-link, .yatra-download-preview-link');
        const downloadId = link.dataset.downloadId;
        if (downloadId) {
          this.previewFile(downloadId);
        }
      }

      // Handle modal close
      if (e.target.closest('.yatra-preview-modal-close, .yatra-preview-close-btn')) {
        this.closePreviewModal();
      }

      // Handle modal overlay click
      if (e.target.classList.contains('yatra-preview-modal-overlay')) {
        this.closePreviewModal();
      }

      // Handle preview modal download button
      if (e.target.closest('#preview-download-btn')) {
        if (this.currentDownloadId) {
          this.downloadFile(this.currentDownloadId);
        }
      }
    });

    // Handle ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.previewModal.style.display === 'block') {
        this.closePreviewModal();
      }
    });
  }

  async downloadFile(downloadId) {
    try {
      // Get download URL with signature using centralized helper
      const response = await window.YatraApiHelper.getDownloadInfo(downloadId);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      
      if (data.download_url) {
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.download_url;
        link.download = ''; // Let server determine filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Download URL not found');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Show error message to user
      this.showNotification('Download failed. Please try again.', 'error');
    }
  }

  async previewFile(downloadId) {
    try {
      this.currentDownloadId = downloadId;
      this.showPreviewModal();

      // Get download info using centralized helper
      const response = await window.YatraApiHelper.getDownloadInfo(downloadId);
      if (!response.ok) {
        throw new Error('Failed to get file info');
      }

      const data = await response.json();
      
      if (data.download_url) {
        this.loadPreview(data.download_url, data.title || 'Preview');
      } else {
        throw new Error('File URL not found');
      }
    } catch (error) {
      console.error('Preview error:', error);
      this.closePreviewModal();
      this.showNotification('Failed to load preview. Please try again.', 'error');
    }
  }

  loadPreview(fileUrl, title) {
    const previewContent = document.getElementById('preview-content');
    const modalTitle = document.querySelector('.yatra-preview-modal-title');
    
    if (modalTitle) {
      modalTitle.textContent = title;
    }

    if (!previewContent) return;

    // Hide loading and show preview
    const loading = previewContent.querySelector('.yatra-preview-loading');
    if (loading) {
      loading.style.display = 'none';
    }

    // Check file type and load appropriate preview
    const fileType = this.getFileType(fileUrl);
    
    if (fileType === 'image') {
      previewContent.innerHTML = `<img src="${fileUrl}" alt="${title}" style="max-width: 100%; height: auto;">`;
    } else if (fileType === 'pdf') {
      previewContent.innerHTML = `
        <iframe src="${fileUrl}" style="width: 100%; height: 500px; border: none; border-radius: 8px;"></iframe>
      `;
    } else {
      previewContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📄</div>
          <p style="color: #6b7280; margin-bottom: 16px;">Preview not available for this file type</p>
          <p style="color: #9ca3af; font-size: 14px;">Please download the file to view its contents</p>
        </div>
      `;
    }
  }

  getFileType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const pdfTypes = ['pdf'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (pdfTypes.includes(extension)) return 'pdf';
    return 'other';
  }

  showPreviewModal() {
    if (this.previewModal) {
      this.previewModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      
      // Reset loading state
      const previewContent = document.getElementById('preview-content');
      if (previewContent) {
        previewContent.innerHTML = `
          <div class="yatra-preview-loading">
            <div class="yatra-preview-spinner"></div>
            <p>Loading preview...</p>
          </div>
        `;
      }
    }
  }

  closePreviewModal() {
    if (this.previewModal) {
      this.previewModal.style.display = 'none';
      document.body.style.overflow = '';
      this.currentDownloadId = null;
    }
  }

  showNotification(message, type = 'info') {
    // Simple notification - you can enhance this with a proper notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Initialize downloads handler
new DownloadsHandler();

// Kick things off
TripPage.bootstrap();

})();
