EPUBJS.Hooks.register("beforeChapterDisplay").annotator = function(callback, renderer){

		function getBaseUrl() {
			var re = new RegExp(/^.*\//);
			var base = window.location.href;
			var items = base.split('?');
			if (items != undefined && items.length > 0){
				base = items[0];
			}
			return re.exec(base);
		}
		
		function executeScriptAfterLoad(){
			//-- Create a script element, you could also load this from an external file like above
			var script = renderer.doc.createElement("script");

			//-- Listen for swipe events
			 script.text = '\
				jQuery(function ($) {\
					$("body").annotator();\
				});';

			renderer.doc.head.appendChild(script);
		}
		
		var baseUrl = getBaseUrl();
        //-- Load Annotator into iframe header
        EPUBJS.core.addScripts([baseUrl + "libs/jquery/jquery-2.1.4.min.js",
								baseUrl + "libs/annotator/annotator.min.js",
								baseUrl + "libs/annotator/annotator.touch.js"], executeScriptAfterLoad, renderer.doc.head);
		EPUBJS.core.addCss([baseUrl + "libs/annotator/annotator.min.css"],
			null, renderer.doc.head);
		
        if(callback) callback();
}