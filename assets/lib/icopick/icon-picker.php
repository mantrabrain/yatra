<?php
if (!class_exists('WP_Customize_Control'))
	return;

/**
 * Class to create a custom tags control
 */
class Agency_Ecommerce_Customizer_Control_Icon_Picker extends WP_Customize_Control
{
	/**
	 * The type of control being rendered
	 */
	public $type = 'agency_ecommerce_icon_picker_control';

	/**
	 * Enqueue our scripts and styles
	 */
	public function enqueue()
	{

		$script_uri = AGENCY_ECOMMERCE_THEME_URI . 'core/customizer/controls/icon-picker/';
		$fs_script_uri = AGENCY_ECOMMERCE_THEME_URI . 'assets/lib/font-awesome/css/font-awesome.css';


		$icon_lists = array(
			'font_awesome' => array(
				'title' => esc_html__('Font Awesome', 'agency-ecommerce'),
				'icons' => agency_ecommerce_font_awesome_icon_list(),//apply_filters("agency_ecommerce_font_awesome_icon_lists", array())
			)
		);

		wp_enqueue_script('agency-ecommerce-icon-picker-control-js', $script_uri . 'icon-picker.js', array('jquery'), AGENCY_ECOMMERCE_THEME_VERSION, true);
		wp_localize_script('agency-ecommerce-icon-picker-control-js', 'agencyEcommerceAllIcons', $icon_lists);


		wp_register_style('agency-ecommerce-font-awesome', $fs_script_uri, array(), AGENCY_ECOMMERCE_THEME_VERSION);
		wp_enqueue_style('agency-ecommerce-icon-picker-control-css', $script_uri . 'icon-picker.css', array('agency-ecommerce-font-awesome'), AGENCY_ECOMMERCE_THEME_VERSION);


	}


	/**
	 * Render the control in the customizer
	 */
	public function render_content()
	{
		$default = isset($this->setting->default) ? $this->setting->default : '';
		?>
		<div class="agency-ecommerce-icon-picker-control">
			<?php
			if (!empty($this->label)) {
				echo '<span class="customize-control-title">' . esc_html($this->label) . '</span>';
			}
			if (!empty($this->description)) {
				echo '<span class="description customize-control-description">' . esc_html($this->description) . '</span>';
			}
			?>
			<div class="agency-ecommerce-icon-picker-control-field">
				<span class="icon-show <?php echo esc_attr($this->value()) ?>"></span>
				<input type="text"
					   id="<?php echo esc_attr($this->id); ?>"
					   name="<?php echo esc_attr($this->id); ?>"
					   value="<?php echo esc_attr($this->value()); ?>"
					   class="customize-control-icon-picker-value" <?php $this->link(); ?>
					   placeholder="Click here to pick an icon"
					   readonly
				/>
				<span class="icon-clear dashicons dashicons-trash"></span>

			</div>

		</div>
		<?php
	}
}
