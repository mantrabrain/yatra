<?php
/**
 * Email footer template.
 */

$hide_powered_by = false;
?>
						<div class="footer">
							<?php
							if ( ! $hide_powered_by ) :
								?>
							<table width="100%">
								<tr>
									<td class="aligncenter content-block"><?php esc_html_e( 'Powered By:', 'yatra' ); ?> <a target="_blank" href="https://wpyatra.com"><?php esc_html_e( 'Yatra', 'yatra' ); ?></td>
								</tr>
							</table>
							<?php endif; ?>
						</div>
					</div>
				</td>
				<td></td>
			</tr>
		</table>
	</body>
</html>
<?php
