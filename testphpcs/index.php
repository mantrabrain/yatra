<?php
/**
 * Gets the email message from the user's mailbox to add as
 * a WordPress post. Mailbox connection information must be
 * configured under Settings > Writing
 *
 * @package WordPress
 */

/**
 * Prints signup_header via wp_head.
 *
 * @param int    $test_var Sample Variable.
 * @param string $required_var any type of variable.
 * @return string string return garcha.
 */
function yatra_wow( $test_var = 1, $required_var ) {
	return 'Hello World' . $test_var . $required_var;
}
