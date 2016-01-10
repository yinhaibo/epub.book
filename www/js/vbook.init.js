/**
 * VBook Initlization Javascript
 * 初始化VBook程序需要的提前建立的初始化程序，需要放在jquery, cordova, 
 * reader, readhelp模块定义之后
 * 程序初始化顺序：
 * (1) initBaseConfigureData(用户配置，用户书架，用户阅历)
 * (2) 特定的页面初始化特定的数据（jQueryMobile的pageinit事件中）
 */
"use strict";

$(document).ready(function(){
	// 此处是 jQuery 事件...
	var _os = detectOS();
			
	if (_os == "Windows" || _os == "Mac"){
		VBOOK.isApp = false;
		VBOOK.refreshUserBookshelf("bookListView");
	}	
	console.log("document load success.");
});
document.addEventListener('deviceready', function(){
	console.log("cordova device ready.");
	VBOOK.deviceReady = true;
	VBOOK.initBaseConfigureData(
		function(){
			VBOOK.refreshUserBookshelf("bookListView");
		},
		function(){
			VBOOK.refreshUserBookshelf("bookListView");
		}
	);
}, false);
