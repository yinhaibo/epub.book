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
		swipeEnable:true,
		dragEnable:false,
		noteEnable:true
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

//////////////////////////////////////////////////////////////////////////
//笔记部分


function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}

var note = {
		orgRange:null,
		curRange:null,
		orgOffset:null,
		noteNode:null,
		noteid:null,
		orgX:null, orgY:null,
		noteSuccess:false/*是否成功选中文本*/
}
fn.note = note; // 把note绑定到外围对象

note.deleteNote = function(id){
	$("." + id).each(function(index, element){
		note.removeBookNoteObj(element);
	});
}
note.isBookNoteObj = function(element){
	return element.classList.contains("noteouter") || element.classList.contains("noteinner");
}

/**
 * 从当前元素获得笔记元素，仅判断当前节点，或其父节点是否为笔记节点
 */
note.getBookNoteObj = function(element){
	if (element.nodeType == 1 && element.classList.contains("noteouter")){
		return element;
	}else if(element.nodeType == 1 && element.classList.contains("noteinner")){
		return element.parentNode;
	}else if(element.parentNode.nodeType == 1 && element.parentNode.classList.contains("noteinner")){
		return element.parentNode.parentNode;
	}else{
		return null;
	}
}

/**
 * 添加一个笔记对象到当前元素位置，内容为空，返回笔记对象
 * @element 需要插入笔记的元素对象
 * @offset  插入笔记的开始位置
 */
note.createBookNoteObj = function(element, offset, guid){
	console.log("createBookNoteObj:" + element + "," + offset);
	// 为实现下话下，需要使用两个span来实现
	var nextNode;
	var vnoteinner = document.createElement("span");
	var vnoteouter = document.createElement("span");
	vnoteouter.classList.add(guid);// 同意笔记使用同一个id的样式
	vnoteinner.classList.add("noteinner");
	vnoteinner.classList.add("style_a");
	vnoteouter.classList.add("noteouter");
	vnoteouter.classList.add("style_a");
	vnoteouter.appendChild(vnoteinner);
	nextNode = element.splitText(offset);
	element.parentNode.insertBefore(vnoteouter, nextNode);
	
	return vnoteouter;
}

/**
 * 删除笔记节点
 */
note.removeBookNoteObj = function(note){
	var prev = note.previousSibling;
	
	prev.textContent = prev.textContent + note.textContent + (note.nextSibling != null ? note.nextSibling.textContent : "");
	if (note.nextSibling != null){
		prev.parentNode.removeChild(note.nextSibling);
	}
	note.parentNode.removeChild(note);
}

/**
 * 添加文本对象到笔记对象
 * @note 笔记对象
 * @element 需要添加到笔记的元素
 * @offset  需要添加的偏移
 * @dir  添加的方向 
 *  0 - 向前，偏移前面的文本添加到笔记内容的后面， 
 *  1 - 向后，偏移后面的文本添加到笔记内容的前面
 */
note.addTextToNoteObj = function(note, element, offset, dir){
	var noteTxt = note.childNodes[0];
	if (dir == undefined || dir == 1){
		noteTxt.textContent = noteTxt.textContent + element.textContent.substring(0, offset);
		element.textContent = element.textContent.substring(offset);
	}else{
		noteTxt.textContent = element.textContent.substring(offset) + noteTxt.textContent;
		element.textContent = element.textContent.substring(0, offset);
	}
	if (element.textContent.length == 0){
		element.parentNode.removeChild(element);
	}
}


/**
 * 从笔记对象把文本退还给原对象
 * @note 笔记对象
 * @element 需要退还笔记的元素（为笔记前后兄弟节点）
 * @offset  当前的偏移位置
 * @dir  添加的方向 
 *  0 - 向前，偏移后面的文本退还到后面， 
 *  1 - 向后，偏移前面的文本退还到前面
 */
note.removeTextFromNoteObj = function(note, element, offset, dir){
	var noteTxt = note.childNodes[0];

	if (dir == undefined || dir == 1){
		if (element == null){
			element = document.createTextNode(noteTxt.textContent.substring(offset));
			note.parentNode.appendChild(element);
		}else{
			element.textContent = noteTxt.textContent.substring(offset) + element.textContent;
		}
		noteTxt.textContent = noteTxt.textContent.substring(0, offset);
	}else{
		if (element == null){
			element = document.createTextNode(noteTxt.textContent.substring(0, offset));
			note.parentNode.insertBefore(element, note);
		}else{
			element.textContent = element.textContent + note.textContent.substring(0, offset);
		}
		noteTxt.textContent = noteTxt.textContent.substring(offset);
	}
}

note.swipeStart = function(event){
	this.curRange = document.caretRangeFromPoint(event.pageX, event.pageY);
	this.orgNode = this.curRange.startContainer;
	this.orgOffset = this.curRange.startOffset;
	this.noteid = guid();
	this.noteNode = this.createBookNoteObj(this.orgNode, this.orgOffset, this.noteid);
	this.orgX = event.clientX || event.pageX;
	this.orgY = event.clientY || event.pageY;
}

note.swipeMove = function(event){
	var X = event.clientX || event.pageX,
	    Y = event.clientY || event.pageY;
	this.curRange = document.caretRangeFromPoint(X, Y);
	if(this.noteNode && this.curRange.startContainer.parentNode == this.noteNode.parentNode){
		// 当前节点与笔记节点在同一父节点下
		// 当前节点在笔记节点前面
		// 如果笔记尾部在开始位置之后，需要归还给后续节点
		if(this.noteNode.previousSibling == this.curRange.startContainer){
			// 计算目前笔记尾部位置
			var endOffset = this.noteNode.previousSibling.textContent.length + this.noteNode.textContent.length;
			if (endOffset > this.orgOffset){
				console.log("remove all note content to next:" + this.noteNode.textContent.length);
				// 归还开始位置之后的笔记内容到后续节点
				this.removeTextFromNoteObj(this.noteNode, this.noteNode.nextSibling, 0, 1);
			}
			// 添加选中位置之后的内容到笔记节点
			this.addTextToNoteObj(this.noteNode, this.curRange.startContainer, this.curRange.startOffset, 0);
		}else if(this.noteNode.nextSibling == this.curRange.startContainer){
			// 当前节点在笔记节点之后
			// 计算目前笔记首部位置
			if (this.noteNode.previousSibling != null){
				var offset = this.noteNode.previousSibling.textContent.length;
				if (offset < this.orgOffset){
					console.log("remove all note content to previous");
					// 笔记包含开始节点之前内容，需要归还
					this.removeTextFromNoteObj(this.noteNode, this.noteNode.previousSibling, this.noteNode.textContent.length, 0);
				}
			}
			// 添加选中位置之前的内容到笔记节点
			this.addTextToNoteObj(this.noteNode, this.curRange.startContainer, this.curRange.startOffset, 1);
		}
	}else if(this.getBookNoteObj(this.curRange.startContainer) == this.noteNode){
		var prevLen = (this.noteNode.previousSibling==null ? 0 : this.noteNode.previousSibling.textContent.length);
		var offset = prevLen + this.curRange.startOffset;
		console.log("offset:" + offset + ",orgOffset:" + this.orgOffset + ",curRange.startOffset:" + this.curRange.startOffset)
		if (offset > this.orgOffset){
			// 当前偏移为向后选择，归还当前偏移后的内容
			this.removeTextFromNoteObj(this.noteNode, this.noteNode.nextSibling, 
					this.curRange.startOffset + prevLen - this.orgOffset, 1);
		}else if(offset < this.orgOffset){
			// 当前偏移为向前选择，归还当前偏移前的内容
			this.removeTextFromNoteObj(this.noteNode, this.noteNode.previousSibling, this.curRange.startOffset, 0);
		}
	}else{
		// 切换了容器
		this.orgNode = this.curRange.startContainer;
		
		// 结束当前容器的选择，开始下一容器的开始位置和选择
		if (Y < this.orgY || (X < orgX && Math.abs(Y - this.orgY) < 10)){
			// 当前节点前面
			if (this.noteNode.previousSibling != null){
				this.addTextToNoteObj(this.noteNode, this.noteNode.previousSibling, this.noteNode.previousSibling.textContent.length, 0);
			}
			
			this.orgOffset = this.orgNode.textContent.length;
			this.noteNode = createBookNoteObj(this.orgNode, this.orgOffset, this.noteid);
			
			if (this.noteNode.previousSibling != null){
				this.addTextToNoteObj(this.noteNode, this.noteNode.previousSibling, this.curRange.startOffset, 0);
			}
		}else if(Y > this.orgY || (X > orgX && Math.abs(Y - this.orgY) < 10)){
			// 当前节点后面
			if (this.noteNode.nextSibling != null){
				this.addTextToNoteObj(this.noteNode, this.noteNode.nextSibling, this.noteNode.nextSibling.textContent.length, 1);
			}
			
			this.orgOffset = 0;
			this.noteNode = createBookNoteObj(this.orgNode, this.orgOffset, this.noteid);
			if (this.noteNode.nextSibling != null){
				this.addTextToNoteObj(this.noteNode, this.noteNode.nextSibling, this.curRange.startOffset, 1);
			}
		}
	}
}

note.swipeEnd = function(event){
	if (this.noteNode && this.noteNode.textContent.length == 0){
		this.removeBookNoteObj(this.noteNode);
	}
}

//////////////////////////////////////////////////////////////////////////

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

var noteWindowVisible = false;
// 处理特殊对象的单击事件，如果处理成功，返回true, 表示后续时间不需要执行，反之，因该调用后续的处理逻辑。
function vbook_processBookObjClick(clientX, clientY, target){
	// 检查是否是笔记对象
	if (fn.note){
		var noteObj = fn.note.getBookNoteObj(target);
		if (noteObj != null){
			parent.showNoteWindow(noteObj, clientX, clientY);
			noteWindowVisible = true;
			return true;
		}else if(noteWindowVisible){
			parent.closeNoteWindow();
			return true;
		}
	}
	
	return false;
}

var longTapTimer;
var startNote = false;
var dragActive = false;
var swipeCancel = false;
var touchClientX, touchClientY;
$(document).swipe( {
	swipeStatus : function(event, phase, direction, distance, duration, fingerCount, fingerData ){
		if (phase == "start"){
			touchClientX = event.clientX || event.pageX;
			touchClientY = event.clientY || event.pageY;
			vbook_startDrag = true;
			if (fn.dragEnable && vbook_startDrag && fn.vbook_dragstart != null){
				fn.vbook_dragstart(event, distance);
			}
			if (fn.noteEnable){
				startNote = false;
				dragActive = true;
				longTapTimer = setTimeout(function(){
					console.log("start timeout!!! dragActive:" + dragActive);
					if (dragActive){
						parent.showTip("拖动标记笔记");
						fn.note.swipeStart(event);
						startNote = true;
					}
				}, 800);
				
			}
			console.log("start swipe status.");
		}else if (phase == "move"){
			if (fn.dragEnable && vbook_startDrag && fn.vbook_dragmove != null){
				fn.vbook_dragmove(event, distance);
			}
			if (fn.noteEnable){
				if (!startNote && distance > 10 && duration < 800){
					dragActive = false;
				}
				if (startNote){
					fn.note.swipeMove(event);
				}
			}
		}else if (phase == "end"){
			if (fn.dragEnable && vbook_startDrag && fn.vbook_dragend != null){
				fn.vbook_dragend(event, distance);
			}
			swipeCancel = false;
			if (fn.noteEnable){
				dragActive = false;
				if (startNote){
					fn.note.swipeEnd(event);
					swipeCancel = true;
				}
			}
			if (!swipeCancel && distance < 5){
				// 检查是否是特殊对象
				if (!vbook_processBookObjClick(touchClientX, touchClientY, event.target)){
					if (fn.vbook_click != null){
						fn.vbook_click(event.target);
					}else{
						fn.vbook_clickDefaultHandler(event.target);
					}
				}
			}
			vbook_dragSuccess = distance > 0;
			console.log("end swipe status.");
		}
		console.log("->swipeStatus trigger:" + phase + ",distance:" + distance + " vbook_dragSuccess:" + vbook_dragSuccess);
	},
	swipeLeft:function(event, direction, distance, duration, fingerCount, fingerData ){
		if (fn.swipeEnable && !swipeCancel){
			if (fn.vbook_swipeLeft != null){
				fn.vbook_swipeLeft(event.target, distance);
			}else{
				// call parent event
				fn.vbook_swipeLeftDefaultHandler(event.target, distance);
			}
		}
		swipeCancel = false;
	},
	swipeRight:function(event, direction, distance, duration, fingerCount, fingerData ){
		if (fn.swipeEnable && !swipeCancel){
			if (fn.vbook_swipeRight != null){
				fn.vbook_swipeRight(event.target, distance);
			}else{
				// call parent event
				fn.vbook_swipeRightDefaultHandler(event.target, distance);
			}
		}
		swipeCancel = false;
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
