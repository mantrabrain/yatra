<?php
    /**
    * The template for displaying trips archive page
    *
    * @package Yatra
    * @subpackage Yatra/includes/templates
    * @since 1.0.0
    */
get_header();
 if( have_posts() ):
    /**
     * Prints Title and breadcrumbs for archive pages
     * @since Yatri 1.0.0
     */

    //yatri_inner_banner();
    ?>
     <div class="section" style="margin-top:300px;">
         <div class="wrapper-inner" style="padding-top: 30px;">
             <!-- Services List -->
             <div class="widget-services-list">
                 <div class="services-item">
                     <div class="row">
                         <div class="col-md-4">
                             <div class="detail-pic">
                                 <img src="assets/images/pic1.jpg" alt="indonesia">
                             </div>
                         </div>
                         <div class="col-md-5">
                             <div class="detail-bg">
                                 <h2>Indonesie Groepsreis: Bali, Java, Sulawesi</h2>
                                 <h5>Snorkling, Tribes and Volcanoes</h5>
                                 <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget commodo orci. Integer varius nibh eu mattis porta. Pellentesque dictum sem eget cursus semper. Nullam quis blandit lorem.Pellentesque dictum sem eget cursus semper.</p>
                             </div>
                         </div>
                         <div class="col-md-3">
                             <div class="detail-content">
                                 <ul>
                                     <li><i class="fa fa-money"></i> Prijs: 1000 euro (price) </li>
                                     <li><i class="fa fa-clock-o"></i> Dagen: 15 dagen (days)   </li>
                                     <li><i class="fa fa-calendar-check-o"></i> Reizigers: minimum 4 (travellers)   </li>
                                     <li><i class="fa fa-users"></i> Datum: 15 juli 2020   </li>
                                 </ul>
                             </div>
                         </div>
                     </div>

                 </div>

                 <div class="services-item">
                     <div class="row">
                         <div class="col-md-4">
                             <div class="detail-pic">
                                 <img src="assets/images/pic1.jpg" alt="indonesia">
                             </div>
                         </div>
                         <div class="col-md-5">
                             <div class="detail-bg">
                                 <h2>Indonesie Groepsreis: Bali, Java, Sulawesi</h2>
                                 <h5>Snorkling, Tribes and Volcanoes</h5>
                                 <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget commodo orci. Integer varius nibh eu mattis porta. Pellentesque dictum sem eget cursus semper. Nullam quis blandit lorem.Pellentesque dictum sem eget cursus semper.</p>
                             </div>
                         </div>
                         <div class="col-md-3">
                             <div class="detail-content">
                                 <ul>
                                     <li><i class="fa fa-money"></i> Prijs: 1000 euro (price) </li>
                                     <li><i class="fa fa-clock-o"></i> Dagen: 15 dagen (days)   </li>
                                     <li><i class="fa fa-calendar-check-o"></i> Reizigers: minimum 4 (travellers)   </li>
                                     <li><i class="fa fa-users"></i> Datum: 15 juli 2020   </li>
                                 </ul>
                             </div>
                         </div>
                     </div>

                 </div>
             </div>
             <!-- Services List End -->
         </div>
     </div>
<?php
else:
    get_template_part( 'template-parts/page/content', 'none' );
endif;

get_footer();