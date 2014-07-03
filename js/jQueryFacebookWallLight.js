/*!
 * jQuery Facebook Wall Plugin
 * @author: Lorenzo Gangi lorenzo@ironlasso.com
 * @license: see /licensing/readme_license.txt
 * @copyright
 * @version 1.0
 */

(function( $ ){
	$.support.cors = true;
	
	/*default options ['possible','option','values']*/
	var defaults = {
		appId: false,        //facebook applicaton id see readme for how to get this
		domain: false,       //domain of where the plugin is installed, so facebook can authenticate
		installDirectory: '/jQueryFacebookWallLight/', //where the plugin lives relative to your web root
 		facebookUser: false, //your facebook account name
		display: 'timeline', //the display style of the wall, possible values are 'wall', 'timeline', 'single-column'
		language: 'english', //select language 'english', 'italiano', 'espanol', 'francais', 'svenska'
		
		posts:{
			show: true,
			feedType: 'feed', // ['feed','posts'] feed type defines if you would like to show the facebook users feed (include posts from other users) or posts (only posts from fb user)
			limit: 10,	      // number of posts to retrieve
			order: 5
		},
		debug:false     //turn console debugging info on or off
		
	};
	var $this={}
	var methods = {
		 
		 init : function( options ) {
		   
		   //set up jquery chaining	
		   return this.each(function(){ 
			 
			 $this = $(this); //set the local jquery obj
			 var tempDefaults = defaults;
			 $this.options = $.extend( true, tempDefaults, options ); //add the deafaults and user options to the plugin options, do a deep extend
			
			 //load the facebook js SDK
			 if($this.options.appId && $this.options.domain){
		   		_fbInitSDK();
		     }
		     else{
				alert('Error: Your appId or domain is not defined in your plugin declaration..')   
		     }
			 
			 var data = $this.data('jQueryFacebookWallLight');	 
			 // If the plugin hasn't been initialized yet, build plugin data under plugin namespace
			 if ( ! data ) {
			   
			   //Anything that needs to save state
			   $(this).data('jQueryFacebookWallLight', {
				   target : $this,		   //jquery wrapped element
				   options: $this.options, //list of all defualst and overriden optionss
				   feed: false,            //currently loaded json
			   	   currentUser:{},         //client facebook user info
				   app:{},				   //facebook app info
				   fbUserInfo: {},		   //wall feed tareget user info
				   photosData:{}			   //handy copy of all the photo data that has been loaded
			   });
			 }
		   	 
			 //set the language
			 jQFWlanguage.language = $this.options.language;
			 //add the localize function as an ejs helper so we can use it the template files
			 EJS.Helpers.prototype.localize = function(translation){ return jQFWlanguage.localize(translation); };
			 
			 //set the display type
			 $this.addClass('facebook-wall wall facebook-wall-clearfix')
			 if($this.options.display === 'timeline'){
				$this.removeClass('wall');	 
			 	$this.addClass('timeline');
			 }
			 if($this.options.display === 'single-column'){
				$this.removeClass('wall');	 
			 	$this.addClass('single-column');
			 }
			 
			 
			 //here's to the crazy guy in a cabin thats still using ie 7 or 8
			 var msVersion = navigator.userAgent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
			 if(msVersion){
			 var msie = msVersion[0].split(' ')[0];
				 if(msie){ 
				 	if (parseFloat(msVersion[1]) < 8){
						//ie7
						$this.addClass('fbw-ie7')		
					}
					else if (parseFloat(msVersion[1]) < 9){
						//ie7
						$this.addClass('fbw-ie8')		
					}
					
				 }
			 }
			 
			 //add the loading spinner
			 $this.append('<div class="fbw-wall-loading fbw-big-loading " />');
			 
			 //add the columns
			 $this.append($('<div class="fbw-left-column" />'));
			 if($this.options.display != 'single-column'){
			 	$this.append($('<div class="fbw-right-column" />'));
			 }
			 
		   	 //get thefacebook data, and build the wall
			 $this.jQueryFacebookWallLight('loadFbData');
			 
			 /*EVENT BINDINGS----------------------------------------------------------------------------------------------------------------------------------*/
		     
			 /* @name: test event
			  * @author: lorenzo gangi lorenzo@ironlasso.com
			  * @desc: test event binding with data beign passed
			  */
			 $this.delegate('click.jQueryFacebookWallLight',{temp:"this is some temp data"},methods.testmethodclick);
			 
			 /* @name: lightbox event
			  * @author: lorenzo gangi lorenzo@ironlasso.com
			  * @desc: user click an element with the lightbox class usually an image, will pop a light box
			  */
			 $this.on('click.jQueryFacebookWallLight','.jfw-lightbox-link',function(ev){
				
				var content = "<div>lightbox content</div>";
				var $target = $(ev.currentTarget)
				
				//see if its a album gallery, if it is build the gallery
				if($target.hasClass('album-cover-photo-wrapper')){
					//get the album photos and comments from fb
					$target.append('<div class="fbw-loading positioned"></div>');
					var albumData = $target.data('albumData')
					//get the album photos and comments from fb if they havn't been retrieved yet
					if(albumData.photos==undefined){
						var albumDataUrl = "https://graph.facebook.com/"+albumData.id+"/?access_token="+$this.data('jQueryFacebookWallLight').app.appToken+
										   "&fields=photos.fields(name,source,created_time,comments.fields(created_time,from,message,like_count))&callback=?"
						$.getJSON(albumDataUrl,function(photoData){
							$.each(photoData.photos.data,function(){
								this.created_time = _mysqlTimeStampToDate(this.created_time);
								if(this.comments){
									$.each(this.comments.data,function(){
										this.created_time = _fbTimeAgo(this.created_time);
									})
								}
							})
							$.extend(albumData, photoData);
							$.extend(albumData, {
								facebookUser:$this.data('jQueryFacebookWallLight').fbUserInfo,
								templatePath:$this.options.installDirectory
							});
							$this.data('jQueryFacebookWallLight').fbUserInfo
							content = new  EJS({url: $this.options.installDirectory+'templates/photoGallery.ejs'}).render(albumData);
							$target.find('.fbw-loading').remove();
							_popLightBox(content);	
						});
					}else{
						$.extend(albumData, {
							templatePath:$this.options.installDirectory
						});
						content = new  EJS({url: $this.options.installDirectory+'templates/photoGallery.ejs'}).render(albumData);
						$target.find('.fbw-loading').remove();
						_popLightBox(content);	
					}
				}
				else if($target.hasClass('photo-cover-photo-wrapper')){
				 	
					$target.append('<div class="fbw-loading positioned"></div>');
					var photosData = $this.data('jQueryFacebookWallLight').photosData
					$.extend(photosData,{
						startingIndex:$target.attr('data-index'),
						templatePath:$this.options.installDirectory		
					})
					content = new  EJS({url: $this.options.installDirectory+'templates/photoGallery.ejs'}).render(photosData);
					$target.find('.fbw-loading').remove();
					_popLightBox(content);
				} 
			 });
			 
			 /* @name: userInteractionLikeStory
			  * @author: lorenzo gangi lorenzo@ironlasso.com
			  * @desc: user clicks a like link in one of the posts
			  */
			 $this.on('click.jQueryFacebookWallLight','.user-interaction-like',function(ev){
			 	 $target = $(ev.target);
				 var objectId = $target.closest('.story').attr('data-id');
				 _userInteractionLike(objectId, $target);
			 });
			 	 
		   });//end chaining
		 },
		 
		 /*PUBLIC METHODS---------------------------------------------------------------------------------------------------------------------------------------*/
		 
		 /* @name: method-destroy()
		  * @author: lorenzo gangi lorenzo@ironlasso.com
		  * @desc: removes the plugin from the dom and cleans up all its data and bindings
		  */
		 destroy : function( ) {
		   return this.each(function(){
			 var $this = $(this);
			 var data = $this.data('jQueryFacebookWallLight');
			 // Namespacing FTW
			 data.target.unbind('.jQueryFacebookWallLight');
			 $this.removeData('jQueryFacebookWallLight');
			 $this.remove();
		   })
		 },
		 
		 /* @name: method - testmethodclick()
		  * @author: lorenzo gangi lorenzo@ironlasso.com
		  * @desc: public method event handler template
		  */
		 testmethodclick : function(event) {  
		 	console.log('test click')
			console.log(event.data.temp)
		 },
		 
		 /*@name: method - loadFbData()
		  *@author: lorenzo gangi lorenzo@ironlasso.com
		  *@desc: gets the facebook feed data json
		  */
		 loadFbData : function( ) { 
		 	
			//get the app token
			if(!$this.data('jQueryFacebookWallLight').app.appToken){
				//if there isnt a token saved in the plugin yet
				$.getJSON($this.options.installDirectory+'fb_app_token.html', function(data){
					$this.data('jQueryFacebookWallLight').app.appToken = data.appToken;
					_getFbData();
				});	
			}
			else{
				_getFbData();
			}
		 }
	  }//end methods
	
	/*PRIVATE METHODS------------------------------------------------------------------------------------------------------------------------------------------*/
	 
	
	 /*@name: _buildFBWall() 
	  * @author: lorenzo gangi lorenzo@ironlasso.com
	  * @desc: builds the facebook wall html (uses ejs templateing)
	  */
	  function _buildFbWall(feedData) { 

		//@debug
		if($this.options.debug){_debug('_buildFbWall: feed data',feedData);}
		
		var $leftColumn = $this.find('.fbw-left-column');
		
		//get the right column
		if($this.options.display == 'single-column'){
		 	$rightColumn  = $this.find('.fbw-left-column');
		}
		else{
		 	$rightColumn  = $this.find('.fbw-right-column');
		}
		
		var i = 0;
		var colOffset = 0;
		var leftColHeight = 0;
		var rightColHeight = 0;
		//calculate the height of the right column
		$rightColumn.find('.story').each(
			function(){
				rightColHeight+=$(this).height();
			}
		);
		
	
		$.each(feedData.data,function(){
			if($this.options.debug){console.log('_buildwall: feed data - post:'); console.log(this);}
			var storyData = this;
			
			var comments = storyData.comments
				
				//update the post data, time and photos
				storyData.created_time =  _fbTimeAgo(storyData.created_time);
				if(storyData.likes){ 
					storyData.likes.count =  _addCommas(storyData.likes.count);
				}
				if(storyData.message){
					storyData.message = _makeLinks(storyData.message);
				}
				if($this.data('jQueryFacebookWallLight').options.display === 'timeline'){
					//get the album size image, this may become dated and need to replaced by a graph call to the post object 
					if(storyData.picture!==undefined){
						storyData.picture = storyData.picture.substring(0, storyData.picture.length - 5)+'n.png';
					}
				}
				//update the number of comments in the story data to the total number of comments returned from fb
				//fb graph results can be inconsistent so the only way to assure the pagination controls are accurate is 
				//to manage them through the returned comments number not the comments count provided by fb
				//see https://developers.facebook.com/blog/post/478/
				if(storyData.comments){
					storyData.comments.count =  comments.data.length;
				}
				//make a post, and load the post template and dtaa 
				var storyHtml = new EJS({url: $this.options.installDirectory+'templates/story.ejs'}).render(storyData);
				
				//attach the post, so long as its not a shared story and it has a message
				//if((storyData.status_type!='shared_story') && storyData.message){
				if(storyData.message){
						//at this point we dont support shared stories, story.ejs would need and overhall and few more fields would need to be added to the feed request
					var $lastStory = '';
					if($this.options.display == 'timeline'){
						if(leftColHeight < rightColHeight){
							$leftColumn.append(storyHtml);
							$lastStory = $leftColumn.find('.story').last();
							addPostComments(storyData);
							var width = $leftColumn.find('.story').last().find('.story-picture').width()
							leftColHeight += $leftColumn.find('.story').last().height()+width; //aproximation to account for height of image that hasnt loaded
						}
						else{
							$rightColumn.append(storyHtml);
							$lastStory = $rightColumn.find('.story').last();
							$lastStory.find('.timeline-pointer-left').removeClass('timeline-pointer-left').addClass('timeline-pointer-right');
							addPostComments(storyData);
							var width = $rightColumn.find('.story').last().find('.story-picture').width();
							rightColHeight += $lastStory.height()+width; //aproximation to account for height of image that hasnt loaded
						}
					}
					else{
						$leftColumn.append(storyHtml);
						$lastStory = $leftColumn.find('.story').last();
						addPostComments(storyData);
					}
					
					
						
				}//end shared story check
			
				//add comments
					function addPostComments(storyData){
						if(storyData.comments){
							if($this.options.debug){_debug('_buildFbWall: adding Comments',comments);}
							//save the next page of comments url in the element
							$.each(comments.data,function(){
								this.created_time=_fbTimeAgo(this.created_time)
							})
							comments['showAtStart'] = 3
							var commentsHtml = new EJS({url: $this.options.installDirectory+'templates/comments.ejs'}).render(comments);
						
							//update comment counts
							$commentStats = $lastStory.find('.comment-stats');
							//if the number of comments is less than the show at start value 
							$commentCountCurrent = $commentStats.find('.comment-count-current')
							if(storyData.comments.data.length < 3){
								$commentCountCurrent.text(comments.data.length)
								$commentStats.find('.comments-view-more a').addClass('hide');
							}
							else{
								$commentCountCurrent.text(3)
							}
						
						}
						//attach the post
						var element = $this.find('.story[data-id='+storyData.id+'] .comments')
							element.append(commentsHtml);
							
							//save the next page of comments url in the element
							if(storyData.comments && comments.paging.next){
								element.data('commentsNextPage',comments.paging.next)
							}
						
						
					}	
						
		});//end each
		
		//_showWall();
	} 

	function _showWall(){
		
		var $leftColumn = $this.find('.fbw-left-column');
		
		//get the right column
		if($this.options.display == 'single-column'){
		 	$rightColumn  = $this.find('.fbw-left-column');
		}
		else{
		 	$rightColumn  = $this.find('.fbw-right-column');
		}
		
		$leftColumn.css('visibility','visible');
		$rightColumn.css('visibility','visible');
		$('.fbw-wall-loading').fadeOut();
	} 
	
	/*@name: _debug()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: debug wrapper funtion so I dont have to put console logs all over my code, can toggle in options
	*/
	function _debug(message, data, error){
		if(error!=undefined){
			console.log('jQuery Facebook Wall ERROR-------');
		}
		else{
			console.log('DEBUG MESSAGE--------------------');
		}
			console.log(message);
			console.log(data)
			console.log('---------------------------------');
	}
	
	/*@name: _getFbData()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: gets all the data from the facebook graph based on pulgin config
	*/
	function _getFbData(){
	
		var deferreds = [];
		var callbacks = [null,null,null,null,null,null];
		var index = []; 
		
		//get the feed target user info
		
		var userInfoUrl = "https://graph.facebook.com/"+$this.options.facebookUser+"/?access_token="+$this.data('jQueryFacebookWallLight').app.appToken+"&callback=?";
		deferreds[0] = $.getJSON(userInfoUrl);
		callbacks[0] = fbUserInfo;
		index[0] = 'fbUserInfo';
		
		
		
		var howmany = 1;
		
		
		//add the feed
		if($this.options.posts.show){
			var feedUrl = "https://graph.facebook.com/"+$this.options.facebookUser+"/"+$this.options.posts.feedType+"/?access_token="+$this.data('jQueryFacebookWallLight').app.appToken+
						  "&fields=id,comments.limit(3).fields(id,created_time,like_count,from,message),status_type,picture, full_picture, source, properties, name, caption, description, link, from,message,story,likes.summary(true),object_id,shares"+
						  "&limit=5&callback=?";
			deferreds.push($.getJSON(feedUrl));
			if(callbacks[$this.options.posts.order]){ howmany = 0; }
			callbacks.splice($this.options.posts.order, howmany, feed);
			index.push('feed');
		}
		
		//show the wall after all the other defereds have returned
		callbacks.push(function(){_showWall();})
		
		
		
		//go get all the data from fb
		$.when.apply($,deferreds).done(callbacks).fail(function(data){
			//@debug
			if($this.options.debug){_debug('_getFbData: failed to retrieve facebook data',data);}
		});	
		
		//fb data callbacks
		function feed(data){
			//find the index of feed data
			var i = $.inArray('feed',index);
			_buildFbWall(arguments[i][0]);
		}
		function fbUserInfo(dataUser){
			$this.data('jQueryFacebookWallLight').fbUserInfo=arguments[0][0];
		}
		
	}
	
	/*@name: _makeLinks()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: pareses incoming data and looks for http://, if it finds a 'foundlink' link it wraps it like so <a href='foundlink'>foundlink</a>
	* @params: data, string of data to be parsed
	*/
	function _makeLinks(data){
		var exp = /(\b(http?|https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
    	return data.replace(exp,"<a href='$1'>$1</a>"); 	
	}
	
	
	
	
	
	
	
	
	/*@name: _userInteractionLike()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: posts a like to facebook and adjusts wall interface accordingly
	* @params: objectId - id of the facebook object thats getting liked, $target jQuery wrapped dom element of link
	*/
	function _userInteractionLike(objectId, $target){
		//check to see if the user is logged in
		var loggedIn =  _fbAuthenticate();
		if(loggedIn){
			//@debug
			if($this.options.debug){console.log('_userInteractionLike: posting a like');}
			var liked = $target.hasClass('liked')
			var issueType = 'post';
			var linkText = jQFWlanguage.localize('Unlike');
			var i = 1;
			if(liked){ 
				issueType = 'delete';
				linkText = 'Like';
				i = -1; 
			}
			FB.api('/'+objectId+'/likes', issueType, function(response) {
			  if (!response || response.error) {
				if($this.options.debug){console.log('_userInteractionLike: ERROR posting like, response error:'); console.log(response.error);}
			  } else {
					if($this.options.debug){console.log('_userInteractionLike: like posted, response:'); console.log(response);}
					//update the numbers and the message
					if(!liked){
						$target.addClass('liked');
					}
					if($target.hasClass('user-interaction-comment-like')){
						//comment like
						$target.text(linkText)
						var likeCount = $target.parent().find('.comment-like-count')
						likeCount.text(_addCommas((likeCount.text().replace(',','')*1)+i));
					}
					else{
						//post like
						$target.text(linkText);
						$storyContent = $target.closest('.story-content')
						var likeCount = $storyContent.find('.story-comment-count')
						likeCount.text(_addCommas((likeCount.text().replace(',','')*1)+i));
						if(!liked){
							if(likeCount.text()==1){
								$storyContent.find('.story-stats .you-like').text('You ');
							}
							$storyContent.find('.story-stats').removeClass('hide');
							likeCount.prev().show()
						}
						else{
							likeCount.prev().hide()
						}
					}
			  }
			});
			
		}	
	}
	
	
	
	/*@name: _fbAuthenticate()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: checks to see if a user is logged in (has an access token) if they dont it redirects them to fb to log in
	*/
	function _fbAuthenticate(){
		var loggedIn = false
		
		FB.getLoginStatus(function(response) {
				  if (response.status === 'connected') {
					// connected
					if($this.options.debug){console.log('_fbAuthenticate: user authenticated:'); console.log(response);}
					loggedIn =  true;
					_fbGetUserData()
				  } else if (response.status === 'not_authorized') {
					// not_authorized
					_fbLogin();
				  } else {
					// not_logged_in
					_fbLogin();
				  }
		});
		return loggedIn;
	}
	
	/*@name: _fbInitSDK()
	* @author: modified by lorenzo gangi lorenzo@ironlasso.com
	* @desc: inits facebook js library
	*/
	function _fbInitSDK(){
		 
		 var fbOptions = {
			  appId      : $this.options.appId*1, // App ID
			  channelUrl : '//'+$this.options.domain, // Channel File
			  status     : true, // check login status
			  cookie     : true, // enable cookies to allow the server to access the session
			  xfbml      : true  // parse XFBML
			}
		 
		 if( typeof FB!== "undefined"){
			FB._initialized = false;
			FB.init(fbOptions);
			return
		 }
		
		 // Additional JS functions here
		  window.fbAsyncInit = function() {
			FB.init(fbOptions);
		  };
		
		  // Load the SDK Asynchronously
		  (function(d){
			 var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
			 if (d.getElementById(id)) {return;}
			 js = d.createElement('script'); js.id = id; js.async = true;
			 js.src = "//connect.facebook.net/en_US/all.js";
			 ref.parentNode.insertBefore(js, ref);
		   }(document));	
	}
	
	/*@name: _fbLogin()
	* @author: modified by lorenzo gangi lorenzo@ironlasso.com
	* @desc: creates a facebook login popup dialog
	*/
	function _fbLogin() {
		FB.login(function(response) {
			if (response.authResponse) {
				// connected
				if($this.options.debug){console.log('_fbLogin: user authenticated:'); console.log(response);}
			} else {
				// cancelled
			}
		},{scope: 'publish_actions, publish_stream, user_likes'});
	}
	
	/*@name: _fbGetUserData()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: gets an authenticated users facebook id and name
	*/
	function _fbGetUserData() {
		FB.api('/me', function(response) {
			if($this.options.debug){console.log('_fbGetUserData: retrieved user data:'); console.log(response);}
			$this.data('jQueryFacebookWallLight').currentUser.id = response.id
			$this.data('jQueryFacebookWallLight').currentUser.name = response.name
		});
	}	
	
	/*@name: _fbTimeAgo()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: transforms iso date to facebook style 'time ago' date
	*/
	function _fbTimeAgo(time){
		//var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		var date = new Date(time),
			diff = (((new Date()).getTime() - date.getTime()) / 1000),
			day_diff = Math.floor(diff / 86400);
				
		if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
			return;
				
		return day_diff == 0 && (
				diff < 60 && jQFWlanguage.localize("just now") ||
				diff < 120 && jQFWlanguage.localize("1 minute ago") ||
				diff < 3600 && Math.floor( diff / 60 ) + jQFWlanguage.localize(" minutes ago") ||
				diff < 7200 && jQFWlanguage.localize("1 hour ago") ||
				diff < 86400 && Math.floor( diff / 3600 ) + jQFWlanguage.localize(" hours ago")) ||
			day_diff == 1 && jQFWlanguage.localize("Yesterday") ||
			day_diff < 7 && day_diff + jQFWlanguage.localize(" days ago") ||
			day_diff < 31 && Math.ceil( day_diff / 7 ) + jQFWlanguage.localize(" weeks ago");
	}
	
	/*@name: _addCommas()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: adds commas to number
	*/
	function _addCommas(nStr){
	  nStr += '';
	  x = nStr.split('.');
	  x1 = x[0];
	  x2 = x.length > 1 ? '.' + x[1] : '';
	  var rgx = /(\d+)(\d{3})/;
	  while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	  }
	  return x1 + x2;
	}
    
	/*@name: _mysqlTimeStampToDate()
	* @author: lorenzo gangi lorenzo@ironlasso.com
	* @desc: transforms mysql style date string to 'Sunday January 1 2013'
	*/
	function _mysqlTimeStampToDate(stamp) {
	  
	   var temp =  new Date(stamp);
		
		if(!temp.getMonth()){
			//The date conversion failed, Safari fix
			//remove the T and timezone stuff from the date stamp
			stamp = stamp.split(/[-T.]/);
 	  		var temp =  new Date(stamp[0]+"/"+stamp[1]+"/"+stamp[2]+" "+stamp[3]); 
		}
		
		var weekday=new Array(7);
			weekday[0]=jQFWlanguage.localize("Sunday");
			weekday[1]=jQFWlanguage.localize("Monday");
			weekday[2]=jQFWlanguage.localize("Tuesday");
			weekday[3]=jQFWlanguage.localize("Wednesday");
			weekday[4]=jQFWlanguage.localize("Thursday");
			weekday[5]=jQFWlanguage.localize("Friday");
			weekday[6]=jQFWlanguage.localize("Saturday");
		var longDay = weekday[temp.getDay()];

		var month=new Array();
			month[0]=jQFWlanguage.localize("January");
			month[1]=jQFWlanguage.localize("February");
			month[2]=jQFWlanguage.localize("March");
			month[3]=jQFWlanguage.localize("April");
			month[4]=jQFWlanguage.localize("May");
			month[5]=jQFWlanguage.localize("June");
			month[6]=jQFWlanguage.localize("July");
			month[7]=jQFWlanguage.localize("August");
			month[8]=jQFWlanguage.localize("September");
			month[9]=jQFWlanguage.localize("October");
			month[10]=jQFWlanguage.localize("November");
			month[11]=jQFWlanguage.localize("December");
		var longMonth = month[temp.getMonth()];
		
		//format temp
		var day = temp.getDate();
		var month = temp.getMonth();
		var year = temp.getFullYear();
		return longDay+" "+longMonth+" "+day+" "+year;
	
	}
	
		
	  //attach the plugin to jQuery()
	  $.fn.jQueryFacebookWallLight = function( method ) {
		if ( methods[method] ) {
		  return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
		  return methods.init.apply( this, arguments );
		} else {
		  $.error( 'Method ' +  method + ' does not exist on jQuery.jQueryFacebookWallLight' );
		}    
	  };
	  
})( jQuery );