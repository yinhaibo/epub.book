EPUBJS.Hooks.register("beforeChapterDisplay").smartmedia = function(callback, renderer){
		var videos = renderer.contents.querySelectorAll('video'),
			videos = Array.prototype.slice.call(videos),
			audios = renderer.contents.querySelectorAll('audio'),
			audios = Array.prototype.slice.call(audios),
			iheight = renderer.height,//chapter.bodyEl.clientHeight,//chapter.doc.body.getBoundingClientRect().height,
			oheight;

		if(renderer.layoutSettings.layout != "reflowable") {
			callback();
			return; //-- Only adjust images for reflowable text
		}
		
		videos.forEach(function(item){
			function videoSize() {
				// return while item has not client position
				if (item.clientWidth == 0 && item.clientHeight == 0) return;
				
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
				if (item.clientWidth > item.clientHeight){
					//land image
					if (item.clientWidth > columnWidth){
						item.style.width = columnWidth+"px";
						item.style.height = "auto";
						// recheck height
						if (item.height > iheight - top){
							item.style.width = "auto";
							item.style.height = (iheight-top)+"px";
							item.align = "middle";
						}
					}else if (item.clientHeight > iheight - top){
						item.style.width = "auto";
						item.style.height = (iheight-top)+"px";
					}else{
						item.style.width = columnWidth+"px";
						item.style.height = "auto";
					}
				}else{
					// port image
					if (item.clientHeight > iheight - top){
						item.style.width = "auto";
						item.style.height = (iheight-top)+"px";
						//recheck height
						if (item.clientWidth > columnWidth){
							item.style.width = columnWidth+"px";
							item.style.height = "auto";
						}
					}else if (item.clientWidth > columnWidth){
						item.style.width = columnWidth+"px";
						item.style.height = "auto";
					}else{
						item.style.width = "auto";
						item.style.height = (iheight-top)+"px";
					}
				}
				item.style.display = "block";
				item.style.marginLeft = "auto";
				item.style.marginRight = "auto";
				item.style.pageBreakBefore="always";
				item.classList.add('noSwipe');
			}
			
				
			item.addEventListener('load', function(){videoSize();}, false);
			
			renderer.on("renderer:resized", function(){videoSize();});

			renderer.on("renderer:chapterUnloaded", function(){
				item.removeEventListener('load', videoSize);
				renderer.off("renderer:resized", videoSize);
			});
			
			videoSize();
			
		});
		
		audios.forEach(function(item){
			function audioSize() {
				// return while item has not client position
				if (item.clientWidth == 0 && item.clientHeight == 0) return;
				
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
				if (iheight > columnWidth){
					item.style.width = "100%";
					item.style.height = item.clientHeight + "px";
				}else{
					// port image
					item.style.width = "100%";
					item.style.height = item.clientHeight + "px";
				}
				item.style.display = "block";
				item.style.marginLeft = "auto";
				item.style.marginRight = "auto";
				item.style.pageBreakBefore="always";
				item.classList.add('noSwipe');
			}
			
				
			item.addEventListener('load', function(){audioSize();}, false);
			
			renderer.on("renderer:resized", function(){audioSize();});
				
			renderer.on("renderer:chapterUnloaded", function(){
				item.removeEventListener('load', audioSize);
				renderer.off("renderer:resized", audioSize);
			});
			
			audioSize();
			
		});

		if(callback) callback();

}
