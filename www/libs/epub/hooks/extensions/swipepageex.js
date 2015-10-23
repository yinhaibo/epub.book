function imageSwipeHideHandler(){$(document).swipe("enable");}

function enableSwipeHandler(){
	$(document).swipe("enable");
}

// using jQuery for MediaElement.js
//$('audio').mediaelementplayer(/* Options */);
/*var audio = document.getElementById("myaudio");
if (audio != null){
	audio.addEventListener('play',function() {
				alert("start to play" + audio.src);
			}, false);
}

var video = document.getElementById("player1");
if (video != null){
	video.addEventListener('play', function() {
				alert("start to play video" + video.src);
			}, false);
}*/

var vbook_zoom_flag = window.localStorage.getItem("vbook-zoom-image");
if (vbook_zoom_flag == undefined || vbook_zoom_flag == "true"){
	vbook_zoom_flag = true;//default to zoom all image
}else{
	vbook_zoom_flag = false;
}

$(document).swipe( {
	swipe:function(event, direction, distance, duration, fingerCount, fingerData) 
	{
		if(distance < 5 && event.target != null && event.target.tagName != null){
			//alert("You are click a/an " + event.target.tagName);
			if (event.target.tagName.toUpperCase() == "IMG"){
				if (vbook_zoom_flag && !event.target.classList.contains('noZoom')){
					$(document).swipe("disable");
					parent.imgZoomViewInChapter(event.target, enableSwipeHandler);
				}
			}else if (event.target.tagName.toUpperCase() == "AUDIO"){
				alert("You are click AUDIO object");
				//$(document).swipe("disable");
			}else if (event.target.tagName.toUpperCase() == "VIDEO"){
				alert("You are click VIDEO object");
			}else if(!event.target.classList.contains('noSwipe')){
				parent.actionBookHeaderAndFooter("toggle");
			}
		}else{
			if (direction == "left"){
				parent.swipeLeftHandler();
			}else if(direction == "right"){
				parent.swipeRightHandler();
			}
		}
		parent.log("swipe event trigger:" + direction + "," + distance);
	},
	threshold:0,
	excludedElements:"label, button, input, select, textarea, a, audio, video, .noSwipe"
 });

if (window.localStorage.getItem("vbook-device-platform")=="iOS"){
	$(document).swipe({preventDefaultEvents:false}); // default to true
}
