/*
jQuery Facebook Wall WP-admin javascript
*/
jQuery(document).ready(function($){
	//form validtion for settings
	$("#access-token-form").validationEngine('attach');
	$("#jfw-settings-form").validationEngine('attach');
			
	//App Token Generation
	$('#generate_app_token').click(function(){
		if($("#access-token-form").validationEngine('validate')){
			//show the spinner 
			var spinner = $('.jfw-data-load')
				spinner.show();
			
			var app_id = null;
			var app_secret = null
			
			app_id = $('#app_id').val();
			app_secret =  $('#app_secret').val();
			
			$.ajax({
				url: scriptParams.pluginPath+"/jQueryFacebookWallWPLight/fb_get_app_token.php",
				data: {
					app_id: app_id,
					app_secret: app_secret,
					debug: false
				},
				dataType: "text"
					
			}).done(function(data){
				// update the app token displayed to the user	
				$('.access-token').text('{"appToken":"'+data+'"}');
				spinner.hide();
			}).error(function(data){
				alert('There was a problem generating you access token. Please double check you App id and secret and try again.');
				spinner.hide();	
			});
		}//end validation
	});
	
	//Show / Hide the acces token form
	$('.access-token-form-link').click(function(){
		$(this).css('display','none');
		var $form = $('#access-token-form');
		if($form.css('display')=='none'){
			$form.css('display','block');	
		}
		else{
			$form.css('display','none');
		}	
	})
	
	
	
});