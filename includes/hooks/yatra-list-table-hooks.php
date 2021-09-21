<?php

class Yatra_List_Table_Hooks
{
	public function __construct()
	{
		add_filter('manage_edit-tour_columns', array($this, 'add_new_columns'));
		add_action('manage_tour_posts_custom_column', array($this, 'custom_columns'), 15, 2);

	}


	function add_new_columns($columns)
	{

		unset($columns['taxonomy-attributes']);

		array_splice($columns, 4, 0, array(
			'attributes' => __('Attributes', 'yatra')
		));
		return $columns;

	}

	function custom_columns($column)
	{
		global $post;

		$post_id = $post->ID;

		$tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);

		if (!is_array($tour_meta_custom_attributes)) {

			$tour_meta_custom_attributes = array();
		}

		foreach ($tour_meta_custom_attributes as $term_id => $content) {

			$term = get_term($term_id, 'attributes');

			$term_content = $term->name;

			if (isset($content['content'])) {
				$term_content .= " : <strong>" . esc_html($content['content']) . '</strong>';
			} else if ($content['shortcode']) {

				$term_content .= " : <strong>" . esc_html($content['shortcode']) . '</strong>';
			}

			echo $term_content . '<br/>';
		}


	}
}

new Yatra_List_Table_Hooks();
