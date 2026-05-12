/**
 * Yatra Page Content — block-editor registration.
 *
 * A dynamic, server-rendered block. PHP owns the front-end output via
 * Yatra\Core\Template\FseTemplates::renderPageContentBlock(). The editor
 * needs its own registration so the block:
 *   - Appears in the inserter / list view.
 *   - Renders a recognisable placeholder while editing a template.
 *   - Doesn't trigger the "Your site doesn't include support for the
 *     yatra/page-content block" warning when parsed from saved templates.
 *
 * No build step: this file is enqueued directly as a classic script that
 * uses the wp.* globals provided by the editor.
 */
( function ( wp ) {
	if ( ! wp || ! wp.blocks || ! wp.element ) {
		return;
	}
	if ( wp.blocks.getBlockType && wp.blocks.getBlockType( 'yatra/page-content' ) ) {
		return; // Already registered — avoid duplicate-registration console errors.
	}

	var el = wp.element.createElement;
	var __ = ( wp.i18n && wp.i18n.__ ) ? wp.i18n.__ : function ( s ) { return s; };
	var useBlockProps =
		wp.blockEditor && wp.blockEditor.useBlockProps
			? wp.blockEditor.useBlockProps
			: function () { return {}; };

	wp.blocks.registerBlockType( 'yatra/page-content', {
		apiVersion: 2,
		title: __( 'Yatra Page Content', 'yatra' ),
		description: __(
			'Renders the current Yatra page (single trip, listing, booking, etc.) based on the request route.',
			'yatra'
		),
		category: 'theme',
		icon: 'admin-site-alt3',
		keywords: [ 'yatra', 'trip', 'booking', 'page' ],
		supports: {
			html: false,
			reusable: false,
			inserter: true,
			multiple: false,
		},
		attributes: {
			template: { type: 'string', default: '' },
		},
		edit: function ( props ) {
			var template = ( props.attributes && props.attributes.template ) || '';
			var label = template
				? __( 'Yatra Page Content', 'yatra' ) + ' — ' + template
				: __( 'Yatra Page Content', 'yatra' );

			return el(
				'div',
				useBlockProps( {
					className: 'yatra-page-content-placeholder',
					style: {
						padding: '24px',
						border: '1px dashed #c3c4c7',
						background: '#f6f7f7',
						color: '#50575e',
						textAlign: 'center',
						fontFamily:
							'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
					},
				} ),
				el(
					'strong',
					{ style: { display: 'block', marginBottom: '6px' } },
					label
				),
				el(
					'span',
					{ style: { fontSize: '13px' } },
					__(
						'Rendered on the front-end based on the current route. No editor preview.',
						'yatra'
					)
				)
			);
		},
		save: function () {
			// Dynamic block — render handled by PHP render_callback.
			return null;
		},
	} );
} )( window.wp );
