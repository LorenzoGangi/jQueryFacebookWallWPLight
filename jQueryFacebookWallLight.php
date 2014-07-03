<?php
/*
Plugin Name: jQueryFacebookWallLight
Plugin URI: http://ironlasso.com/jQueryFacebookWallLight-WordPress-Plugin
Description: You always wanted to. Now you can. jQueryFacebookWallLight is a jQuery plugin that lets you add facebook wall feed to any page on your website. 
             It’s as easy, the jQuery Facebook Wall plugin provides you all the tools you’ll need to add wall or timeline style facebook feed in minutes.
Version: 1.0
Author: Lorenzo Gangi
Author URI: http://ironlasso.com

------------------------------------------------------------------------
Copyright Lorenzo Gangi lorenzogangi@gmail.com

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

/*ACTION HOOKS*************************************************************************************************/

// Call function when the plugin is activated
register_activation_hook(__FILE__,'jfw_light_install');

// Action hook to initialize the plugin
add_action('admin_init', 'jfw_light_init');

// Action hook to register our option settings
add_action('admin_init', 'jfw_light_register_settings');

// Action hook to add the jQueryFacebookWallLight menu item
add_action('admin_menu', 'jfw_light_menu');

//Action hook to create the  jQueryFacebookWallLight shortcode
add_shortcode('jfw_light', 'jfw_light_shortcode');

//Action hook to add WP-admin js and css
add_action( 'admin_enqueue_scripts', 'jfw_light_admin_plugin_scripts' );

//Action hook to add js and css to page
add_action( 'wp_enqueue_scripts', 'jfw_light_plugin_scripts' );

$plugin = plugin_basename( __FILE__ );
add_filter( "plugin_action_links_$plugin", 'jfw_light_plugin_add_settings_link' );


/*FUNTIONS********************************************************************************************************/

/* @name: jfw_light_admin_plugin_scripts() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: add the jQueryFacebookWallLight js and css to wordpress wordpress admin
 */
function jfw_light_admin_plugin_scripts($hook) {
	
	
		
		//make sure we only load the jfw js and css for it own settings page
		if( 'settings_page_jQueryFacebookWallWPLight/jQueryFacebookWallLight' != $hook ){
        	return;
		}
		
		//add the validation js and css
		wp_register_style( 'jfw-light-admin-validation-style', plugins_url() . '/jQueryFacebookWallWPLight/css/validationEngine.jquery.css');
		wp_enqueue_style( 'jfw-light-admin-validation-style');
		
		wp_register_script('jfw-light-admin-validation-script-language', plugins_url() . '/jQueryFacebookWallWPLight/js/jquery.validationEngine-en.js', array('jquery', ), '1.0.0', true );
		wp_enqueue_script( 'jfw-light-admin-validation-script-language' );	
		
		wp_register_script('jfw-light-admin-validation-script', plugins_url() . '/jQueryFacebookWallWPLight/js/jquery.validationEngine.js', array('jquery', 'jfw-light-admin-validation-script-language'), '1.0.0', true );
		wp_enqueue_script( 'jfw-light-admin-validation-script' );
		
		//add the admin js and css
		wp_register_style( 'jfw-light-admin-style', plugins_url() . '/jQueryFacebookWallWPLight/css/jQueryFacebookWallWPLight-admin.css');
		wp_enqueue_style( 'jfw-light-admin-style');
			
		wp_register_script('jfw-light-admin-script', plugins_url() . '/jQueryFacebookWallWPLight/js/jQueryFacebookWallWPLight-admin.js', array('jquery','jfw-light-admin-validation-script'), '1.0.0', true );
		wp_enqueue_script( 'jfw-light-admin-script' );
		
		//set plugin path in the js for retrieving the accesstoeknt
        $script_params = array('pluginPath'=>plugins_url());
        wp_localize_script( 'jfw-light-admin-script', 'scriptParams', $script_params );	

}

/* @name: jfw_light_plugin scripts() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: add the jQueryFacebookWallLight js and css to wordpress
 */
function jfw_light_plugin_scripts() {
	
	
		
		//register and que up the plugin styles and js after jquery is loaded.
		$jfw_light_options = get_option('jfw_light_options');
		if($jfw_light_options['use_minified']=='true'){
			
			wp_register_style( 'jfw-light-style', plugins_url() . '/jQueryFacebookWallWPLight/css/jQueryFacebookWallLight.min.css');
			wp_enqueue_style( 'jfw-light-style');
			
			wp_register_script('jfw-light-script', plugins_url() . '/jQueryFacebookWallWPLight/js/jQueryFacebookWallLight.min.js', array('jquery'), '1.0.0', true );
			wp_enqueue_script( 'jfw-light-script' );
		}
		else{
			wp_register_style( 'jfw-light-style', plugins_url() . '/jQueryFacebookWallWPLight/css/jQueryFacebookWallLight.css');
			wp_enqueue_style( 'jfw-light-style');
			
			wp_register_script('jfw-light-languages-script',  plugins_url() . '/jQueryFacebookWallWPLight/js/languages.js', array('jquery'), '1.0.0', true );
			wp_enqueue_script( 'jfw-light-languages-script' );
			wp_register_script('jfw-light-ejs-script',  plugins_url() . '/jQueryFacebookWallWPLight/js/ejs.js', array('jquery'), '1.0.0', true );
			wp_enqueue_script( 'jfw-light-ejs-script' );
			wp_register_script('jfw-light-script', plugins_url() . '/jQueryFacebookWallWPLight/js/jQueryFacebookWallLight.js', array('jquery','jfw-light-ejs-script'), '1.0.0', true );
			wp_enqueue_script( 'jfw-light-script' );
		}
		
	
}

/* @name: jfw_light_plugin scripts() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: Add a settings link to the plugin page
 */
function jfw_light_plugin_add_settings_link( $links ) {
	$settings_link = '<a href="options-general.php?page=jQueryFacebookWallWPLight/jQueryFacebookWallLight.php">Settings</a>';
	array_push( $links, $settings_link );
	return $links;
}

/* @name: jfw_light_install() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: wordpress plugin install function
 */
function jfw_light_install(){
	
	//check the wordpress version
	global $wp_version;
	if(version_compare($wp_version, "3.5", "<")){
		deactivate_plugins(basename(__FILE__)); //deactivate the plugin
		wp_die("jQueryFacebookWallLight requires WordPress version 3.5 or higher.");
	}
	
	//setup default option values
	$jfw_light_options_arr = array(
						   "appIdz"=> false,
						   "domain"=> false,      
						   "installDirectory"=>  plugins_url()."/jQueryFacebookWallWPLight/", 
						   "facebookUser"=> "natgeo", 
						   "display"=> "timeline", 
						   "posts_feedType"=> "feed", 
						   "debug"=> false,  
						   "use_minified"=> 'true',
						     
					   );
	
	//save default option values
	update_option('jfw_light_options', $jfw_light_options_arr);
	
	//create a place to store the access token
	
	//store the access token	
}//end jfw_light_install()

/* @name: jfw_light_menu() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: Build the wordpress admin menu for jQueryFacebookWallLight
 */
function jfw_light_menu(){
	
	add_options_page(__('jQueryFacebookWallLight Settings Page', 'jfw-light-plugin'),
	                 __('jQueryFacebookWallLight', 'jfw_light_plugin'), 
					 'administrator',
					  __FILE__, 
					  'jfw_light_settings_page'
					);

}//end jfw_light_menu();

/* @name: jfw_light_init() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: initialize the plugin
*/ 
function jfw_light_init(){
	//init function incase there ever needs to be one.
}//end jfw_light_init()

/* @name: jfw_light_shortcode() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: register the jQueryFacebookWallLight Shortcodes
 */
function jfw_light_shortcode($atts, $contect = null){
	global $post;
	extract(shortcode_atts(
	                       array(
							  "show"=> ''
	                       ), 
			$atts));
	
	if($show == 'jQueryFacebookWallLight'){
		$jfw_light_show = "<div class='jfw-light-facebook-wall'></div>";
		
		//enqueue the plugin instance js code
		wp_register_script('jfw-light-plugin-instance', plugins_url().'/jQueryFacebookWallWPLight/js/jQueryFacebookWallLightInline.js', array('jquery', 'jfw-light-script'), '1.0.0', true);
        wp_enqueue_script( 'jfw-light-plugin-instance' );

		//set the instance options with the stored plugin setting
        $script_params = get_option('jfw_light_options');
        wp_localize_script( 'jfw-light-plugin-instance', 'scriptParams', $script_params );	
	}
	
	return $jfw_light_show;
	
}//end jfw_light_shortcode()


/* @name: jfw_light_register_settings() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: register settings for the plugin
 */
function jfw_light_register_settings(){
	
	//register our array of settings
	register_setting('jfw-light-settings-group', 'jfw_light_options');

}//end jfw_light_register_settings

/* @name: jfw_light_settings_page() 
 * @author: lorenzo gangi lorenzo@ironlasso.com
 * @desc: make the setting page for the plugin
 */
function jfw_light_settings_page(){

	//load the options array
	$jfw_light_options = get_option('jfw_light_options');
	
	$appId = $jfw_light_options['appId'];
	$domain = $jfw_light_options['domain'];
	$installDirectory = $jfw_light_options['installDirectory'];
	$facebookUser = $jfw_light_options['facebookUser'];
	$display = $jfw_light_options['display'];
	$posts_feedType = $jfw_light_options['posts_feedType'];
	
	
	$myFile = plugins_url()."/jQueryFacebookWallWPLight/fb_app_token.html";
	$fh = fopen($myFile, 'r');
	$theData = fgets($fh);
	$hide = false;
	if($theData !== '{"appToken":"If you see this you havn\'t generated your app token yet"}'){
		$hide= true	;
	}
	fclose($fh);
   
?>
  
    <div class="jfw-light-settings-wrap">
        <h2><?php _e('jQueryFacebookWallLight Settings', 'jfw-light-plugin'); ?></h2>
            <table class='form-table'>
                <tr><th colspan="2"><h2>Facebook Access Token</h2></th></tr>
                <tr>
                	<th><?php _e('Access Token','jfw-light-plugin') ?></th>
                    <td>
						<div class="access-token"><?php print $theData ?></div>
                    	
                        <form id="access-token-form">
                            <label for="app_id">App ID</label><input name="app_id" id="app_id" class="validate[required]" />
                            <br />
                            <label for="app_secret">App Secret</label><input name="app_secret" id="app_secret" class="validate[required]" />
                            <br />
                            <input type="button" id="generate_app_token" value="Retrieve Facebook App Access Token" />
                      	</form>
                    </td> 
                </tr>
             </table>
             <form id="jfw-light-settings-form" method="post" action="options.php"> 
				<?php settings_fields('jfw-light-settings-group'); ?>
                <table class='form-table'>
                    <tr><th colspan="2"><h2>GENERAL</h2></th></tr>
                   
                        <tr valign="top">
                            <th scope="row"><?php _e('Domain','jfw-light-plugin') ?>*</th>
                            <td><input type="text" name="jfw_light_options[domain]" id="domain" class="validate[required]"  value="<?php ((isset($domain))? print $domain : print "ironlasso.com"); ?>"  /></td>
                            <th scope="row"><?php _e('Display Style','jfw-light-plugin') ?></th>
                            <td>
                                <select type="text" name="jfw_light_options[display]"  >
                                    <option value="timeline" <?php if($display == 'timeline'){print "selected";}?>>Timeline</option>
                                    <option value="single-column" <?php if($display == 'single-column'){print "selected";}?>>Single Column</option>
                                </select>
                            </td>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><?php _e('Intallation Directory','jfw-light-plugin') ?>*</th>
                            <td><input type="text" name="jfw_light_options[installDirectory]" class="validate[required]"  value="<?php ((isset($installDirectory))? print $installDirectory : print "/wp-content/plugins/jQueryFacebookWallWPLight/"); ?>"/></td>
                            <th></th>
                            <td></td>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><?php _e('Facebook User','jfw-light-plugin') ?>*</th>
                            <td><input type="text" name="jfw_light_options[facebookUser]" class="validate[required]"  value="<?php ((isset($facebookUser))? print $facebookUser : print "natgeo"); ?>"  /></td>
                            <th></th>
                            <td></td>
                        </tr>
                        <tr valign="top">
                           
                            <th><?php _e('Facebook App ID','jfw-light-plugin') ?>*</th>
                            <td><input type="text" name="jfw_light_options[appId]" class="validate[required]"  value="<?php ((isset($appId))? print $appId : print "Enter your App Id"); ?>"  /></td> 
                            
                            
                        </tr>
                       
                       
                      
                       
                        <tr valign="top">
                            <th scope="row"><?php _e('Posts Feed Type','jfw-light-plugin') ?></th>
                            <td>
                                <select type="text" name="jfw_light_options[posts_feedType]"  >
                                    <option value="feed" <?php if($posts_feedType == 'feed'){print "selected";}?>>Feed</option>
                                    <option value="posts" <?php if($posts_feedType == 'posts'){print "selected";}?>>Posts</option>
                                </select>
                            </td>
                            <th scope="row"></th>
                            <td></td>
                        </tr>
                        
                        
                      
                         
                        <tr class="submit">
                        <td>
                        <input type="submit" class="button-primary" id="jfw-light-settings-submit-button" value="<?php _e('Save jQueryFacebookWallLight Settings', 'jfw-light-plugin'); ?>" />
                        </td>
                        </tr>	
                    </table>	
			</form>		
    </div>
<?php
}//end jfw_light_settings_page
?>