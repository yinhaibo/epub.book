/**
 * VBook Reader Help Java Script
 */
"use strict";
var bookURI;
var userName = "default"; // User name, every user has a user directory in externalDataDirectory
var Book;
var fDeviceReady = false;
EPUBJS.Hooks.register("beforeChapterDisplay").reader = function(callback, renderer){
	VBOOK.chapterBeforeDisplay(renderer);
	callback();
	return;
}

function vbookLoadBookImpl(){
	StatusBar.hide();
	VBOOK.open(bookURI);
}
function vbookLoadBook(){
	bookURI = window.localStorage.getItem("vbook-book");
	var _os = detectOS();
	
	if (_os == "Windows" || _os == "Mac"){
		if (bookURI.slice(-5) == ".epub"){
			alert("Cannot open epub zip format, please unzip epub file.");
		}else{
			VBOOK.open(bookURI);
		}
	}else{
		if (fDeviceReady){
			vbookLoadBookImpl();
		}else{
			document.addEventListener('deviceready', onDeviceReady, false);
		}
	}
}

function vbookShowBook(){
	if (isApp){
		StatusBar.hide();
	}
	actionBookHeaderAndFooter("hide");
	VBOOK.show(); // 仅在重新显示时需要调用
}

function onDeviceReady(){
	fDeviceReady = true;
	vbookLoadBookImpl();
}

// 设置div到屏幕中心位置
function setDivCenter(divName){   
    var top = ($(window).height() - $(divName).height())/2;   
    var left = ($(window).width() - $(divName).width())/2;   
    var scrollTop = $(document).scrollTop();   
    var scrollLeft = $(document).scrollLeft();   
    $(divName).css( { position : 'absolute', 'top' : top + scrollTop, left : left + scrollLeft } );
}
//设置div到鼠标位置
function setDivMousePosition(divName, clientX, clientY){
	var top, left;
	left = clientX;
	top = clientY;
	
	var divObj = $(divName);
	if (clientX + divObj.width() + 40 > $(window).width()){
		left = $(window).width() - divObj.width() - 40;
	}
	
	if (clientY +divObj.height()  + 40 > $(window).height()){
		top = $(window).height() - divObj.height() - 40;
	}
	
	var scrollTop = $(document).scrollTop();   
    var scrollLeft = $(document).scrollLeft();  
    divObj.css( { position : 'absolute', 'top' : top + scrollTop, 'left' : left + scrollLeft } );
}

// proxy, call from iframe(in book)
function swipeLeftHandler(){
	VBOOK.nextPage();
}
function swipeRightHandler(){
	VBOOK.prevPage();
}

//显示提示消息
function showTip(msg){
	setDivCenter("#prompt_msg");
	$("#prompt_msg").text(msg).fadeIn(800).fadeOut(2000);
}

/***********笔记窗口功能实现*************/
var noteWindow = {
		note:null,
		arrNodes:null,
		selectedStyleObj:"#note-window-style-a"
	};

// 打开笔记窗口
function showNoteWindow(note, arrNodes, clientX, clientY){
	noteWindow.note = note;
	noteWindow.arrNodes = arrNodes;
	if(noteWindow.arrNodes && noteWindow.arrNodes.length > 0){
		var guids = /([0-9a-z-]+)/.exec(noteWindow.arrNodes[0].className);
		if (guids.length >= 2){
			noteWindow.noteid = guids[1];
		}
	}	
		
	setDivMousePosition("#note-window", clientX, clientY);
	if (arrNodes && arrNodes.length > 0){
		var styleList = arrNodes[0].className.match('style_[a-z]');
		if (styleList && styleList.length > 0){
			// 取得当前笔记的样式，并通过笔记窗口的选中样式
			var styleMode = styleList[0].substring(styleList[0].length-1);
			if (styleMode != noteWindow.selectedStyleObj.substring(noteWindow.selectedStyleObj.length-1)){
				$(noteWindow.selectedStyleObj).removeClass("selected");
				noteWindow.selectedStyleObj = '#note-window-style-'+styleMode;
				$(noteWindow.selectedStyleObj).addClass("selected");
			}
		}
	}
	$("#note-window").fadeIn(300);
}
// 关闭笔记窗口
function closeNoteWindow(){
	$("#note-window").fadeOut(500);
	noteWindow.arrNodes = null;
}

function vbook_reader_note_style_set(mode){
	// 改变笔记
	if (noteWindow.arrNodes != null && noteWindow.arrNodes.length > 0){
		// 修改笔记的样式
		var oldMode = noteWindow.selectedStyleObj.substring(noteWindow.selectedStyleObj.length-1);
		noteWindow.arrNodes.each(function(){
			$(this).removeClass("style_" + oldMode).addClass("style_" + mode);
		});
		// 通过笔记窗口的选中
		$(noteWindow.selectedStyleObj).removeClass("selected");
		noteWindow.selectedStyleObj = '#note-window-style-' + mode;
		$(noteWindow.selectedStyleObj).addClass("selected");
		// 修改笔记对象的值，并保存到文件
		var noteJson = VBOOK.getBookNoteObj(noteWindow.noteid);
		if (noteJson != null && noteJson.stylemode != mode){
			noteJson.stylemode = mode;
			VBOOK.updateBookNoteContent(noteJson);
		}
		
	}
}

function vbook_reader_note_copy(){
	if (noteWindow.arrNodes != null && noteWindow.arrNodes.length > 0){
		var content = "";
		noteWindow.arrNodes.each(function(){
			if (content.length > 0){
				content = content + "\n";
			}
			content = content + $(this).textContent;
		});
		cordova.plugins.clipboard.copy(content);
		closeNoteWindow();
		showTip("成功复制到剪贴板");
	}
}

function vbook_reader_note_del(){
	if (noteWindow.arrNodes != null && noteWindow.arrNodes.length > 0){
			VBOOK.removeBookNote(noteWindow.noteid);
			noteWindow.arrNodes.each(function(){
				noteWindow.note.removeBookNoteObj(this);
			});
		closeNoteWindow();
	}
}

function vbook_reader_note_share(){
	//todo:
}

function vbook_reader_note_note(){
	//todo: 打开笔记页面，编写笔记
	
}

// 保存笔记
function vbook_reader_note_save(note, arrNodes)
{
	var noteJson = {};
	noteJson.noteid = note.noteid;
	noteJson.notetime = $.now();
	noteJson.cfiBase = VBOOK.Book.currentChapter.cfiBase;
	noteJson.chapter = this.setting.currentChapterName;
	noteJson.notecfi = [];
	var styleList = arrNodes[0].note.className.match('style_[a-z]');
	if (styleList && styleList.length > 0){
		// 取得当前笔记的样式，并通过笔记窗口的选中样式
		noteJson.stylemode = styleList[0].substring(styleList[0].length-1);
	}else{
		noteJson.stylemode = "a";
	}
	
	var range = document.createRange();
	$(arrNodes).each(function(){
		var cfiItem = {};
		range.setStart(this.note.parentNode, 1);
		range.setEnd(this.note.parentNode, 1);
		cfiItem.cfi = VBOOK.Book.currentChapter.cfiFromRange(range);
		cfiItem.cfi = cfiItem.cfi.replace(/:[0-9]+/,':' + this.offset);
		cfiItem.length = this.length;
		cfiItem.content = this.content;
		noteJson.notecfi.push(cfiItem);
	});
	VBOOK.updateBookNoteContent(noteJson);
}
/*********笔记窗口功能实现结束***********/

function log(msg){
	console.log(msg)
}

function actionBookHeaderAndFooter(action){
	$("#reader-header").toolbar( action );
	$("#reader-footer").toolbar( action );
}
////////////////////////////////////////////////
// Page Show
// Time
function updateClock ( )
{
	var currentTime = new Date ( );
	var currentHours = currentTime.getHours ( );
	var currentMinutes = currentTime.getMinutes ( );

	// Pad the minutes and seconds with leading zeros, if required
	currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
	currentHours = ( currentHours < 10 ? "0" : "" ) + currentHours;

	// Compose the string for display
	var currentTimeString = currentHours + ":" + currentMinutes;
	
	
	$("#book-reader-Clock").html(currentTimeString);
		
 }

var readMode = 'daytime'; //daytime, night

$('#reader_toolbar_bottom_moon').on('click', function(){
	if (readMode == 'daytime'){
		readMode = 'night';
		Book.setStyle('color', '#666666');
		Book.setStyle('background-color', '#000000');
		this.text = ('黑夜');
		//$('#reader_toolbar_bottom_moon:after').background = 'url("img/reader_toolbar_bottom_moon.png") 50% 50% no-repeat';
	}else{
		readMode = 'daytime';
		Book.setStyle('color', '#000000');
		Book.setStyle('background-color', '#FFFFFF');
		this.text = ('白天');
		//$('#reader_toolbar_bottom_moon:after').background = 'url("img/reader_toolbar_bottom_sun.png") 50% 50% no-repeat';
	}
});

// Setting
var settings = {
	bookmarks : null,
	annotations : null,
	contained : null,
	bookKey : null,
	styles : null,
	sidebarReflow: false,
	generatePagination: false,
	history: true
};

var counter = 0;

window.addEventListener("orientationchange", function(){
    console.log('Orientation changed to ' + screen.orientation);
});

/**
 * 更新书签状态，在页面改变时更新 
 */
VBOOK.updateBookmarkStatus = function(cfi){
	var cfi = VBOOK.Book.getCurrentLocationCfi();
	var bookmarked = VBOOK.isBookmarked(cfi);
	
	if(bookmarked === -1) { //-- Clear bookmark
		$('#reader-setting-bookmark').removeClass("btn-active"); 
	} else { //-- add Bookmark
		$('#reader-setting-bookmark').addClass("btn-active"); 
	}
}

function getCurrentPageBrief(){
	var bgettext = false;
	var range, textNode, offset;
	var briefText;
	var bookdoc = VBOOK.Book.renderer.doc;
	
	// standard
    if (bookdoc.caretPositionFromPoint) {
        range = bookdoc.caretPositionFromPoint(0, 0);
        textNode = range.offsetNode;
        offset = range.offset;
        
    // WebKit
    } else if (bookdoc.caretRangeFromPoint) {
        range = bookdoc.caretRangeFromPoint(0, 0);
        textNode = range.startContainer;
        offset = range.startOffset;
    }
    
	do{
		if (textNode.textContent.length > 3){
		    // only TEXT_NODEs
		    //if (textNode.nodeType == 3) {
		    	
		    	briefText = textNode.textContent.substring(offset, offset + 50);
		    	if (offset > 0){
		    		briefText = "..." + briefText;
		    	}
		    	if (textNode.textContent.length > offset + 50){
		    		briefText += "...";
		    	}
		    	bgettext = true;
		   // }
		}else{
			textNode = textNode.nextSibling;
			briefText = "...";
			if (textNode == null){
				bgettext = true;
				break;
			}
		}
	}while(!bgettext);
	
	return briefText;
}

/**
 * 切换页面书签
 */
function toggleBookmark(){
	var cfi = VBOOK.Book.getCurrentLocationCfi();
	var bookmarked = VBOOK.isBookmarked(cfi);
	
	if(bookmarked === -1) { //-- Add bookmark
		// 书签数据
		var bookmarkdata = {cfi:cfi, page:0, breif:''};
		VBOOK.addBookmark(cfi, getCurrentPageBrief());
		$('#reader-setting-bookmark').addClass("btn-active"); 
	} else { //-- Remove Bookmark
		VBOOK.removeBookmark(cfi);
		$('#reader-setting-bookmark').removeClass("btn-active"); 
	}
}


//
//For image zoom
//
// All images information for PhotoSwipe in current chapter
var curChImageItems = [];
var curChAllImages = [];

function hasImageInCurrentGallery(img){
	for (var i = 0; i < curChAllImages.length; i++) {
		if(curChAllImages[i] == img) {
			return true;
		}
	}
	return false;
}

function updateGalleryImage(items){
	curChImageItems.splice(0);
	curChAllImages.splice(0);
	var index = 0;
	items.forEach(function(imgobj){
		// create slide object
		var item = {
			index:index,
			src: imgobj.src,
			title:imgobj.alt||'',
			w: imgobj.naturalWidth,
			h: imgobj.naturalHeight,
		};
		curChAllImages.push(imgobj);
		curChImageItems.push(item);
		index++;
	});
}

// call from smartimages.js while image was clicked
function imgZoomViewInChapter(target, closeHandler){
	//alert("You are click img object");
	// Check current is in current gallery 
	if (!hasImageInCurrentGallery(target)){
		// Load all images
		var images = VBOOK.Book.renderer.contents.querySelectorAll("img"),
		    items = Array.prototype.slice.call(images);
		updateGalleryImage(items);
	}
	var index = 0;
	for (var i = 0; i < curChAllImages.length; i++) {
		if(curChAllImages[i] == target) {
			break;
		}
		index++;
	}
	
	var pswpElement = document.querySelectorAll('.pswp')[0];
	
	// define options (if needed)
	var options = {
		index: index,
		bgOpacity:0.7,
		 // history & focus options are disabled on CodePen        
		history: false,
		focus: false,
		fullscreenEl: false,

		showAnimationDuration: 0,
		hideAnimationDuration: 0
		
	};
	
	var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, curChImageItems, options);
	gallery.init();
	
	if (closeHandler != null){
		gallery.listen("close", closeHandler);
	}
}