<?php
if (!defined('ABSPATH')) {
    exit;
}

// Downloads Section - List View with Download Icons
// Expected variables: $trip
?>
<section class="yatra-trip-section" id="downloads">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon($tab->icon ?? 'download', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Downloads', 'yatra')); ?>
    </h2>
    
    <div class="yatra-downloads-container">
        <div class="yatra-downloads-list">
            <?php 
            $downloads = isset($trip->downloadable_items) ? $trip->downloadable_items : [];
            foreach ($downloads as $download): ?>
                <div class="yatra-download-item" data-download-id="<?php echo esc_attr($download->id); ?>">
                    <div class="yatra-download-icon">
                        <?php 
                        // Get appropriate icon based on file type
                        $fileIcon = 'file-text'; // default
                        if (!empty($download->file_type)) {
                            $fileType = strtolower($download->file_type);
                            if (strpos($fileType, 'pdf') !== false) {
                                $fileIcon = 'file-text';
                            } elseif (strpos($fileType, 'image') !== false) {
                                $fileIcon = 'image';
                            } elseif (strpos($fileType, 'video') !== false) {
                                $fileIcon = 'video';
                            } elseif (strpos($fileType, 'audio') !== false) {
                                $fileIcon = 'music';
                            } elseif (strpos($fileType, 'zip') !== false || strpos($fileType, 'rar') !== false) {
                                $fileIcon = 'archive';
                            } elseif (strpos($fileType, 'doc') !== false || strpos($fileType, 'word') !== false) {
                                $fileIcon = 'file-text';
                            } elseif (strpos($fileType, 'xls') !== false || strpos($fileType, 'excel') !== false) {
                                $fileIcon = 'file-text';
                            } elseif (strpos($fileType, 'ppt') !== false || strpos($fileType, 'powerpoint') !== false) {
                                $fileIcon = 'file-text';
                            }
                        }
                        echo yatra_svg_icon($fileIcon, 'yatra-download-file-icon');
                        ?>
                    </div>
                    
                    <div class="yatra-download-content">
                        <h3 class="yatra-download-title">
                            <?php echo esc_html($download->title); ?>
                        </h3>
                        
                        <?php if (!empty($download->description)): ?>
                            <p class="yatra-download-description">
                                <?php echo esc_html($download->description); ?>
                            </p>
                        <?php endif; ?>
                        
                        <div class="yatra-download-meta">
                            <?php if (!empty($download->file_size)): ?>
                                <span class="yatra-download-file-size">
                                    <?php 
                                    $fileSize = $download->file_size;
                                    if ($fileSize >= 1048576) {
                                        echo esc_html(round($fileSize / 1048576, 2) . ' MB');
                                    } elseif ($fileSize >= 1024) {
                                        echo esc_html(round($fileSize / 1024, 2) . ' KB');
                                    } else {
                                        echo esc_html($fileSize . ' bytes');
                                    }
                                    ?>
                                </span>
                            <?php endif; ?>
                            
                            <?php if (!empty($download->file_type)): ?>
                                <span class="yatra-download-file-type">
                                    <?php echo esc_html(strtoupper($download->file_type)); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <div class="yatra-download-action">
                        <?php if ($download->is_downloadable): ?>
                            <?php 
                            $visibility = $download->visibility ?? 'booked_only';
                            $canDownload = false;
                            $downloadBtnText = __('Download', 'yatra');
                            $downloadBtnClass = 'yatra-download-btn';
                            
                            // Check visibility permissions
                            if ($visibility === 'public') {
                                $canDownload = true;
                            } elseif ($visibility === 'logged_in') {
                                if (is_user_logged_in()) {
                                    $canDownload = true;
                                } else {
                                    $downloadBtnText = __('Login to Download', 'yatra');
                                    $downloadBtnClass .= ' yatra-download-btn-disabled';
                                }
                            } elseif ($visibility === 'booked_only') {
                                // Check if user has booking for this trip
                                $userBookings = [];
                                if (is_user_logged_in()) {
                                    // Get user's bookings for this trip
                                    $customer_id = get_current_user_id();
                                    // In a real implementation, you'd query bookings here
                                    // For now, we'll show a message
                                    $downloadBtnText = __('Booking Required', 'yatra');
                                    $downloadBtnClass .= ' yatra-download-btn-disabled';
                                } else {
                                    $downloadBtnText = __('Login & Booking Required', 'yatra');
                                    $downloadBtnClass .= ' yatra-download-btn-disabled';
                                }
                            }
                            
                            // Add data attributes for JavaScript
                            $dataAttrs = sprintf(
                                'data-download-id="%s" data-visibility="%s"',
                                esc_attr($download->id),
                                esc_attr($visibility)
                            );
                            
                            if ($canDownload): ?>
                                <a href="#" class="<?php echo esc_attr($downloadBtnClass); ?>" <?php echo $dataAttrs; ?>>
                                    <?php echo yatra_svg_icon('download', 'yatra-download-btn-icon'); ?>
                                    <?php echo esc_html($downloadBtnText); ?>
                                </a>
                            <?php else: ?>
                                <span class="<?php echo esc_attr($downloadBtnClass); ?>" <?php echo $dataAttrs; ?>>
                                    <?php echo yatra_svg_icon('lock', 'yatra-download-btn-icon'); ?>
                                    <?php echo esc_html($downloadBtnText); ?>
                                </span>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
            <?php if (empty($downloads)): ?>
                <div class="yatra-no-downloads">
                    <p class="text-gray-500 text-center py-8">
                        <?php echo esc_html__('No downloads available for this trip.', 'yatra'); ?>
                    </p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
