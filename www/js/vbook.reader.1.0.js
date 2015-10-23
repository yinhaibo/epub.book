/**
 * VBookReader.1.0.js
 * 书籍阅读需要加入的脚步
 * 需要支持库：jQuery, jQuery TouchSwipe
 */
var VBookReader = (function(){

var vbook_startDrag;
var vbook_dragSuccess;

var fn = {
		vbook_dragstart:null,
		vbook_dragmove:null,
		vbook_dragend:null,
		vbook_swipeLeft:null,
		vbook_swipeRight:null,
		vbook_click:null,
		swipeEnable:true
		};

// 缺省的左滑屏处理
fn.vbook_swipeLeftDefaultHandler = function(target, distance){
	if (parent.swipeLeftHandler != undefined){
		parent.swipeLeftHandler();
	}else{
		console.log("Please using current script in VBook Reader.");
	}
}

fn.vbook_swipeRightDefaultHandler = function(target, distance){
	if (parent.swipeRightHandler != undefined){
		parent.swipeRightHandler();
	}else{
		console.log("Please using current script in VBook Reader.");
	}
}

function enableSwipeHandler(){
	$(document).swipe("enable");
}

var vbook_zoom_flag = window.localStorage.getItem("vbook-zoom-image");
if (vbook_zoom_flag == undefined || vbook_zoom_flag == "true"){
	vbook_zoom_flag = true;//default to zoom all image
}else{
	vbook_zoom_flag = false;
}

//缺省的单击行为处理
fn.vbook_clickDefaultHandler = function(target){
	if (event.target.tagName.toUpperCase() == "IMG"){
		if (vbook_zoom_flag && !event.target.classList.contains('noZoom')){
			if (parent.imgZoomViewInChapter != undefined){
				$(document).swipe("disable");
				parent.imgZoomViewInChapter(event.target, enableSwipeHandler);
				return;
			}
		}
	}
	
	if(!event.target.classList.contains('noSwipe')){
		if (parent.actionBookHeaderAndFooter != undefined){
			parent.actionBookHeaderAndFooter("toggle");
		}
	}
}


$(document).swipe( {
	swipeStatus : function(event, phase, direction, distance, duration, fingerCount, fingerData ){
		if (phase == "start"){
			vbook_startDrag = true;
			if (vbook_startDrag && fn.vbook_dragstart != null){
				fn.vbook_dragstart(event, distance);
			}
		}else if (phase == "move"){
			if (vbook_startDrag && fn.vbook_dragmove != null){
				fn.vbook_dragmove(event, distance);
			}
		}else if (phase == "end"){
			if (vbook_startDrag && fn.vbook_dragend != null){
				fn.vbook_dragend(event, distance);
			}
			if (distance < 5){
				if (fn.vbook_click != null){
					fn.vbook_click(event.target);
				}else{
					fn.vbook_clickDefaultHandler(event.target);
				}
			}
			vbook_dragSuccess = distance > 0;
		}
		console.log("->swipeStatus trigger:" + phase + ",distance:" + distance + " vbook_dragSuccess:" + vbook_dragSuccess);
	},
	swipeLeft:function(event, direction, distance, duration, fingerCount, fingerData ){
		if (fn.swipeEnable){
			if (fn.vbook_swipeLeft != null){
				fn.vbook_swipeLeft(event.target, distance);
			}else{
				// call parent event
				fn.vbook_swipeLeftDefaultHandler(event.target, distance);
			}
		}
	},
	swipeRight:function(event, direction, distance, duration, fingerCount, fingerData ){
		if (fn.swipeEnable){
			if (fn.vbook_swipeRight != null){
				fn.vbook_swipeRight(event.target, distance);
			}else{
				// call parent event
				fn.vbook_swipeRightDefaultHandler(event.target, distance);
			}
		}
	},
	threshold:0,/*需要设置为0，这样swipeStatus的start事件才会触发，不过tap事件就不会触发*/
	excludedElements:"label, button, input, select, textarea, a, audio, video, .noSwipe"
 });

return fn;
}());

$(function(){
	try{
		if (vbook_load != undefined){vbook_load();}
	}catch(e){}
});
