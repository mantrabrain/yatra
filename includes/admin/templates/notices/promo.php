<div class="notice notice-success is-dismissible" id="yatra-admin-promo-notice">
    <div class="logo">
        <img src="<?php echo esc_attr(YATRA_PLUGIN_URI . '/assets/images/promo-icon.png') ?>" alt="Yatra">
    </div>
    <div class="content">
        <p>Happy New Year 2022!</p>

        <h3>New Year <span class="highlight-green">Mega Sale</span></h3>
        <p>Get your discount on <span class="highlight-blue">Yatra Addons/Extensions</span> till 23rd January, 2022</p>
    </div>
    <div class="call-to-action">
        <a target="_blank"
           href="https://mantrabrain.com/yatra-premium-extensions/?utm_campaign=new_year_2021_promo&utm_medium=banner&utm_source=plugin_dashboard"
           class="save-button">Save 31% on each Addon/Extensions</a>
        <p>
            <span class="highlight-green">COUPON: </span>
            <span class="coupon-code">MEGA2022</span>
        </p>
    </div>
</div>

<style>
    #yatra-admin-promo-notice {
        font-size: 14px;
        border-left: none;
        background: linear-gradient(45deg, #00a182, #8200d3);
        color: #fff;
        display: flex;
        margin-left: 5px;
        margin-right: 5px;
        align-items: center;
    }

    #yatra-admin-promo-notice .notice-dismiss:before {
        color: #76E5FF;
    }

    #yatra-admin-promo-notice .notice-dismiss:hover:before {
        color: #b71c1c;
    }

    #yatra-admin-promo-notice .logo {
        text-align: center;
        margin: auto 50px;
    }

    #yatra-admin-promo-notice .logo img {
        width: 80%;
        border-radius: 100%;
    }

    #yatra-admin-promo-notice .highlight-green {
        color: #4FFF67;
    }

    #yatra-admin-promo-notice .highlight-blue {
        color: #76E5FF;
    }

    #yatra-admin-promo-notice .content {
        margin-top: 5px;
    }

    #yatra-admin-promo-notice .content h3 {
        color: #FFF;
        margin: 12px 0 5px;
        font-weight: normal;
        font-size: 30px;
    }

    #yatra-admin-promo-notice .content p {
        margin-top: 12px;
        padding: 0;
        letter-spacing: .4px;
        color: #ffffff;
        font-size: 15px;
    }

    #yatra-admin-promo-notice .call-to-action {
        margin-left: 15%;
        margin-top: 20px;
    }

    #yatra-admin-promo-notice .call-to-action a:focus {
        box-shadow: none;
    }

    #yatra-admin-promo-notice .call-to-action p {
        font-size: 16px;
        color: #fff;
        margin-top: 1px;
        text-align: center;
    }

    #yatra-admin-promo-notice .call-to-action a.save-button {
        padding: 20px 30px;
        font-size: 20px;
        font-weight: 600;
        color: #fff;
        background: #15a488;
        margin-bottom: 10px;
        display: block;
        text-align: center;
        border-radius: 50px;
        box-shadow: 9px 3px 10px rgba(0, 0, 0, 0.5);
        /* text-transform: uppercase; */
        /* letter-spacing: 2px; */
        text-decoration: none
    }

    #yatra-admin-promo-notice .coupon-code {
        -moz-user-select: all;
        -webkit-user-select: all;
        user-select: all;
    }
</style>

<script type='text/javascript'>
    jQuery('body').on('click', '#yatra-admin-promo-notice .notice-dismiss', function (e) {
        e.preventDefault();
        wp.ajax.post('yatra_dismiss_admin_promo_notice', {
            yatra_dismiss_admin_promo: true,
            yatra_nonce: '<?php echo esc_attr(wp_create_nonce('wp_yatra_dismiss_admin_promo_notice_nonce')); ?>',
        });
    });
</script>