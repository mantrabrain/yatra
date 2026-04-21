<?php
/**
 * Setup Wizard - Complete Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="complete">
    
    <div class="wizard-header" style="text-align: center; position: relative;">
        <!-- Achievement Badge Container -->
        <div class="achievement-badge" style="position: relative; display: inline-block; margin: 0 auto 20px;">
            <!-- Animated Ring Background -->
            <div class="achievement-ring" style="position: absolute; top: -10px; left: -10px; width: 84px; height: 84px; border: 3px solid #fbbf24; border-radius: 50%; animation: ringPulse 2s ease-in-out infinite;"></div>
            
            <!-- Success Icon with Background -->
            <div class="success-icon-bg" style="width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                </svg>
            </div>
        </div>
        
        <!-- Celebratory SVG Stars -->
        <div class="stars-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;">
            <!-- Star 1 -->
            <div class="star star-1" style="position: absolute; top: 15px; left: 15%; animation: floatStar 4s ease-in-out infinite;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <!-- Star 2 -->
            <div class="star star-2" style="position: absolute; top: 5px; right: 20%; animation: floatStar 4s ease-in-out infinite 0.8s;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <!-- Star 3 -->
            <div class="star star-3" style="position: absolute; top: 60px; left: 10%; animation: floatStar 4s ease-in-out infinite 1.6s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <!-- Star 4 -->
            <div class="star star-4" style="position: absolute; top: 40px; right: 10%; animation: floatStar 4s ease-in-out infinite 2.4s;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <!-- Star 5 -->
            <div class="star star-5" style="position: absolute; top: 80px; left: 25%; animation: floatStar 4s ease-in-out infinite 3.2s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <!-- Sparkle Effects -->
            <div class="sparkle sparkle-1" style="position: absolute; top: 25px; right: 30%; animation: sparkle 2s ease-in-out infinite 0.5s;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2v20M2 12h20"/>
                </svg>
            </div>
            <div class="sparkle sparkle-2" style="position: absolute; top: 70px; right: 25%; animation: sparkle 2s ease-in-out infinite 1.5s;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2v20M2 12h20"/>
                </svg>
            </div>
            <div class="sparkle sparkle-3" style="position: absolute; top: 50px; left: 20%; animation: sparkle 2s ease-in-out infinite 1s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2v20M2 12h20"/>
                </svg>
            </div>
        </div>
        
        <!-- Achievement Title -->
        <div style="position: relative; z-index: 10;">
            <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 3px; background: linear-gradient(90deg, transparent, #fbbf24);"></div>
                <span style="color: #f59e0b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Achievement Unlocked</span>
                <div style="width: 40px; height: 3px; background: linear-gradient(90deg, #fbbf24, transparent);"></div>
            </div>
            <h1 style="text-align: center; margin: 0 0 12px; font-size: 32px; font-weight: 700; color: #111827; background: linear-gradient(135deg, #111827, #374151); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"><?php esc_html_e('Setup Complete!', 'yatra'); ?></h1>
            <p style="text-align: center; margin: 0; font-size: 16px; color: #6b7280; font-weight: 400;"><?php esc_html_e('Your travel booking system is ready to use', 'yatra'); ?></p>
        </div>
    </div>

    <div class="wizard-content">
        <div class="info-box" style="text-align: center; padding: 24px; margin-bottom: 32px;">
            <p style="font-size: 15px; color: #6b7280; margin: 0;"><?php esc_html_e('Your booking system is configured and ready. Here are the next steps to get started:', 'yatra'); ?></p>
        </div>

        <div class="action-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; max-width: 700px; margin-left: auto; margin-right: auto;">
            <!-- Create First Trip -->
            <a href="<?php echo esc_url(admin_url('admin.php?page=yatra&subpage=trips')); ?>" class="action-card" style="display: flex; flex-direction: column; align-items: center; padding: 24px; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#4f46e5'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111827;"><?php esc_html_e('Create Your First Trip', 'yatra'); ?></h3>
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;"><?php esc_html_e('Add destinations, pricing, and availability', 'yatra'); ?></p>
            </a>

            <!-- Import Sample Data -->
            <div class="action-card" style="display: flex; flex-direction: column; align-items: center; padding: 24px; background: #fff; border: 2px solid #f59e0b; border-radius: 12px; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#d97706'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='#f59e0b'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="width: 48px; height: 48px; background: #fef3c7; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </div>
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111827;"><?php esc_html_e('Import Sample Data', 'yatra'); ?></h3>
                <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;"><?php esc_html_e('Get started quickly with demo content', 'yatra'); ?></p>
                <button type="button" id="import-sample-data-btn" onclick="importSampleData()" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #f59e0b; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; margin-top: auto;" onmouseover="this.style.background='#d97706';" onmouseout="this.style.background='#f59e0b';">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <?php esc_html_e('Import Sample Data', 'yatra'); ?>
                </button>
            </div>
        </div>

        <div class="premium-box">
            <h3><?php esc_html_e('Upgrade to Yatra Pro', 'yatra'); ?></h3>
            <p><?php esc_html_e('Get advanced features to grow your travel business', 'yatra'); ?></p>
            
            <div class="premium-features">
                <div class="premium-feature">
                    <h4><?php esc_html_e('Dynamic Pricing', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Seasonal rates & discounts', 'yatra'); ?></p>
                </div>
                <div class="premium-feature">
                    <h4><?php esc_html_e('Email Notifications', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Automated booking emails', 'yatra'); ?></p>
                </div>
                <div class="premium-feature">
                    <h4><?php esc_html_e('Advanced Reports', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Revenue & analytics', 'yatra'); ?></p>
                </div>
            </div>

            <div class="premium-cta">
                <a href="https://wpyatra.com/pricing" target="_blank" class="btn">
                    <?php esc_html_e('View Pro Features', 'yatra'); ?>
                </a>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('theme')); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <?php esc_html_e('Go to Dashboard', 'yatra'); ?>
        </button>
    </div>
</form>

<style>
/* Achievement Ring Pulse Animation */
@keyframes ringPulse {
    0% {
        transform: scale(1);
        opacity: 1;
        border-color: #fbbf24;
        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
        border-color: #f59e0b;
        box-shadow: 0 0 0 20px rgba(251, 191, 36, 0);
    }
    100% {
        transform: scale(1);
        opacity: 1;
        border-color: #fbbf24;
        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
    }
}

/* Star Floating Animation */
@keyframes floatStar {
    0% {
        transform: translateY(0px) rotate(0deg) scale(0);
        opacity: 0;
    }
    20% {
        opacity: 1;
        transform: translateY(-10px) rotate(90deg) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateY(-30px) rotate(180deg) scale(1.1);
    }
    80% {
        opacity: 0.8;
        transform: translateY(-50px) rotate(270deg) scale(0.9);
    }
    100% {
        transform: translateY(-70px) rotate(360deg) scale(0);
        opacity: 0;
    }
}

/* Sparkle Animation */
@keyframes sparkle {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
    }
    50% {
        transform: scale(1) rotate(180deg);
        opacity: 1;
    }
    100% {
        transform: scale(0) rotate(360deg);
        opacity: 0;
    }
}

/* Success Icon Background Animation */
.success-icon-bg {
    animation: successPulse 2s ease-in-out infinite;
}

@keyframes successPulse {
    0% {
        transform: scale(1);
        box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
    }
}

/* Individual Star Styles */
.star {
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
}

.star-1 { animation-delay: 0s; }
.star-2 { animation-delay: 0.8s; }
.star-3 { animation-delay: 1.6s; }
.star-4 { animation-delay: 2.4s; }
.star-5 { animation-delay: 3.2s; }

/* Sparkle Styles */
.sparkle {
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
}

.sparkle-1 { animation-delay: 0.5s; }
.sparkle-2 { animation-delay: 1.5s; }
.sparkle-3 { animation-delay: 1s; }

/* Achievement Badge Animation */
.achievement-badge {
    animation: achievementBurst 1s ease-out;
}

@keyframes achievementBurst {
    0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.1) rotate(10deg);
        opacity: 1;
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}

/* Achievement Title Animation */
.achievement-title {
    animation: titleSlideIn 1.2s ease-out 0.5s both;
}

@keyframes titleSlideIn {
    0% {
        transform: translateY(30px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Page Load Animation */
.wizard-header {
    animation: pageLoad 1.5s ease-out;
}

@keyframes pageLoad {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>

<script>
function importSampleData() {
    const button = document.getElementById('import-sample-data-btn');
    const originalText = button.innerHTML;
    
    // Confirm import
    if (!confirm('<?php esc_attr_e('This will import sample trips, destinations, and bookings. Continue?', 'yatra'); ?>')) {
        return;
    }
    
    // Show loading state
    button.disabled = true;
    button.style.opacity = '0.6';
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <?php esc_attr_e('Importing...', 'yatra'); ?>';
    
    // Call the same API as Tools.tsx
    fetch('<?php echo rest_url('yatra/v1/sample-data/import'); ?>', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
        },
        body: JSON.stringify({
            data_types: [], // Import all data types
            overwrite: false
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.className = 'notice notice-success is-dismissible';
            successDiv.style.marginTop = '20px';
            successDiv.innerHTML = '<p><?php echo esc_html(__('Sample data imported successfully!', 'yatra')); ?></p>';
            button.parentNode.appendChild(successDiv);
            
            // Update button to show success
            button.style.background = '#22c55e';
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <?php esc_attr_e('Imported Successfully', 'yatra'); ?>';
            
            // Show detailed counts if available
            if (data.data) {
                const counts = data.data;
                const details = Object.keys(counts)
                    .filter(key => counts[key] > 0)
                    .map(key => `${key}: ${counts[key]}`)
                    .join(', ');
                
                if (details) {
                    const detailsDiv = document.createElement('div');
                    detailsDiv.style.marginTop = '10px';
                    detailsDiv.style.fontSize = '12px';
                    detailsDiv.style.color = '#6b7280';
                    detailsDiv.innerHTML = '<strong><?php esc_html_e('Imported:', 'yatra'); ?></strong> ' + details;
                    button.parentNode.appendChild(detailsDiv);
                }
            }
        } else {
            throw new Error(data.message || '<?php esc_html_e('Import failed', 'yatra'); ?>');
        }
    })
    .catch(error => {
        console.error('Sample data import error:', error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notice notice-error is-dismissible';
        errorDiv.style.marginTop = '20px';
        errorDiv.innerHTML = '<p><?php echo esc_html(__('Failed to import sample data. Please try again.', 'yatra')); ?></p>';
        button.parentNode.appendChild(errorDiv);
        
        // Reset button
        button.disabled = false;
        button.style.opacity = '1';
        button.innerHTML = originalText;
    });
}
</script>
