/* language translations go here */
var jQFWlanguage = {
	language: "english",
	localize: function(translation){
		if(this.language === "english"){
			return translation;
		}
		else{
			return this.viewText[this.language][translation];
		}
	},
	viewText: {

				
	}
	
};