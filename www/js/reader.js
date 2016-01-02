// VBook Reader Javascript library
// @author yinhaibo
// @since 2015.8

var VBOOK = (function(){
	var vReader = {};
	var Book = null;
	var bookURL = null; // EPUB unzip file directory path
	var vbook_skin = null; // VBook user defined skin configure
	var vbook_note = null; // VBook user defined note content information
	vbook_note = [{
			"noteid": "ea2ece58-6631-cc31-c34d-9e9349c6b864",
			"notetime": 1451613484609,
			"cfiBase": "/6/6[html69]",
			"chapter": "Getting Start",
			"notecfi": [{
				"cfi": "epubcfi(/6/6[html69]!4/6/1:50)",
				"length": 27,
				"content": "eep every version of an ima"
			}],
			"stylemode": "a"
		},
		{
			"noteid": "ea2ece58-6631-cc31-c34d-9e9349c6b866",
			"notetime": 1451613484609,
			"cfiBase": "/6/6[html69]",
			"chapter": "Getting Start",
			"notecfi": [{
				"cfi": "epubcfi(/6/6[html69]!4/6/1:100)",
				"length": 27,
				"content": "xxxxxxxxxxx"
			}],
			"stylemode": "b"
		},
		{
			"noteid": "9d2f6c09-0d1c-67c1-5e89-31690b209558",
			"notetime": 1451702726040,
			"cfiBase": "/6/4[html70]",
			"chapter": "Getting Start",
			"notecfi": [{
				"cfi": "epubcfi(/6/4[html70]!4/4/1:5)",
				"length": 15,
				"content": "chapter will be"
			}],
			"stylemode": "a"
		},
		{
			"noteid": "3edf26e8-38fc-6efc-a7f5-47ce5cb9813f",
			"notetime": 1451702771119,
			"cfiBase": "/6/4[html70]",
			"chapter": "Getting Start",
			"notecfi": [{
				"cfi": "epubcfi(/6/4[html70]!4/4/1:75)",
				"length": 23,
				"content": "beginning by explaining"
			}],
			"stylemode": "a"
		}];
			
	var vbook_toc_load = false;
	var setting = {marginLeft:10, marginRight:10, marginTop:20, marginBottom:20,
			headerHeight:20, footerHeight:20, width:"100%", height:"100%", fixedLayout : true,
			columnGap:80, backgroundColor:"#FFFFFF", foreColor:"#000000", fontSize:"100%"};
	
	vReader.Book = null;
	/*公开的设置值，与私有变量不一样*/
	vReader.setting = {chapterHref2Name:[], bookmarks:[], currentPage:1, currentBookName:"", currentChapterName:""};
	vReader.updateBookmarkStatus = null; // function for update bookmark status
	/////////////////////////////////////////////////
	//Private
	/////////////////////////////////////////////////

	var needSavePageList = true;
	function initializeBookEventBind(){
		Book.getMetadata().then(function(meta){
			$('#book-reader-bookTitle').text(meta.bookTitle);
			document.title = meta.bookTitle+" - "+meta.creator;
			vReader.setting.currentBookName = meta.bookTitle;
		});
		
		Book.getToc().then(function(toc){
		  toc.forEach(function(chapter) {
			  vReader.setting.chapterHref2Name[chapter.spinePos] = {chapterHref:chapter.href, chapterText:chapter.label.trim()};
		  });
		});
		Book.ready.all.then(function(){
			document.getElementById("book-reader-loader").style.display = "none";

			actionBookHeaderAndFooter("hide");
			//
			updateClock();
			setInterval('updateClock()', 1000);
			$('#book-reader-pageLabel').text('分页中...');
			//Pagination
			// check pagenation file
			readFileFromBookDir("page_list.json", function(data){
				console.log("read pagination file success.");
				needSavePageList = false;
				Book.loadPagination(data)
			}, function(flag, error){
				console.log("Read page_list.json file failed:" + error);
				console.log(setting);
				Book.generatePagination();
			});
		  
			// Load book note information
			readFileFromBookDir("vbook_note.json", function(data){
				vbook_note = JSON.parse(data);
				// Apply note data to book after chapter loaded.
			});
			
		});
		Book.renderTo("book-reader-area");

		var paginationReady = false;
		// Wait for the pageList to be ready and then show slider
		Book.pageListReady.then(function(pageList){
			paginationReady = true;
			var currentPage = Book.pagination.pageFromCfi(Book.getCurrentLocationCfi());
			updatePageLabel(currentPage, Book.pagination.lastPage);
			if (needSavePageList){
				writeFileToBookDir("page_list.json", JSON.stringify(pageList));
			}
		});
		
		Book.on('book:pageChanged', function(location){
			vReader.setting.currentPage = location.anchorPage;
			updatePageLabel(location.anchorPage, Book.pagination.lastPage);
		});
		
		Book.on('renderer:chapterDisplayed', VBOOK.chapterChange);
		Book.on('renderer:locationChanged', VBOOK.locationChange);
		
	}
	
	function updatePageLabel(curPage, totalPage){
		var pageLabel = document.getElementById('book-reader-pageLabel');
		if (pageLabel == undefined){
			if (document.getElementById('footerIFM') != undefined && 
				document.getElementById('footerIFM').contentWindow.document.getElementById('pageLabel') != undefined){
				document.getElementById('footerIFM').contentWindow.document.getElementById('pageLabel').innerHTML
					= curPage + '/' + totalPage;
			}
		}else{
			pageLabel.innerHTML = curPage + '/' + totalPage;
		}
	}
	
	function openEPUBBook(book){
		setting.screenOrientation = undefined;
		setting.zoom = undefined;
		vReader.setting = {chapterHref2Name:[], bookmarks:[], currentPage:1, currentBookName:"", currentChapterName:""};
		bookURL = book;
		if (window.resolveLocalFileSystemURL == undefined){
			if (Book != null){
				Book.destroy();
			}
			vReader.Book = Book = ePub(bookURL, {width:(document.documentElement.clientWidth - 40), height:(document.documentElement.clientHeight - 60)});
			initializeBookEventBind();
		}else{
			loadVBookSkin(function(options){
				if (Book != null){
					Book.destroy();
				}
				console.log("Open EPUB book:" + bookURL);
				vReader.Book = Book = ePub(bookURL, options);
				initializeBookEventBind();
			});
		}
	}
	
	
	
	/**
	 * 加载VBook自定义皮肤，包括页眉，页脚，背景等
	 */
	function loadVBookSkin(successCallback){
		var docw, doch;
		var area,header,footer;
		docw = screen.width;//document.body.clientWidth;
		doch = screen.height;//document.body.clientHeight;
		setting.screenOrientation = undefined;
		
		// 读皮肤定义文件
		readFileFromBookDir("vbook_skin.json", function(data){
			// 解析JSON数据
			vbook_skin = JSON.parse(data);
			var cw = document.width,
			    pw, ph, scale;
			
			var fixedw, fixedh; // 固定的宽度和高度，如果屏幕不与之匹配，通过文档缩放实现，确保可以优先显示
								// 如果存在该参数，页眉，页脚都不会显示，并在填充边缘显示黑色
			var scalew, scaleh, zoom;
			
			if (vbook_skin.mode != undefined){
				if (vbook_skin.mode.screen != undefined){
					if (vbook_skin.mode.screen == "landscape"){
						if (screen.orientation.substring(0,9) != "landscape"){
							// switch width and height
							//!!! 需要在变换之前设置，Android可以实时反应，而iOS不能
							if (screen.width < screen.height){
								docw = screen.height;//document.body.clientHeight;
								doch = screen.width;//document.body.clientWidth;
							}
							console.log("docw,doch:" + docw + ", " + doch);
							setting.screenOrientation = vbook_skin.mode.screen;
							screen.lockOrientation('landscape-primary');
						}
					}else if (vbook_skin.mode.screen == "portrait"){
						if (screen.orientation.substring(0,8) != "portrait"){
							if (screen.width > screen.height){
								// switch width and height
								docw = screen.height;//document.body.clientHeight;
								doch = screen.width;//document.body.clientWidth;
							}
							setting.screenOrientation = vbook_skin.mode.screen;
							screen.lockOrientation('portrait-primary');
						}
					}else{
						screen.unlockOrientation();
					}
				}
				if (vbook_skin.mode.header == "none"){
					header = "none";
				}
				
				if (vbook_skin.mode.footer == "none"){
					footer = "none";
				}
				
				if (vbook_skin.mode.smartimage == "false"){
					window.localStorage.setItem("vbook-apply-smartimage", "false");
					window.localStorage.setItem("vbook-zoom-image", "false");
				}else{
					// default to apply smart images
					window.localStorage.setItem("vbook-apply-smartimage", "true");
					window.localStorage.setItem("vbook-zoom-image", "true");
				}
				
				if (vbook_skin.mode.smartmedia == "false"){
					window.localStorage.setItem("vbook-apply-smartmedia", "false");
				}else{
					// default to apply smart images
					window.localStorage.setItem("vbook-apply-smartmedia", "true");
				}
				
				if (vbook_skin.mode.fixedwidth != undefined || 
						vbook_skin.mode.fixedwidth != "default" ||
						vbook_skin.mode.fixedwidth != "0"){
					fixedw = parseInt(vbook_skin.mode.fixedwidth);
				}
				
				if (vbook_skin.mode.fixedheight != undefined || 
						vbook_skin.mode.fixedheight != "default" ||
						vbook_skin.mode.fixedheight != "0"){
					fixedh = parseInt(vbook_skin.mode.fixedheight);
				}
				
				if (fixedw != undefined && fixedh != undefined){
					scalew = docw / fixedw;
					scaleh = doch / fixedh;
					if (scalew > scaleh){
						zoom = (scaleh * 100);
						setting.marginLeft = (docw - (fixedw * scaleh))/2;
						setting.marginRight = setting.marginLeft;
						setting.marginTop = 0;
						setting.marginBottom = 0;
					}else{
						zoom = (scalew * 100);
						setting.marginTop = (doch - (fixedh * scalew))/2;
						setting.marginBottom = setting.marginTop;
						setting.marginLeft = 0;
						setting.marginRight = 0;
					}
					setting.zoom = zoom + "%";
					console.log("zoom:" + zoom);
					console.log(setting);
					document.getElementById('book-reader').style.backgroundColor="#000";
				}
			}
			
			if (fixedw != undefined && fixedh != undefined){
				//do nothing
			}else{
				if (vbook_skin.margin != undefined){
					setting.marginLeft = vbook_skin.margin.left;
					setting.marginRight = vbook_skin.margin.right;
					setting.marginTop = vbook_skin.margin.top;
					setting.marginBottom = vbook_skin.margin.bottom;
				}
			}
			if (header == "none" || fixedh != undefined){
				header = document.getElementById('book-reader-header');
				header.style.display = "none";
				setting.headerHeight = 0;
			}else{
				header = document.getElementById('book-reader-header');
				if (vbook_skin.header != undefined){
					pw = vbook_skin.header.width,
					ph = vbook_skin.header.height;
					
					scale = cw / pw;
					setting.headerHeight = ph * scale;
					header.style.width = docw + "px";
					header.style.height = setting.headerHeight + "px"
					header.innerHTML = '<iframe src="' + bookURL + vbook_skin.header.url 
						+'" id="headerIFM" frameborder="0" scrolling="no" width="100%" height="' + setting.headerHeight 
						+ '"></iframe>';
				}else{
					header.innerHTML = '<div id="book-reader-bookName"><span id="book-reader-bookTitle">Book Title</span></div>'
						+ '<div id="book-reader-chapterName"><span id="book-reader-chapterLabel">Chapter Name</span></div>';
					setting.headerHeight = 20;
				}
			}
			
			if (footer == "none" || fixedh != undefined){
				footer = document.getElementById('book-reader-footer');
				footer.style.display = "none";
				setting.footerHeight = 0;
			}else{
				footer = document.getElementById("book-reader-footer");
				if (vbook_skin.footer != undefined){
					pw = vbook_skin.footer.width,
					ph = vbook_skin.footer.height;
					
					scale = cw / pw;
					setting.footerHeight = ph * scale;
					footer.style.width = docw + "px";
					footer.style.height = setting.footerHeight + "px"
					footer.innerHTML = '<iframe src="' + bookURL + vbook_skin.footer.url 
						+'" id="footerIFM" frameborder="0" scrolling="no" width="100%" height="' + setting.footerHeight 
						+ '"></iframe>';
				}else{
					footer.innerHTML = '<div id="book-reader-CurrentTime"><span id="book-reader-Clock">Time</span></div>'
						+ '<div id="book-reader-pageLabel"><span id="book-reader-Pagination">Page</span></div>';
					setting.footerHeight = 20;
				}
			}
			
			//options = {storage:"filesystem", fromStorage:true}; // load from local storage
			options = {fixedLayout:true, spreads:false};
			options.height = (doch - setting.headerHeight - setting.footerHeight
					- setting.marginTop - setting.marginBottom);
			options.width = (docw - setting.marginLeft - setting.marginRight);
			setting.width = options.width;
			setting.height = options.height;
			area = document.getElementById('book-reader-area');
			area.style.height =  options.height + "px";
			area.style.width = options.width + "px";
			area.style.marginLeft = setting.marginLeft + "px";
			area.style.marginRight = setting.marginRight + "px";
			area.style.marginTop = setting.marginTop + "px";
			area.style.marginBottom = setting.marginBottom + "px";
			if (vbook_skin.color != undefined){
				vbook_skin.color.background;
			}
			if (vbook_skin.column != undefined){
				if (vbook_skin.column.gap != undefined){
					options.gap = setting.columnGap = vbook_skin.column.gap;
				}
			}
			
			if (successCallback){
				successCallback(options);
			}
			console.log("finish load vbook.");
		}, function(flag, error){
			console.log("Load VBook skin failed:" + error);
			document.getElementById('book-reader-header').innerHTML = '<div id="book-reader-bookName">Book Title</div>'
				+ '<div id="book-reader-chapterName"><span id="book-reader-chapterLabel">Chapter Name</span></div>';
			document.getElementById('book-reader-footer').innerHTML = '<div id="book-reader-CurrentTime"><span id="book-reader-Clock">Time</span></div>'
				+ '<div id="book-reader-pageLabel"><span id="book-reader-Pagination">Page</span><</div>';
			
			setting.marginTop = 20;
			setting.marginBottom = 20;
			setting.marginLeft = 10;
			setting.marginRight = 10;
			
			// default to apply smart images and media
			window.localStorage.setItem("vbook-apply-smartimage", "true");
			window.localStorage.setItem("vbook-apply-smartmedia", "true");
			window.localStorage.setItem("vbook-zoom-image", "true");
			
			header = document.getElementById('book-reader-header');
			header.style.display = "block";
			header.innerHTML = '<div id="book-reader-bookName"><span id="book-reader-bookTitle">Book Title</span></div>'
				+ '<div id="book-reader-chapterName"><span id="book-reader-chapterLabel">Chapter Name</span></div>';
			setting.headerHeight = 20;
			header.style.height = setting.headerHeight+ "px";
			
			footer = document.getElementById('book-reader-footer');
			footer.style.display = "block";
			footer.innerHTML = '<div id="book-reader-CurrentTime"><span id="book-reader-Clock">Time</span></div>'
				+ '<div id="book-reader-pageLabel"><span id="book-reader-Pagination">Page</span></div>';
			setting.footerHeight = 20;
			footer.style.height = setting.footerHeight+ "px";
			
			area = document.getElementById('book-reader-area');
			//options = {storage:"filesystem", fromStorage:true};
			options = {};
			options.height = (doch - setting.headerHeight - setting.footerHeight
					- setting.marginTop - setting.marginBottom);
			options.width = (docw - setting.marginLeft - setting.marginRight);
			console.log("options:" + options.width + "," + options.height);
			area.style.height = options.height + "px";
			area.style.width = options.width + "px";
			setting.width = options.width;
			setting.height = options.height;
			area.style.marginLeft = setting.marginLeft + "px";
			area.style.marginRight = setting.marginRight + "px";
			area.style.marginTop = setting.marginTop + "px";
			area.style.marginBottom = setting.marginBottom + "px";
			
			document.getElementById('book-reader').style.backgroundColor="#fff";
			if (successCallback){
				successCallback(options);
			}
		});
	}
	
	/**
	 * write file to book directory, if the file has data, old data will be cleared.
	 * @param filename file name which has no path, the file will write to book directory
	 * @param data file data, text data
	 */
	function writeFileToBookDir(filename, data){
		if (window.resolveLocalFileSystemURL == undefined){
			console.log("Cannot support local file system:" + filename);
			console.log((data));
			return;
		}
		window.resolveLocalFileSystemURL(bookURL, function(fileDirEntry){
			fileDirEntry.getFile(filename, {create:true, exclusive:false}, function(fileEntry){
				console.log("reading to write/update " + fileEntry.fullPath);
				fileEntry.createWriter(function(writer){
					var rewrite = false;
					writer.onwrite = function(evt){
						if (rewrite){
							writer.write(data);
							rewrite = false;
						}
						console.log("Write " + filename + " file success.");
					};
					
					if (writer.length > 0){
						console.log("Clear " + filename + " file data.");
						rewrite = true;
						writer.truncate(0);
					}else{							
						writer.write(data);
					}
				},function(error){
					console.log("create write for " + filename + " failed:" + error.code);
				});
			}, function(evt){
				console.log("get " + filename + " file from " + fileDirEntry.fullPath + " failed.");
			});
			
		});
	}
	
	/**
	 * 从书籍目录读文件内容
	 * @param filename 要读的文件名,路径定位在书籍目录下
	 * @param successCallback 成功回调函数，参数为文件内容
	 * @param errorCallback 失败回调函数，第一个参数为flag，1表示文件存在，当无法获取文件对象，0表示文件不存在， 第二个参数为调试信息
	 */
	function readFileFromBookDir(filename, successCallback, errorCallback){
		if (filename == null || filename.length == 0){
			errorCallback(0, "filename error:" + filename);
			return;
		}
		var fullfilename;
		if (bookURL.substring(0, 7) == "file://"){
			fullfilename = bookURL + filename;
		}else{
			// 位于项目目录，不可写，用于测试
			fullfilename = cordova.file.applicationDirectory + "www/" + bookURL + filename;
		}
		window.resolveLocalFileSystemURL(fullfilename, function(fileEntry){
			  console.log("reading to read " + fileEntry.fullPath);
			  fileEntry.file(function(file){
				  var reader = new FileReader();
				  reader.onloadend = function(event){
					  if (successCallback) successCallback(event.target.result)
				  };
				  reader.readAsText(file);
			  }, function(error){
				  if (errorCallback) errorCallback(1, "readFileFromBookDir: Get File Object failed.");
			  });
		  },function(evt){
			  if (errorCallback) errorCallback(0, "readFileFromBookDir: File does not exist:" + fullfilename);
		  });
	}
	
	function vbookNoteSave(noteItem){
		if (noteItem != null && noteItem.noteid != null){
			var found = false;
			if (vbook_note == null){
				vbook_note = [];
			}
			for (var i = 0; i < vbook_note.length; i++){
				if (vbook_note[i].noteid == noteItem.noteid){
					vbook_note[i] = noteItem;
					found = true;
				}
			}
			if (!found){
				vbook_note.push(noteItem);
			}
		}
		writeFileToBookDir("vbook_note.json", JSON.stringify(vbook_note));
	}
	
	function vbookNoteQuery(guid){
		if (vbook_note == null){
			return null;
		}
		for (var i = 0; i < vbook_note.length; i++){
			if (vbook_note[i].noteid == guid){
				return vbook_note[i];
			}
		}
		return null;
	}
	
	function vbookNoteDel(guid){
		if (vbook_note == null){
			return null;
		}
		for (var i = 0; i < vbook_note.length; i++){
			if (vbook_note[i].noteid == guid){
				vbook_note.splice(i, 1);
			}
		}
		writeFileToBookDir("vbook_note.json", JSON.stringify(vbook_note));
		return null;
	}

	/////////////////////////////////////////////////
	// Public
	/////////////////////////////////////////////////
	vReader.open = function(bookURI){
		if (bookURI.slice(-5) == ".epub"){
			buildBookDirStruct("default", bookURI, checkSDCardEPUBFile);
		}else{
			// open directly
			openEPUBBook(bookURI);
		}
	}
	
	vReader.show = function(){
		if (setting.screenOrientation != undefined){
			screen.lockOrientation(setting.screenOrientation);
		}
	}
	
	vReader.prevPage = function(){Book.prevPage();}
	vReader.nextPage = function(){Book.nextPage();}
	
	vReader.locateBookUrl = function(url){
		Book.goto(url);
	}
	
	/**
	 * 加载目录数据
	 * @tocList 目录列表ID字符串，例如'tocListView'
	 * @tocPage 目录列表所在页面ID字符串
	 * @readerPage 阅读页面ID字符串
	 */
	vReader.loadBookTocData = function(tocList, tocPage, readerPage){
		var bookname = window.localStorage.getItem("vbook-book");
		var booknametoc = window.localStorage.getItem("vbook-book-toc");
		if (bookname != booknametoc){
			var href2name = vReader.setting.chapterHref2Name;
			var length = href2name.length;
			$('#'+tocList).empty();
			for(var chapter in href2name){
				$('#'+tocList).append('<li><a href="#" onclick="gotoBookReaderPageChapter(\'' 
						+ href2name[chapter].chapterHref + '\');" data-ajax="true">' 
						+ href2name[chapter].chapterText + '</a></li>');
			}
			$('#'+tocPage).page();
			$('#'+tocList).listview('refresh');
		}
	}
	
	////////////////////////////////////////////
	//Bookmark
	function getCurrentTimeStr(){
		var d = new Date();
		return formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
	}

	
	vReader.addBookmark = function (cfi, briefText) {
		var present = vReader.isBookmarked(cfi);
		if(present > -1 ) return;

		this.setting.bookmarks.push({epubcfi:cfi, brief:briefText, 
			page:this.setting.currentPage, 
			chapterName:this.setting.currentChapterName,
			addTime:getCurrentTimeStr()
			});

	};

	vReader.removeBookmark = function (cfi) {
		var bookmark = vReader.isBookmarked(cfi);
		if( bookmark === -1 ) return;
		//TODO: 需要移除索引
		delete this.setting.bookmarks[bookmark];
	};

	vReader.isBookmarked = function (cfi) {
		var bookmarks = this.setting.bookmarks;
		
		return bookmarks.indexOf(cfi);
	};

	vReader.clearBookmarks = function() {
		this.settings.bookmarks = [];
	};
	
	
	// 通过模板加载书签数据，模板通过JS定义在页面中
	vReader.loadBookBookmarkData = function(bookmarkList, bookmarkPage, readerPage){
		$('#'+bookmarkList).empty();
		this.setting.bookmarks.forEach(function(bookmark) {
			// 通过页面定义的模版，用json对象替换生成html页面
			var itemhtml = template('book-reader-bookmark-template', bookmark);
			$('#'+bookmarkList).append(itemhtml);
		});
		$('#bookmarkListView-bookname').text(vReader.setting.currentBookName);
		$('#'+bookmarkPage).page();
		$('#'+bookmarkList).listview('refresh');
	}
	
	// 通过模板加载笔记数据，模板通过JS定义在页面中
	vReader.loadBookNoteData = function(booknoteList, booknotePage, readerPage){
		$('#'+booknoteList).empty();
		vbook_note.forEach(function(noteobj) {
			var noteitem = {};
			noteitem.epubcfi = noteobj.notecfi[0].cfi; // 使用第一个CFI对象的标签定位
			noteitem.mode = noteobj.stylemode;
			noteitem.chapter = noteobj.chapter;
			noteitem.time = formatDate(new Date(noteobj.notetime), 'yyyy-MM-dd HH:mm:ss');
			noteitem.content = '';
			for(var i = 0; i < noteobj.notecfi.length; i++){
				noteitem.content += noteobj.notecfi[i].content;
			}
			noteitem.comment = '';
			if (noteitem.comment.length == 0){
				noteitem.commentvisible = "hidden";
			}else{
				noteitem.commentvisible="";
			}
			// 通过页面定义的模版，用json对象替换生成html页面
			var itemhtml = template('book-reader-note-template', noteitem);
			$('#'+booknoteList).append(itemhtml);
		});
		$('#noteListView-bookname').text(vReader.setting.currentBookName);
		$('#'+booknotePage).page();
		$('#'+booknoteList).listview('refresh');
	}
	
	//有外部的Hooks调用
	vReader.chapterBeforeDisplay = function(renderer){
		if (setting.zoom != undefined){
			// update zoom
			renderer.doc.body.style.zoom = setting.zoom;
		}
	}
	
	vReader.locationChange = function(){
		if (vReader.updateBookmarkStatus != null){
			vReader.updateBookmarkStatus(Book.getCurrentLocationCfi());
		}
	}
	
	// 加载笔记
	vReader.loadNote = function(note){
		// Apply note to doc
		if (vbook_note != null){
			var cfiBase = Book.renderer.currentChapterCfiBase;
			var ranges = [];
			for (var i = 0; i < vbook_note.length; i++){
				if (vbook_note[i].cfiBase == cfiBase){
					// note is current chapter
					for (var j = 0; j < vbook_note[i].notecfi.length; j++){
						// 获取CFI尾部的便宜量
						var offset = parseInt(/:([0-9]+)\)/.exec(vbook_note[i].notecfi[j].cfi)[1]);
						// 使用EPUB.js库获得CFI指向的文本节点
						var range = Book.renderer.epubcfi.generateRangeFromCfi(vbook_note[i].notecfi[j].cfi, Book.renderer.doc);
						// 可能存在CFI指向的位置已经有笔记的内容已经加载，通过CFI获得Range对象就存在问题
						// 即开始位置与实际偏移存在偏差，需要通过计算节点偏移，找到笔记的真实位置
						if (range.startOffset < offset){
							// 实际的笔记内容不在该节点，需要找到笔记内容的节点
							var container = range.startContainer;
							var curEndOffset = range.startContainer.length;
							while(curEndOffset < offset){
								container = container.nextSibling;
								if (container != null){
									curEndOffset += container.textContent.length;
								}else{
									// 笔记节点偏移错误
									console.log("笔记节点偏移错误：" + vbook_note[i].notecfi[j].cfi);
									break;
								}
							}
							if (curEndOffset >= offset){
								range.setStart(container, offset - (curEndOffset - container.textContent.length));
								range.setEnd(container, range.startOffset + vbook_note[i].notecfi[j].length);
								note.recreateBookNoteObj(range.startContainer, range.startOffset, 
									vbook_note[i].notecfi[j].length, vbook_note[i].noteid, vbook_note[i].stylemode);
								ranges.push(range);
							}
						}else{
							range.setEnd(range.startContainer, range.startOffset + vbook_note[i].notecfi[j].length);
							// 调用vbook.reader库中的笔记函数，建立笔记对象
							note.recreateBookNoteObj(range.startContainer, range.startOffset, 
								vbook_note[i].notecfi[j].length, vbook_note[i].noteid, vbook_note[i].stylemode);
							ranges.push(range);
						}
					}
				}
			}
			console.log(ranges);
		}
	}
	
	vReader.chapterChange = function(e){
		var chapterIdx = null;
		var href2name = vReader.setting.chapterHref2Name;
		for (var idx in href2name){
			if (chapterIdx == null){ chapterIdx = idx;}
			if (idx > e.spinePos) break;
			if (idx <= e.spinePos){chapterIdx = idx;}
		}
		if (chapterIdx != null){
			vReader.setting.currentChapterName = href2name[chapterIdx].chapterText;
			var chapterLabel = document.getElementById('book-reader-chapterLabel');
			if (chapterLabel == undefined){
				if (document.getElementById('headerIFM') != undefined && 
					document.getElementById('headerIFM').contentWindow.document.getElementById('chapterLabel') != undefined){
					document.getElementById('headerIFM').contentWindow.document.getElementById('chapterLabel').innerHTML
						= href2name[chapterIdx].chapterText;
				}
			}else{
				chapterLabel.innerHTML = href2name[chapterIdx].chapterText;
			}
		}
		// set audio event listener
		//initAllAudioElement();
		// Apply user defined note content to chapter
		
		
	}
	
	//
	//For image zoom
	//
	// All images information for PhotoSwipe in current chapter
	var curChImageItems = [];
	var curChAllImages = [];
	
	vReader.hasImageInCurrentGallery = function(){
		for (var i = 0; i < curChAllImages.length; i++) {
			if(curChAllImages[i] == img) {
				return true;
			}
		}
		return false;
	}
	
	
	vReader.updateGalleryImage = function(items){
		curChImageItems.splice(0);
		curChAllImages.splice(0);
		var index = 0;
		items.forEach(function(imgobj){
			// create slide object
			item = {
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
	vReader.imgZoomViewInChapter = function(target, closeHandler){
		//alert("You are click img object");
		// Check current is in current gallery 
		if (!hasImageInCurrentGallery(target)){
			// Load all images
			var images = Book.renderer.contents.querySelectorAll("img"),
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
	
	///////////////////////////////////////////////////////
	// Note
	
	// update a note object
	vReader.updateBookNoteContent = function(noteItem){
		vbookNoteSave(noteItem);
	}
	
	vReader.getBookNoteObj = function(noteid){
		return vbookNoteQuery(noteid);
	}
	
	vReader.removeBookNote = function(noteid){
		return vbookNoteDel(noteid);
	}

	// Build book directory from book url and user information.
	// @param userName 鐢ㄦ埛鍚�
	// @bookURL 书籍的URL
	// @param cbfun 回掉函数，参数为DirectoryEntry对象
	function buildBookDirStruct(userName, bookURL, cbfun){
		var targetDir;
		if (device.platform == "Android"){
			targetDir = cordova.file.externalDataDirectory;
		}else{
			targetDir = cordova.file.dataDirectory;
		}
		window.resolveLocalFileSystemURL(targetDir, 
			function(dir){
				dir.getDirectory(userName, {create:true}, 
					function(dir){								
						console.log("buildBookDirStruct ok:" + dir.nativeURL);
						cbfun(bookURL, dir);										
					}, 
					function(e){console.error("buildBookDirStruct:create user dir error:" + e.code);}
				);
			}, function(e){
				console.error("buildBookDirStruct:get dataDirectory error:" + e.code);
		});
	}
	
	// Get book name from book URL, like xxx.epub, 
	// the function will return xxx for book name.
	function getBookName(bookURL){
		var items = bookURL.split('/');
		if (items != undefined && items.length > 0){
			var bookName = items[items.length-1];
			items = bookName.split('.');
			return items[0];
		}
		console.log("Can't get book name from URL:" + bookURL);
		return ""
	}
	
	function entryUnzipProcess(zipFile, targetDir, cbfun){
		zip.unzip(zipFile, targetDir, function(flag){
			if (flag == 0){
				console.log("entryUnzipProcess:unzip epub file " + zipFile + " to " + targetDir + " successfully.");
				cbfun(targetDir);
			}else{
				console.log("entryUnzipProcess:unzip epub file " + zipFile + " to " + targetDir + " failed.");
			}
		});
	}

	function copyFileToSDCard(bookURL, destDirEntry){
		window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "/www/" + bookURL, 
			function(bookFileEntry){
				var bookName = getBookName(bookURL);
				bookFileEntry.copyTo(destDirEntry, bookFileEntry.name, function(rs){
					console.log("copy to result:" + rs);
					entryUnzipProcess(destDirEntry.nativeURL + bookFileEntry.name, 
							destDirEntry.nativeURL + bookName + "/", openEPUBBook);
				});
			}, function(error){
				console.log("request file failed:" + bookURL + ",code:" +error.code);
			});
	}

	function checkSDCardEPUBFile(bookURL, destDirEntry){
		var bookName = getBookName(bookURL);
		window.resolveLocalFileSystemURL(destDirEntry.nativeURL + bookName + ".epub", function(rs){
			// epub file exist, check unzip directory
			window.resolveLocalFileSystemURL(destDirEntry.nativeURL + bookName + "/", function(rs){
				openEPUBBook(destDirEntry.nativeURL + bookName + "/");
			}, function(e){
				entryUnzipProcess(destDirEntry.nativeURL + bookName + ".epub", 
						destDirEntry.nativeURL + "/", openEPUBBook);
			});
		}, function(e){
			// no epub file exist, just copy to current directory
			copyFileToSDCard(bookURL, destDirEntry);
		});
	}
	
	return vReader;
}());

