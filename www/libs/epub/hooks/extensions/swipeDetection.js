EPUBJS.Hooks.register("beforeChapterDisplay").swipeDetection = function(callback, renderer){
		if (renderer == null|| renderer.doc == null){
			if(callback) callback();
			return;
		}
		
		function getBaseUrl() {
			var re = new RegExp(/^.*\//);
			var base = window.location.href;
			var items = base.split('?');
			if (items != undefined && items.length > 0){
				base = items[0];
			}
			return re.exec(base);
		}
		
        //-- Load jQuery into iframe header
        EPUBJS.core.addScripts([getBaseUrl() + "libs/jquery/jquery-2.1.4.min.js",
								getBaseUrl() + "libs/jquery/plugins/jquery.touchSwipe.js",
								getBaseUrl() + "js/vbook.reader.1.0.js"],
								null, renderer.doc.head);
		
        if(callback) callback();
}