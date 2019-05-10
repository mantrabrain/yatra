<div class="tab-content tabs">
    <div role="tabpanel" class="tab-pane fade active in" id="Section1">

        <h3><?php echo esc_html($title); ?></h3>
        <div class="overview-section">
            <div class="sec-row row">
                <?php foreach ($overview as $overview_key => $overview_value) { ?>
                    <div class="col-half">
                        <div class="overview-icon">
                            <span class="icon-inner"><i class="<?php echo esc_attr($overview_value['icon']) ?>"
                                                        aria-hidden="true"></i></span>
                            <span class="overview-value"><strong><?php echo esc_attr($overview_value['title']) ?>
                                    :&nbsp;</strong><?php echo esc_html($overview_value['text']) ?></span>
                        </div>
                        <div class="overview-content">
                            <?php echo isset($overview_value['content']) ? esc_html($overview_value['content']) : ''; ?>
                        </div>
                    </div>
                <?php } ?>
            </div><!-- .sec-row -->
        </div>
    </div>
</div>