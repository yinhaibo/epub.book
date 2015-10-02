/**
 * VBook Reader Help Java Script
 */
"use strict";
var bookURI;
var userName = "default"; // User name, every user has a user directory in externalDataDirectory
var Book;


function vbookLoadBook(){
	bookURI = window.localStorage.getItem("vbook-book");
	var _os = detectOS();
	
	if (_os == "Windows" || _os == "Mac"){
		VBOOK.open(bookURI);
	}else{
		document.addEventListener('deviceready', onDeviceReady, false);
	}
}

function onDeviceReady(){
	StatusBar.hide();
	VBOOK.open(bookURI);
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

var createBookmarkItem = function(cfi) {			
	var itemStr = '<li id="' + "bookmark-" + counter + '"><a href="#book" onclick="VBOOK.Book.gotoCfi(\'' 
		+ cfi + '\');" data-ajax="false">' + cfi + '</a></li>';
	counter++;
	
	return itemStr;
};


function addBookmark(cfi) {
	var present = this.isBookmarked(cfi);
	if(present > -1 ) return;

	this.settings.bookmarks.push(cfi);
	
	var item = createBookmarkItem(cfi);
	$('#bookmarkList').append(item);

};

function removeBookmark(cfi) {
	var bookmark = this.isBookmarked(cfi);
	if( bookmark === -1 ) return;
	
	delete this.settings.bookmarks[bookmark];
	
	var $item = $("#bookmark-"+index);
	$item.remove();
};

function isBookmarked(cfi) {
	var bookmarks = this.settings.bookmarks;
	
	return bookmarks.indexOf(cfi);
};

function clearBookmarks() {
	this.settings.bookmarks = [];
};

if(!settings.bookmarks) {
	settings.bookmarks = [];
}
var bookmark = $("#reader-setting-bookmark");


bookmark.on("click", function() {
	var cfi = VBOOK.Book.getCurrentLocationCfi();
	var bookmarked = isBookmarked(cfi);
	
	if(bookmarked === -1) { //-- Add bookmark
		addBookmark(cfi);
		bookmark
			.addClass("ui-icon-bookmark")
			.removeClass("ui-icon-bookmark-empty"); 
	} else { //-- Remove Bookmark
		removeBookmark(cfi);
		bookmark
			.removeClass("ui-icon-bookmark")
			.addClass("ui-icon-bookmark-empty"); 
	}

});
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