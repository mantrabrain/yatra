<?php
/**
 * Yatra Admin Settings Class
 *
 * @package  Yatra/Admin
 * @version  1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Yatra_Admin_Settings', false ) ) :

	/**
	 * Yatra_Admin_Settings Class.
	 */
	class Yatra_Admin_Settings {

		/**
		 * Setting pages.
		 *
		 * @var array
		 */
		private static $settings = array();

		/**
		 * Error messages.
		 *
		 * @var array
		 */
		private static $errors = array();

		/**
		 * Update messages.
		 *
		 * @var array
		 */
		private static $messages = array();

		/**
		 * Include the settings page classes.
		 */
		public static function get_settings_pages() {

			if ( empty( self::$settings ) ) {
				$settings = array();

				$settings[] = include 'settings/class-yatra-settings-general.php';
				$settings[] = include 'settings/class-yatra-settings-design.php';
				$settings[] = include 'settings/class-yatra-settings-emails.php';
				$settings[] = include 'settings/class-yatra-settings-checkout.php';
				$settings[] = include 'settings/class-yatra-settings-payment-gateways.php';
				$settings[] = include 'settings/class-yatra-settings-frontend-tabs.php';
				$settings[] = include 'settings/class-yatra-settings-miscellaneous.php';


				self::$settings = apply_filters( 'yatra_get_settings_pages', $settings );
			}

			return self::$settings;
		}

		/**
		 * Save the settings.
		 */
		public static function save() {
			global $current_tab;

			check_admin_referer( 'yatra-settings' );

			// Trigger actions.
			do_action( 'yatra_settings_save_' . $current_tab );
			do_action( 'yatra_update_options_' . $current_tab );
			do_action( 'yatra_update_options' );

			self::add_message( __( 'Your settings have been saved.', 'yatra' ) );
			self::check_download_folder_protection();

			// Clear any unwanted data and flush rules.
			update_option( 'yatra_queue_flush_rewrite_rules', 'yes' );

			do_action( 'yatra_settings_saved' );
		}

		/**
		 * Add a message.
		 *
		 * @param string $text Message.
		 */
		public static function add_message( $text ) {
			self::$messages[] = $text;
		}

		/**
		 * Add an error.
		 *
		 * @param string $text Message.
		 */
		public static function add_error( $text ) {
			self::$errors[] = $text;
		}

		/**
		 * Output messages + errors.
		 */
		public static function show_messages() {
			if ( count( self::$errors ) > 0 ) {
				foreach ( self::$errors as $error ) {
					echo '<div id="message" class="error inline"><p><strong>' . esc_html( $error ) . '</strong></p></div>';
				}
			} elseif ( count( self::$messages ) > 0 ) {
				foreach ( self::$messages as $message ) {
					echo '<div id="message" class="updated inline"><p><strong>' . esc_html( $message ) . '</strong></p></div>';
				}
			}
		}

		/**
		 * Settings page.
		 *
		 * Handles the display of the main yatra settings page in admin.
		 */
		public static function output() {
			global $current_section, $current_tab;


			$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
			$suffix = '';

			do_action( 'yatra_settings_start' );

			//wp_enqueue_script( 'yatra_settings', Yatra()->plugin_url() . '/assets/js/admin/settings' . $suffix . '.js', array( 'jquery', 'wp-util', 'jquery-ui-datepicker', 'jquery-ui-sortable', 'iris', 'selectWoo' ), Yatra()->version, true );

//			/*wp_localize_script(
//				'yatra_settings', 'yatra_settings_params', array(
//					'i18n_nav_warning' => __( 'The changes you made will be lost if you navigate away from this page.', 'yatra' ),
//					'i18n_moved_up'    => __( 'Item moved up', 'yatra' ),
//					'i18n_moved_down'  => __( 'Item moved down', 'yatra' ),
//				)
//			);*/

			// Get tabs for the settings page.
			$tabs = apply_filters( 'yatra_settings_tabs_array', array() );

			include dirname( __FILE__ ) . '/views/html-admin-settings.php';
		}

		/**
		 * Get a setting from the settings API.
		 *
		 * @param string $option_name Option name.
		 * @param mixed  $default     Default value.
		 * @return mixed
		 */
		public static function get_option( $option_name, $default = '' ) {
			if ( ! $option_name ) {
				return $default;
			}

			// Array value.
			if ( strstr( $option_name, '[' ) ) {

				parse_str( $option_name, $option_array );

				// Option name is first key.
				$option_name = current( array_keys( $option_array ) );

				// Get value.
				$option_values = get_option( $option_name, '' );

				$key = key( $option_array[ $option_name ] );

				if ( isset( $option_values[ $key ] ) ) {
					$option_value = $option_values[ $key ];
				} else {
					$option_value = null;
				}
			} else {
				// Single value.
				$option_value = get_option( $option_name, null );
			}

			if ( is_array( $option_value ) ) {
				$option_value = wp_unslash( $option_value );
			} elseif ( ! is_null( $option_value ) ) {
				$option_value = stripslashes( $option_value );
			}

			return ( null === $option_value ) ? $default : $option_value;
		}

		/**
		 * Output admin fields.
		 *
		 * Loops though the yatra options array and outputs each field.
		 *
		 * @param array[] $options Opens array to output.
		 */
		public static function output_fields( $options ) {
			foreach ( $options as $value ) {
				if ( ! isset( $value['type'] ) ) {
					continue;
				}
				if ( ! isset( $value['id'] ) ) {
					$value['id'] = '';
				}
				if ( ! isset( $value['title'] ) ) {
					$value['title'] = isset( $value['name'] ) ? $value['name'] : '';
				}
				if ( ! isset( $value['class'] ) ) {
					$value['class'] = '';
				}
				if ( ! isset( $value['css'] ) ) {
					$value['css'] = '';
				}
				if ( ! isset( $value['default'] ) ) {
					$value['default'] = '';
				}
				if ( ! isset( $value['desc'] ) ) {
					$value['desc'] = '';
				}
				if ( ! isset( $value['desc_tip'] ) ) {
					$value['desc_tip'] = false;
				}
				if ( ! isset( $value['placeholder'] ) ) {
					$value['placeholder'] = '';
				}
				if ( ! isset( $value['suffix'] ) ) {
					$value['suffix'] = '';
				}

				// Custom attribute handling.
				$custom_attributes = array();

				if ( ! empty( $value['custom_attributes'] ) && is_array( $value['custom_attributes'] ) ) {
					foreach ( $value['custom_attributes'] as $attribute => $attribute_value ) {
						$custom_attributes[] = esc_attr( $attribute ) . '="' . esc_attr( $attribute_value ) . '"';
					}
				}

				// Description handling.
				$field_description = self::get_field_description( $value );
				$description       = $field_description['description'];
				$tooltip_html      = $field_description['tooltip_html'];

				// Switch based on type.
				switch ( $value['type'] ) {

					// Section Titles.
					case 'title':
						if ( ! empty( $value['title'] ) ) {
							echo '<h2>' . esc_html( $value['title'] ) . '</h2>';
						}
						if ( ! empty( $value['desc'] ) ) {
							echo '<div id="' . esc_attr( sanitize_title( $value['id'] ) ) . '-description">';
							echo wp_kses_post( wpautop( wptexturize( $value['desc'] ) ) );
							echo '</div>';
						}
						echo '<table class="form-table">' . "\n\n";
						if ( ! empty( $value['id'] ) ) {
							do_action( 'yatra_settings_' . sanitize_title( $value['id'] ) );
						}
						break;

					// Section Ends.
					case 'sectionend':
						if ( ! empty( $value['id'] ) ) {
							do_action( 'yatra_settings_' . sanitize_title( $value['id'] ) . '_end' );
						}
						echo '</table>';
						if ( ! empty( $value['id'] ) ) {
							do_action( 'yatra_settings_' . sanitize_title( $value['id'] ) . '_after' );
						}
						break;

					// Standard text inputs and subtypes like 'number'.
					case 'text':
					case 'password':
					case 'datetime':
					case 'datetime-local':
					case 'date':
					case 'month':
					case 'time':
					case 'week':
					case 'number':
					case 'email':
					case 'url':
					case 'hidden':
					case 'tel':
						$option_value = self::get_option( $value['id'], $value['default'] );
						$hidden_style = $value['type'] === 'hidden' ? 'style="display:none"': '';
						?><tr valign="top" <?php echo $hidden_style ?>>
							<th scope="row" class="titledesc">
								<label for="<?php echo esc_attr( $value['id'] ); ?>"><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp forminp-<?php echo esc_attr( sanitize_title( $value['type'] ) ); ?>">
								<input
									name="<?php echo esc_attr( $value['id'] ); ?>"
									id="<?php echo esc_attr( $value['id'] ); ?>"
									type="<?php echo esc_attr( $value['type'] ); ?>"
									style="<?php echo esc_attr( $value['css'] ); ?>"
									value="<?php echo esc_attr( $option_value ); ?>"
									class="<?php echo esc_attr( $value['class'] ); ?>"
									placeholder="<?php echo esc_attr( $value['placeholder'] ); ?>"
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
									/><?php echo esc_html( $value['suffix'] ); ?> <?php echo $description; // WPCS: XSS ok. ?>
							</td>
						</tr>
						<?php
						break;

					// Color picker.
					case 'color':
						$option_value = self::get_option( $value['id'], $value['default'] );

						?>
						<tr valign="top">
							<th scope="row" class="titledesc">
								<label for="<?php echo esc_attr( $value['id'] ); ?>"><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp forminp-<?php echo esc_attr( sanitize_title( $value['type'] ) ); ?>">&lrm;
								<input
									name="<?php echo esc_attr( $value['id'] ); ?>"
									id="<?php echo esc_attr( $value['id'] ); ?>"
									type="text"
									dir="ltr"
									style="<?php echo esc_attr( $value['css'] ); ?>"
									value="<?php echo esc_attr( $option_value ); ?>"
									class="<?php echo esc_attr( $value['class'] ); ?> yatra-colorpicker yatra-hide"
									placeholder="<?php echo esc_attr( $value['placeholder'] ); ?>"
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
									/>&lrm; <?php echo $description; // WPCS: XSS ok. ?>
									<div class="wp-picker-container yatra-color-picker-container">
                                        <button type="button" class="button wp-color-result yatra-color-picker-button" aria-expanded="false" style="background-color:<?php echo esc_attr($option_value) ?>;">
                                        <span class="wp-color-result-text">Select Color</span>
                                        </button>
									</div>
							 </td>
						</tr>
						<?php
						break;

					// Textarea.
					case 'textarea':
						$option_value = self::get_option( $value['id'], $value['default'] );

						?>
						<tr valign="top">
							<th scope="row" class="titledesc">
								<label for="<?php echo esc_attr( $value['id'] ); ?>"><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp forminp-<?php echo esc_attr( sanitize_title( $value['type'] ) ); ?>">
								<?php echo $description; // WPCS: XSS ok. ?>

                            <?php

                            $editor = isset($value['editor']) ? (boolean)$value['editor'] : false;
                    if ($editor) {
                                $editor_settings = isset($value['editor_settings']) ? $value['editor_settings'] : array();

                                $editor_height = isset($editor_settings['editor_height']) ? (int)$value['editor_height'] : 350;

                                $editor_default_settings = array(
                                    'textarea_name' => $value['id'],
                                    'tinymce' => array(
                                        'init_instance_callback ' => 'function(inst) {
                                                   $("#" + inst.id + "_ifr").css({minHeight: "' . $editor_height . 'px"});
                                            }'
                                    ),
                                    'wpautop' => true


                                       );


                    $editor_settings = wp_parse_args($editor_default_settings, $editor_settings);


                        wp_editor($option_value, $value['id'], $editor_settings);
                    }else{
                        ?>
								<textarea
									name="<?php echo esc_attr( $value['id'] ); ?>"
									id="<?php echo esc_attr( $value['id'] ); ?>"
									style="<?php echo esc_attr( $value['css'] ); ?>"
									class="<?php echo esc_attr( $value['class'] ); ?>"
									placeholder="<?php echo esc_attr( $value['placeholder'] ); ?>"
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
									><?php echo esc_textarea( $option_value ); // WPCS: XSS ok. ?></textarea>
									<?php } ?>
							</td>
						</tr>
						<?php
						break;

					// Select boxes.
					case 'select':
					case 'multiselect':
						$option_value = self::get_option( $value['id'], $value['default'] );

						?>
						<tr valign="top">
							<th scope="row" class="titledesc">
								<label for="<?php echo esc_attr( $value['id'] ); ?>"><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp forminp-<?php echo esc_attr( sanitize_title( $value['type'] ) ); ?>">
								<select
									name="<?php echo esc_attr( $value['id'] ); ?><?php echo ( 'multiselect' === $value['type'] ) ? '[]' : ''; ?>"
									id="<?php echo esc_attr( $value['id'] ); ?>"
									style="<?php echo esc_attr( $value['css'] ); ?>"
									class="<?php echo esc_attr( $value['class'] ); ?>"
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
									<?php echo 'multiselect' === $value['type'] ? 'multiple="multiple"' : ''; ?>
									>
									<?php
									foreach ( $value['options'] as $key => $val ) {
										?>
										<option value="<?php echo esc_attr( $key ); ?>"
											<?php

											if ( is_array( $option_value ) ) {
												selected( in_array( (string) $key, $option_value, true ), true );
											} else {
												selected( $option_value, (string) $key );
											}

										?>
										><?php echo esc_html( $val ); ?></option>
										<?php
									}
									?>
								</select> <?php echo $description; // WPCS: XSS ok. ?>
							</td>
						</tr>
						<?php
						break;

					// Radio inputs.
					case 'radio':
						$option_value = self::get_option( $value['id'], $value['default'] );

						?>
						<tr valign="top">
							<th scope="row" class="titledesc">
								<label for="<?php echo esc_attr( $value['id'] ); ?>"><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp forminp-<?php echo esc_attr( sanitize_title( $value['type'] ) ); ?>">
								<fieldset>
									<?php echo $description; // WPCS: XSS ok. ?>
									<ul>
									<?php
									foreach ( $value['options'] as $key => $val ) {
										?>
										<li>
											<label><input
												name="<?php echo esc_attr( $value['id'] ); ?>"
												value="<?php echo esc_attr( $key ); ?>"
												type="radio"
												style="<?php echo esc_attr( $value['css'] ); ?>"
												class="<?php echo esc_attr( $value['class'] ); ?>"
												<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
												<?php checked( $key, $option_value ); ?>
												/> <?php echo esc_html( $val ); ?></label>
										</li>
										<?php
									}
									?>
									</ul>
								</fieldset>
							</td>
						</tr>
						<?php
						break;

					// Checkbox input.
					case 'checkbox':
						$option_value     = self::get_option( $value['id'], $value['default'] );
						$visibility_class = array();

						if ( ! isset( $value['hide_if_checked'] ) ) {
							$value['hide_if_checked'] = false;
						}
						if ( ! isset( $value['show_if_checked'] ) ) {
							$value['show_if_checked'] = false;
						}
						if ( 'yes' === $value['hide_if_checked'] || 'yes' === $value['show_if_checked'] ) {
							$visibility_class[] = 'hidden_option';
						}
						if ( 'option' === $value['hide_if_checked'] ) {
							$visibility_class[] = 'hide_options_if_checked';
						}
						if ( 'option' === $value['show_if_checked'] ) {
							$visibility_class[] = 'show_options_if_checked';
						}

						if ( ! isset( $value['checkboxgroup'] ) || 'start' === $value['checkboxgroup'] ) {
							?>
								<tr valign="top" class="<?php echo esc_attr( implode( ' ', $visibility_class ) ); ?>">
									<th scope="row" class="titledesc"><?php echo esc_html( $value['title'] ); ?></th>
									<td class="forminp forminp-checkbox">
										<fieldset>
							<?php
						} else {
							?>
								<fieldset class="<?php echo esc_attr( implode( ' ', $visibility_class ) ); ?>">
							<?php
						}

						if ( ! empty( $value['title'] ) ) {
							?>
								<legend class="screen-reader-text"><span><?php echo esc_html( $value['title'] ); ?></span></legend>
							<?php
						}

						?>
							<label for="<?php echo esc_attr( $value['id'] ); ?>">
								<input
									name="<?php echo esc_attr( $value['id'] ); ?>"
									id="<?php echo esc_attr( $value['id'] ); ?>"
									type="checkbox"
									class="<?php echo esc_attr( isset( $value['class'] ) ? $value['class'] : '' ); ?>"
									value="1"
									<?php checked( $option_value, 'yes' ); ?>
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
								/> <?php echo $description; // WPCS: XSS ok. ?>
							</label> <?php echo $tooltip_html; // WPCS: XSS ok. ?>
						<?php

						if ( ! isset( $value['checkboxgroup'] ) || 'end' === $value['checkboxgroup'] ) {
										?>
										</fieldset>
									</td>
								</tr>
							<?php
						} else {
							?>
								</fieldset>
							<?php
						}
						break;


					// Checkbox input.
					case 'multicheckbox':
						$option_value     = self::get_option( $value['id'], $value['default'] );
						$visibility_class = array();

						if ( ! isset( $value['hide_if_checked'] ) ) {
							$value['hide_if_checked'] = false;
						}
						if ( ! isset( $value['show_if_checked'] ) ) {
							$value['show_if_checked'] = false;
						}
						if ( 'yes' === $value['hide_if_checked'] || 'yes' === $value['show_if_checked'] ) {
							$visibility_class[] = 'hidden_option';
						}
						if ( 'option' === $value['hide_if_checked'] ) {
							$visibility_class[] = 'hide_options_if_checked';
						}
						if ( 'option' === $value['show_if_checked'] ) {
							$visibility_class[] = 'show_options_if_checked';
						}

 							?>
								<tr valign="top" class="<?php echo esc_attr( implode( ' ', $visibility_class ) ); ?>">
									<th scope="row" class="titledesc"><?php echo esc_html( $value['title'] ); ?></th>
									<td class="forminp forminp-checkbox">

                            <?php $checkbox_options = isset($value['options']) ? $value['options']: array();

                            foreach($checkbox_options as  $checkbox_option_values){

                                $main_id = $value['id'];

                                $multi_checkbox_id = isset($checkbox_option_values['id']) ? $checkbox_option_values['id']: '';

                                $multi_checkbox_title = isset($checkbox_option_values['title']) ? $checkbox_option_values['title']: '';

                                 $multi_checkbox_option_value = isset($option_value[$multi_checkbox_id]) ? $option_value[$multi_checkbox_id]:'';

                                if(!empty($multi_checkbox_id )){

                                    $multi_checkbox_id=$main_id.'['.$multi_checkbox_id.']';
                                }
                             ?>

										<fieldset>
							<?php


						if ( ! empty( $value['title'] ) ) {
							?>
								<legend class="screen-reader-text"><span><?php echo esc_html( $value['title'] ); ?></span></legend>
							<?php
						}

						?>
							<label for="<?php echo esc_attr( $multi_checkbox_id ); ?>">
								<input
									name="<?php echo esc_attr( $multi_checkbox_id ); ?>"
									id="<?php echo esc_attr( $multi_checkbox_id ); ?>"
									type="checkbox"
									class="<?php echo esc_attr( isset( $value['class'] ) ? $value['class'] : '' ); ?>"
									value="1"
									<?php checked( $multi_checkbox_option_value, 'yes' ); ?>
									<?php echo implode( ' ', $custom_attributes ); // WPCS: XSS ok. ?>
								/> <?php echo $multi_checkbox_title; // WPCS: XSS ok. ?>
							</label> <?php echo $tooltip_html; // WPCS: XSS ok. ?>
						<?php

  										?>
										</fieldset>
										<?php } ?>
									</td>
								</tr>
							<?php

						break;

					// Single page selects.
					case 'single_select_page':
						$args = array(
							'name'             => $value['id'],
							'id'               => $value['id'],
							'sort_column'      => 'menu_order',
							'sort_order'       => 'ASC',
							'show_option_none' => ' ',
							'class'            => $value['class'],
							'echo'             => false,
							'selected'         => absint( self::get_option( $value['id'], $value['default'] ) ),
							'post_status'      => 'publish,private,draft',
						);

						if ( isset( $value['args'] ) ) {
							$args = wp_parse_args( $value['args'], $args );
						}

						?>
						<tr valign="top" class="single_select_page">
							<th scope="row" class="titledesc">
								<label><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp">
								<?php echo str_replace( ' id=', " data-placeholder='" . esc_attr__( 'Select a page&hellip;', 'yatra' ) . "' style='" . $value['css'] . "' class='" . $value['class'] . "' id=", wp_dropdown_pages( $args ) ); // WPCS: XSS ok. ?> <?php echo $description; // WPCS: XSS ok. ?>
							</td>
						</tr>
						<?php
						break;

						case 'tab_repeator':

							$default = $value['default'] ?? array();

							$repeator_value =   self::get_option( $value['id'], $default );

                            if(isset($value['value_callback'])){
                                if(is_callable($value['value_callback'])){
                                    $repeator_value = call_user_func($value['value_callback']);
                                }
                            }
							$repeator_value= is_array($repeator_value) ? $repeator_value : array();
							$all_tab_configs = yatra_tour_tab_default_configurations();
							$all_tab_keys = array_keys($all_tab_configs);


							?>
						<tr valign="top" class="single_select_page">
							<th scope="row" class="titledesc">
                            <label><?php echo esc_html( $value['title'] ); ?> <?php echo $tooltip_html; // WPCS: XSS ok. ?></label>
							</th>
							<td class="forminp">
								<div class="yatra-setting-tab-options">

								<?php
								if(count($repeator_value)>0){
									echo '<ul
									data-icon-name="'.esc_attr( $value['id'] ).'[TAB_INDEX][icon]"
									data-label-name="'.esc_attr( $value['id'] ).'[TAB_INDEX][label]"
									data-type-name="'.esc_attr( $value['id'] ).'[TAB_INDEX][type]"
									data-visibility-name="'.esc_attr( $value['id'] ).'[TAB_INDEX][visibility]"
									>';
								}


								foreach($repeator_value as $rep_key=> $rep_val){

									$rep_val['type']=$rep_val['type'] ?? $rep_key;
									$rep_val['visibility']=isset($rep_val['visibility']) ?(boolean)$rep_val['visibility']: 0;
                                    echo '<li data-tab-type="'.esc_attr($rep_key).'">';
									echo '<span class="label '.esc_attr($rep_val['icon']).'">'.esc_html($rep_val['label']).'</span>';
									?>
									<input type="text" class="yatra_frontend_tabs_available_options_label" name="<?php echo esc_attr( $value['id'] ); ?>[<?php echo esc_attr($rep_key); ?>][label]" value="<?php echo esc_attr($rep_val['label']) ?>"/>
									<input class="yatra_frontend_tabs_available_options_icon icopick" type="text" name="<?php echo esc_attr( $value['id'] ); ?>[<?php echo esc_attr($rep_key); ?>][icon]" value="<?php echo esc_attr($rep_val['icon']) ?>"/>
                                    <label class="yatra-switch-control">
                                    <input class="widefat" id="<?php echo esc_attr( $value['id'] ); ?>[<?php echo esc_attr($rep_key); ?>][visibility]" name="<?php echo esc_attr( $value['id'] ); ?>[<?php echo esc_attr($rep_key); ?>][visibility]" type="checkbox" value="1" <?php checked(1, $rep_val['visibility']) ?>>
                                    <span class="slider round" data-on="show" data-off="hide"></span>
                                    </label>
									<input  type="hidden" name="<?php echo esc_attr( $value['id'] ); ?>[<?php echo esc_attr($rep_key); ?>][type]" value="<?php echo esc_attr($rep_val['type']) ?>"/>
									<span>
									<?php if(!in_array($rep_val['type'], $all_tab_keys)){ ?>
									<button type="button" class="available-tab-remove-item">x</button>
									<?php }
									echo '</span>';
									echo '</li>';
 								}
								if(count($repeator_value)>0){
									echo '</ul>';
								}
								?>
									<button type="button" class="button" id="yatra-setting-tab-option-add-new-tab"><?php echo __( 'Add New', 'yatra' ) ?></button>
								</div>
							</td>
						</tr>
						<?php
						break;



					// Default: run an action.
					default:
						do_action( 'yatra_admin_field_' . $value['type'], $value );
						break;
				}
			}
		}

		/**
		 * Helper function to get the formatted description and tip HTML for a
		 * given form field. Plugins can call this when implementing their own custom
		 * settings types.
		 *
		 * @param  array $value The form field value array.
		 * @return array The description and tip as a 2 element array.
		 */
		public static function get_field_description( $value ) {
			$description  = '';
			$tooltip_html = '';

			if ( true === $value['desc_tip'] ) {
				$tooltip_html = $value['desc'];
			} elseif ( ! empty( $value['desc_tip'] ) ) {
				$description  = $value['desc'];
				$tooltip_html = $value['desc_tip'];
			} elseif ( ! empty( $value['desc'] ) ) {
				$description = $value['desc'];
			}

			if ( $description && in_array( $value['type'], array( 'textarea', 'radio' ), true ) ) {
				$description = '<p style="margin-top:0">' . wp_kses_post( $description ) . '</p>';
			} elseif ( $description && in_array( $value['type'], array( 'checkbox' ), true ) ) {
				$description = wp_kses_post( $description );
			} elseif ( $description ) {
				$description = '<span class="description">' . wp_kses_post( $description ) . '</span>';
			}

			if ( $tooltip_html && in_array( $value['type'], array( 'checkbox' ), true ) ) {
				$tooltip_html = yatra_tippy_tooltip($tooltip_html, false);
			} elseif ( ''!==$tooltip_html ) {
				$tooltip_html = yatra_tippy_tooltip($tooltip_html, false);
			}

			return array(
				'description'  => $description,
				'tooltip_html' => $tooltip_html,
			);
		}

		/**
		 * Save admin fields.
		 *
		 * Loops though the yatra options array and outputs each field.
		 *
		 * @param array $options Options array to output.
		 * @param array $data    Optional. Data to use for saving. Defaults to $_POST.
		 * @return bool
		 */
		public static function save_fields( $options, $data = null ) {
			if ( is_null( $data ) ) {
				$data = $_POST; // WPCS: input var okay, CSRF ok.
			}
			if ( empty( $data ) ) {
				return false;
			}

			// Options to update will be stored here and saved later.
			$update_options   = array();
			$autoload_options = array();

			// Loop options and get values to save.
			foreach ( $options as $option ) {
				if ( ! isset( $option['id'] ) || ! isset( $option['type'] ) ) {
					continue;
				}

				// Get posted value.
				if ( strstr( $option['id'], '[' ) ) {
					parse_str( $option['id'], $option_name_array );
					$option_name  = current( array_keys( $option_name_array ) );
					$setting_name = key( $option_name_array[ $option_name ] );
					$raw_value    = isset( $data[ $option_name ][ $setting_name ] ) ? wp_unslash( $data[ $option_name ][ $setting_name ] ) : null;
				} else {
					$option_name  = $option['id'];
					$setting_name = '';
					$raw_value    = isset( $data[ $option['id'] ] ) ? wp_unslash( $data[ $option['id'] ] ) : null;
				}

				// Format the value based on option type.
				switch ( $option['type'] ) {
					case 'checkbox':
						$value = '1' === $raw_value || 'yes' === $raw_value ? 'yes' : 'no';
						break;
                    case 'multicheckbox':
                        $multi_options = isset($option['options']) ? $option['options']: array();

                        $value  = array();

                        foreach($multi_options as $multi_option){

                            $multi_option_id = isset($multi_option['id']) ? $multi_option['id']: '';

                            if(isset($raw_value[$multi_option_id]) && !empty($multi_option_id)){

                                $value[$multi_option_id] = '1' === $raw_value[$multi_option_id] || 'yes' === $raw_value[$multi_option_id] ? 'yes' : 'no';
                            }

                        }

						break;
					case 'textarea':
						$value = wp_kses_post( trim( $raw_value ) );
						break;
					case 'select':
						$allowed_values = empty( $option['options'] ) ? array() : array_map( 'strval', array_keys( $option['options'] ) );
						if ( empty( $option['default'] ) && empty( $allowed_values ) ) {
							$value = null;
							break;
						}
						$default = ( empty( $option['default'] ) ? $allowed_values[0] : $option['default'] );
						$value   = in_array( $raw_value, $allowed_values, true ) ? $raw_value : $default;
						break;
					case 'tab_repeator':

						$value = array();

						$all_tab_configs = yatra_tour_tab_default_configurations();

						$raw_value = is_array($raw_value) ? $raw_value: array();

						if(count($raw_value)<6){

							$raw_value = $all_tab_configs;
						}

						$all_available_type = array_keys($all_tab_configs);

						array_push($all_available_type, 'text');

						foreach($raw_value as $raw_index => $raw_single_value){

							$type = $raw_single_value['type'] ?? $raw_index;

							if(in_array($type, $all_available_type)){
								$final_value= array();
								$final_value['icon']= isset($raw_single_value['icon']) ? sanitize_text_field($raw_single_value['icon']): '';
								$final_value['type']= $type;
								$final_value['label']=isset($raw_single_value['label']) ? sanitize_text_field($raw_single_value['label']): '';
								$final_value['visibility']=isset($raw_single_value['visibility'])  &&  boolval($raw_single_value['visibility']);
 								$value[$raw_index]=$final_value;
						}}
						break;
					default:
						$value = sanitize_text_field( $raw_value );
						break;
				}


				/**
				 * Sanitize the value of an option.
				 *
				 * @since 2.4.0
				 */
				$value = apply_filters( 'yatra_admin_settings_sanitize_option', $value, $option, $raw_value );

				/**
				 * Sanitize the value of an option by option name.
				 *
				 * @since 2.4.0
				 */
				$value = apply_filters( "yatra_admin_settings_sanitize_option_$option_name", $value, $option, $raw_value );

				if ( is_null( $value ) ) {
					continue;
				}

				// Check if option is an array and handle that differently to single values.
				if ( $option_name && $setting_name ) {
					if ( ! isset( $update_options[ $option_name ] ) ) {
						$update_options[ $option_name ] = get_option( $option_name, array() );
					}
					if ( ! is_array( $update_options[ $option_name ] ) ) {
						$update_options[ $option_name ] = array();
					}
					$update_options[ $option_name ][ $setting_name ] = $value;
				} else {
					$update_options[ $option_name ] = $value;
				}

				$autoload_options[ $option_name ] = isset( $option['autoload'] ) ? (bool) $option['autoload'] : true;


				do_action( 'yatra_update_option', $option );
			}

			// Save all options in our array.
			foreach ( $update_options as $name => $value ) {
				update_option( $name, $value, $autoload_options[ $name ] ? 'yes' : 'no' );
			}

			return true;
		}

		/**
		 * Checks which method we're using to serve downloads.
		 *
		 * If using force or x-sendfile, this ensures the .htaccess is in place.
		 */
		public static function check_download_folder_protection() {
			$upload_dir      = wp_upload_dir();
			$downloads_url   = $upload_dir['basedir'] . '/yatra';
			$download_method = get_option( 'yatra_file_download_method' );

			if ( 'redirect' === $download_method ) {

				// Redirect method - don't protect.
				if ( file_exists( $downloads_url . '/.htaccess' ) ) {
					unlink( $downloads_url . '/.htaccess' ); // @codingStandardsIgnoreLine
				}
			} else {

				// Force method - protect, add rules to the htaccess file.
				if ( ! file_exists( $downloads_url . '/.htaccess' ) ) {
					$file_handle = @fopen( $downloads_url . '/.htaccess', 'w' ); // @codingStandardsIgnoreLine
					if ( $file_handle ) {
						fwrite( $file_handle, 'deny from all' ); // @codingStandardsIgnoreLine
						fclose( $file_handle ); // @codingStandardsIgnoreLine
					}
				}
			}
		}
	}

endif;
