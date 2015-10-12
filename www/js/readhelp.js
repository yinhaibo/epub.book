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
		VBOOK.open(bookURI);
	}else{
		if (fDeviceReady){
			vbookLoadBookImpl();
		}else{
			document.addEventListener('deviceready', onDeviceReady, false);
		}
	}
}

function vbookShowBook(){
	StatusBar.hide();
	actionBookHeaderAndFooter("hide");
	VBOOK.show(); // 仅在重新显示时需要调用
}

function onDeviceReady(){
	fDeviceReady = true;
	vbookLoadBookImpl();
}


// proxy, call from iframe(in book)
function swipeLeftHandler(){
	VBOOK.nextPage();
}
function swipeRightHandler(){
	VBOOK.prevPage();
}

function actionBookHeaderAndFooter(action){
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


/**
 * 切换页面书签
 */
function toggleBookmark(){
	var cfi = VBOOK.Book.getCurrentLocationCfi();
	var bookmarked = VBOOK.isBookmarked(cfi);
	
	if(bookmarked === -1) { //-- Add bookmark
		// 书签数据
		var bookmarkdata = {cfi:cfi, page:0, breif:''};
		VBOOK.addBookmark(cfi);
		$('#reader-setting-bookmark').addClass("btn-active"); 
	} else { //-- Remove Bookmark
		VBOOK.removeBookmark(cfi);
		$('#reader-setting-bookmark').removeClass("btn-active"); 
	}
}

function getCurrentPageBrief(){
	var bgettext = false;
	var range, textNode, offset;
	do{
		// standard
	    if (document.caretPositionFromPoint) {
	        range = document.caretPositionFromPoint(0, 0);
	        textNode = range.offsetNode;
	        offset = range.offset;
	        
	    // WebKit
	    } else if (document.caretRangeFromPoint) {
	        range = document.caretRangeFromPoint(0, 0);
	        textNode = range.startContainer;
	        offset = range.startOffset;
	    }
	
	    // only split TEXT_NODEs
	    if (textNode.nodeType == 3) {
	    	if (offset > 0){
	    		textNode.textContent.substring(offset, 100);
	    	}
	    	bgettext = true;
	    }
	}while(bgettext);
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

		showAnimationDuration: 0,
		hideAnimationDuration: 0
		
	};
	
	var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, curChImageItems, options);
	gallery.init();
	
	if (closeHandler != null){
		gallery.listen("close", closeHandler);
	}
}