EPUBJS.Hooks.register("beforeChapterDisplay").swipeDetection = function(callback, renderer){
		if (renderer == null|| renderer.doc == null){
			if(callback) callback();
			return;
		}
		
		var startTime = $.now();
		function getBaseUrl() {
			var re = new RegExp(/^.*\//);
			var base = window.location.href;
			var items = base.split('?');
			if (items != undefined && items.length > 0){
				base = items[0];
			}
			return re.exec(base);
		}
		
		var baseUrl = getBaseUrl();
        //-- Load jQuery into iframe header
        EPUBJS.core.addScripts([baseUrl + "libs/jquery/jquery-2.1.4.min.js",
								baseUrl + "libs/jquery/plugins/jquery.touchSwipe.js",
								baseUrl + "js/vbook.reader.1.0.js"],
								null, renderer.doc.head);
        EPUBJS.core.addCss(baseUrl + "css/vbook.reader.1.0.css",
							null, renderer.doc.head);
							
		console.log('swipe dection register take:' + ($.now()- startTime));
        if(callback) callback();
}