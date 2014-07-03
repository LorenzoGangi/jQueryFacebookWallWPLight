<?php
//if uninstall /delete not called from WordPress then exit
if( ! defined ( 'ABSPATH' ) && ! defined( 'WP_UNINSTALL_PLUGIN' ) )
	exit();

//delete options array from options table
delete_option('jfw_options');
?>