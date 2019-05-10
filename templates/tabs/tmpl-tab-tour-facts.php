<div class="tab-content tabs">
    <div role="tabpanel" class="tab-pane fade active in" id="Section1">

        <h3><?php echo esc_html($title); ?></h3>
        <?php
        foreach($tour_facts as $fact){


            echo $fact['text'];

        }
        ?>
    </div>
</div>