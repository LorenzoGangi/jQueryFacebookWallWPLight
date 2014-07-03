// Create the jQueryFacebookWallLight instance
jQuery(document).ready(function($){
	$('.jfw-light-facebook-wall').jQueryFacebookWallLight({
		appId: scriptParams.appId,
		domain: scriptParams.domain,
		installDirectory: scriptParams.installDirectory, 
		facebookUser: scriptParams.facebookUser,
		display: scriptParams.display,
		//language: scriptParams.language,                  
		posts:{
			feedType: scriptParams.posts_feedType,    	          
		}
	});
	
	function stringToBoolean(string){
		switch(string.toLowerCase()){
			case "true": case "yes": case "1": return true;
			case "false": case "no": case "0": case null: return false;
			default: return Boolean(string);
		}
	}

});