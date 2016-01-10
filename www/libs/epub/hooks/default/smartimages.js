EPUBJS.Hooks.register("beforeChapterDisplay").smartimages = function(callback, renderer){
	var startTime = $.now();
		var images = renderer.contents.querySelectorAll('img'),
			items = Array.prototype.slice.call(images),
			iheight = renderer.height,//chapter.bodyEl.clientHeight,//chapter.doc.body.getBoundingClientRect().height,
			oheight;

		if(renderer.layoutSettings.layout != "reflowable") {
			callback();
			return; //-- Only adjust images for reflowable text
		}
		
		
		var applyflag = window.localStorage.getItem("vbook-apply-smartimage");
		if (applyflag != "true"){
			callback();
			return;
		}

		items.forEach(function(item){
			
			function size() {
				// return while item has not client position
				if (item.naturalWidth == 0 && item.naturalHeight == 0) return;
				
				var itemRect = item.getBoundingClientRect(),
					rectHeight = itemRect.height,
					top = itemRect.top,
					oHeight = item.getAttribute('data-height'),
					height = oHeight || rectHeight,
					newHeight;//,
					//fontSize = Number(getComputedStyle(item, "").fontSize.match(/(\d*(\.\d*)?)px/)[1]),
					//fontAdjust = fontSize ? fontSize / 2 : 0;
					
				iheight = renderer.contents.clientHeight;
				if(top < 0) top = 0;
		
				//var docWidth = document.style.columnWidth;
				var columnWidth = parseInt(item.ownerDocument.documentElement.style[EPUBJS.core.prefixed('columnWidth')]);
				if (item.naturalWidth > item.naturalHeight){
					//land image
					if (item.naturalWidth > columnWidth){
						item.style.width = "100%";
						item.style.height = "auto";
						// recheck naturalHeight
						if (item.naturalHeight > top + iheight){
							item.style.width = "auto";
							item.style.height = "100%";
							item.align = "middle";
						}
					}else if (item.naturalHeight > top + iheight){
						item.style.width = "auto";
						item.style.height = "100%";
					}else{
						item.style.width = "auto";
						item.style.height = "auto";
					}
				}else{
					// port image
					if (item.naturalHeight > top + iheight){
						item.style.width = "auto";
						item.style.height = "100%";
						//recheck naturalHeight
						if (item.naturalWidth > columnWidth){
							item.style.width = "100%";
							item.style.height = "auto";
						}
					}else if (item.naturalWidth > columnWidth){
						item.style.width = "100%";
						item.style.height = "auto";
					}else{
						item.style.width = "auto";
						item.style.height = "auto";
					}
				}
				item.style.display = "block";
				item.style.marginLeft = "auto";
				item.style.marginRight = "auto";
			}
			
			function zoomSelectImage(obj){
				//item.ownerDocument.documentElement.append("<div style=\"width='100%'; height='100%'\"><img src='" + img.src + "'/></div>");
				imgZoomViewInChapter(obj.currentTarget);
			}
			
			item.addEventListener('load', function(){size();}, false);
			//item.addEventListener("click", zoomSelectImage)
			
			renderer.on("renderer:resized", function(){size();});
			
			renderer.on("renderer:chapterUnloaded", function(){
				item.removeEventListener('load', size);
				//item.removeEventListener("click", zoomSelectImage);
				renderer.off("renderer:resized", size);
			});
			
			size();

		});
		console.log('smartimages register take ms:' + ($.now()- startTime));
		if(callback) callback();

}
