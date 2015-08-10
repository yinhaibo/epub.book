EPUBJS.Hooks.register("beforeChapterDisplay").smartimages = function(callback, renderer){
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
						item.style.width = "100%";
						item.style.height = "auto";
						// recheck height
						if (item.height > top + iheight){
							item.style.width = "auto";
							item.style.height = "100%";
							item.align = "middle";
						}
					}else if (item.clientHeight > top + iheight){
						item.style.width = "auto";
						item.style.height = "100%";
					}else{
						item.style.width = "100%";
						item.style.height = "auto";
					}
				}else{
					// port image
					if (item.clientHeight > top + iheight){
						item.style.width = "auto";
						item.style.height = "100%";
						//recheck height
						if (item.clientWidth > columnWidth){
							item.style.width = "100%";
							item.style.height = "auto";
						}
					}else if (item.clientWidth > columnWidth){
						item.style.width = "100%";
						item.style.height = "auto";
					}else{
						item.style.width = "auto";
						item.style.height = "100%";
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
			
			// add play event handler
			function playVideo(){
				console.log("play video:" + item.src);
				cordova.plugins.videoPlayer.play(item.src);
			}
			function stopVideo(){
				console.log("stop video:" + item.src);
				item.load();
			}
			console.log("add play event:" + item.src);
			item.addEventListener('play', playVideo, false);
			item.addEventListener('puase', stopVideo, false);
				
			renderer.on("renderer:chapterUnloaded", function(){
				item.removeEventListener('load', videoSize);
				item.removeEventListener('play', playVideo);
				item.removeEventListener('puase', stopVideo);
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
					item.style.height = "auto";
				}else{
					// port image
					item.style.width = "100%";
					item.style.height = "100%";
				}
				item.style.display = "block";
				item.style.marginLeft = "auto";
				item.style.marginRight = "auto";
				item.style.pageBreakBefore="always";
				item.classList.add('noSwipe');
			}
			
				
			item.addEventListener('load', function(){audioSize();}, false);
			
			renderer.on("renderer:resized", function(){audioSize();});
			
			var my_media;
			// add play event handler
			function playAudio(){
				if (my_media == null){
					my_media = new Media(item.src,
						// success callback
						function () { console.log("playAudio():Audio Success"); },
						// error callback
						function (err) { console.log("playAudio():Audio Error: " + err); }
					);
				}
				console.log("play audio: " + item.src);
				my_media.play();
			}
			function pauseAudio(){
				console.log("play audio: " + item.src);
				if (my_media != null){
					my_media.pause();
				}
			}
			console.log("add audio play/pause event:" + item.src);
			item.addEventListener('play', playAudio, false);
			item.addEventListener('pause', pauseAudio, false);
				
			renderer.on("renderer:chapterUnloaded", function(){
				item.removeEventListener('load', audioSize);
				item.removeEventListener('play', playAudio);
				item.removeEventListener('pause', pauseAudio);
				renderer.off("renderer:resized", audioSize);
			});
			
			audioSize();
			
		});

		if(callback) callback();

}
