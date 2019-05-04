<?php
/**
 * Template part for displaying posts
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 * @since Yatri 1.0.0
 */
?>
<?php $class = ''; ?>
<?php yatri_get_option( 'archive_post_layout' ) == 'grid' ? $class = 'masonry-grid' : $class = 'masonry-grid wrap-post-list'; ?>
<div class="<?php echo esc_attr( $class ); ?>">
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'single-post-wrap' ); ?>>
		<?php $align_class = ''; ?>
		<?php if( yatri_get_option( 'archive_post_image_alignment' ) == 'left' ){
			$align_class = 'text-left';
		}elseif( yatri_get_option( 'archive_post_image_alignment' ) == 'right' ){
			$align_class = 'text-right';
		}else {
			$align_class = 'text-center';
		}
		?>

		<?php
		if( yatri_get_option( 'archive_post_image' ) == 'thumbnail' ){
			$size = 'thumbnail';
		}elseif( yatri_get_option( 'archive_post_image' ) == 'medium'){
			$size = 'medium';
		}elseif( yatri_get_option( 'archive_post_image' ) == 'large'){
			$size = 'large';
		}else {
			$size = 'yatri-1170-710';
		}
		$args = array(
			'size' => $size,
			);

				# Disabling dummy thumbnails when its in search page, also support for jetpack's infinite scroll
		if( 'post' != get_post_type() && yatri_is_search() ){
			$args[ 'dummy' ] = false;
		}

		yatri_post_thumbnail( $args );
		?>
			<div class="post-content">
				<?php if( 'post' == get_post_type() ): ?>
					<div class="post-format-outer">
						<span class="post-format">
							<span class="kfi <?php echo esc_attr( yatri_get_icon_by_post_format() ); ?>"></span>
						</span>
					</div>
				<?php endif; ?>
				<?php 
					if('post' == get_post_type() ){ 
				?>
				<div class="meta">
					<div class="meta-cat">
						<?php
						$cat = yatri_get_the_category();
						if( $cat ):
							?>
						<span class="cat">
							<?php
							$term_link = get_category_link( $cat[ 0 ]->term_id );
							?>
							<a href="<?php echo esc_url( $term_link ); ?>">
								<?php echo esc_html( $cat[0]->name ); ?>
							</a>
						</span>
						<?php
						endif;
						?>
					</div>
				</div>
				<?php } ?>
				<header class="post-title">
					<h3>
						<a href="<?php the_permalink(); ?>">
							<?php echo get_the_title(); ?>
						</a>
					</h3>
				</header>
					<?php 
						if('post' == get_post_type() ){ 
					?>
						<div class="meta">
							<div class="meta-date">
								<a href="<?php echo esc_url( yatri_get_day_link() ); ?>" class="date">
									<span class="day">
									<?php
										echo esc_html(get_the_date('M j, Y')); ?>
									</span>
								</a>
							</div>
							<div class="meta-author">
								<span class="author-name">
									<a href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>">
										<?php echo get_the_author(); ?>
									</a>
								</span>
							</div>
							<div class="meta-comment">
								<span class="comment-link">
									<a href="<?php comments_link(); ?>">
										<?php echo absint( wp_count_comments( get_the_ID() )->approved ); ?>
									</a>
								</span>
							</div>
						</div>
					<?php } ?>
					<div class="post-text"><?php yatri_excerpt( 15, true ); ?></div>
					<div class="button-container">
						<a href="<?php the_permalink(); ?>" class="button-text">
							<?php esc_html_e( 'Learn More', 'yatri' ); ?>
						</a>
					</div>
				</div>
			</article>
		</div>
