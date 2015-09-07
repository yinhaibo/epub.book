// VBook Reader Javascript library
// @author yinhaibo
// @since 2015.8

var VBOOK = (function(){
	var vReader = {};
	var Book = null;
	var bookURL = null; // EPUB unzip file directory path
	var vbook_skin = null; // VBook user defined skin configure
	var setting = {marginLeft:10, marginRight:10, marginTop:10, margin:10,
			headerHeight:20, footerHeight:20,
			columnGap:80, backgroundColor:"#FFFFFF", foreColor:"#000000", fontSize:"100%"};
	
	vReader.Book = null;
	/////////////////////////////////////////////////
	//Private
	/////////////////////////////////////////////////
	
	var chapterHref2Name = [];

	var needSavePageList = true;
	function initializeBookEventBind(){
		Book.getMetadata().then(function(meta){
			$('#bookTitle').text(meta.bookTitle);
			document.title = meta.bookTitle+" - "+meta.creator;
		});
		
		Book.getToc().then(function(toc){
		  toc.forEach(function(chapter) {
			$('#tocListView').append('<li><a href="#book" onclick="VBOOK.locateBookUrl(\'' 
					+ chapter.href + '\');" data-ajax="false">' 
					+ chapter.label.trim() + '</a></li>');
			// add chapter href 2 name
			chapterHref2Name[chapter.spinePos] = chapter.label.trim();
		  });
		  $('#tocPage').page();
		  $('#tocListView').listview('refresh');
		});
		Book.ready.all.then(function(){
		  document.getElementById("loader").style.display = "none";
		  actionBookHeaderAndFooter("hide");
		  //
		  setInterval('updateClock()', 1000);
		  $('#pageLabel').text('分页中...');
		  //Pagination
		  // check pagenation file
		  readFileFromBookDir("page_list.json", function(data){
			  console.log("read pagination file success.");
			  needSavePageList = false;
			  Book.loadPagination(data)
		  }, function(flag, error){
			  console.log("Read page_list.json file failed:" + error);
			  Book.generatePagination();
		  });
		});
		Book.renderTo("area");

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
			updatePageLabel(location.anchorPage, Book.pagination.lastPage);
			console.log(location.pageRange);
		});
		
		Book.on('renderer:chapterDisplayed', VBOOK.chapterChange);
	}
	
	function updatePageLabel(curPage, totalPage){
		var pageLabel = document.getElementById('pageLabel');
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
		bookURL = book;
		loadVBookSkin(function(options){
			console.log("Open EPUB book:" + bookURL);
			vReader.Book = Book = ePub(bookURL, options);
			Book.renderer.setGap(setting.columnGap);
			initializeBookEventBind();
		});
	}
	
	/**
	 * 加载VBook自定义皮肤，包括页眉，页脚，背景等
	 */
	function loadVBookSkin(successCallback){
		// 读皮肤定义文件
		readFileFromBookDir("vbook_skin.json", function(data){
			// 解析JSON数据
			vbook_skin = JSON.parse(data);
			var cw = document.width,
			    pw, ph, scale;
			var area,header,footer;
			
			if (vbook_skin.margin != undefined){
				setting.marginLeft = vbook_skin.margin.left;
				setting.marginRight = vbook_skin.margin.right;
				setting.marginTop = vbook_skin.margin.top;
				setting.marginBottom = vbook_skin.margin.bottom;
			}
			header = document.getElementById('header');
			if (vbook_skin.header != undefined){
				pw = vbook_skin.header.width,
				ph = vbook_skin.header.height;
				
				scale = cw / pw;
				setting.headerHeight = ph * scale;
				header.style.width = window.width + "px";
				header.style.height = setting.headerHeight + "px"
				header.innerHTML = '<iframe src="' + bookURL + vbook_skin.header.url 
					+'" id="headerIFM" frameborder="0" scrolling="no" width="100%" height="' + setting.headerHeight 
					+ '"></iframe>';
			}else{
				header.innerHTML = '<div id="bookName"><span id="bookTitle">Book Title</span></div>'
					+ '<div id="chapterName"><span id="chapterLabel">Chapter Name</span></div>';
			}
			
			footer = document.getElementById("footer");
			if (vbook_skin.footer != undefined){
				pw = vbook_skin.footer.width,
				ph = vbook_skin.footer.height;
				
				scale = cw / pw;
				setting.footerHeight = ph * scale;
				footer.style.width = window.width + "px";
				footer.style.height = setting.footerHeight + "px"
				footer.innerHTML = '<iframe src="' + bookURL + vbook_skin.footer.url 
					+'" id="footerIFM" frameborder="0" scrolling="no" width="100%" height="' + setting.footerHeight 
					+ '"></iframe>';
			}else{
				footer.innerHTML = '<div id="CurrentTime"><span id="Clock">Time</span></div>'
					+ '<div id="pageLabel"><span id="Pagination">Time</span></div>';
			}
			options = {};
			options.height = (document.height - setting.headerHeight - setting.footerHeight
					- setting.marginTop - setting.marginBottom);
			options.width = (document.width - setting.marginLeft - setting.marginRight);
			area = document.getElementById('area');
			area.style.height =  options.height + "px";
			area.style.width = options.width + "px";
			area.style.marginLeft = setting.marginLeft;
			area.style.marginRight = setting.marginRight;
			area.style.marginTop = setting.marginTop;
			area.style.marginBottom = setting.marginBottom;
			if (vbook_skin.color != undefined){
				vbook_skin.color.background;
			}
			if (vbook_skin.column != undefined){
				if (vbook_skin.column.gap != undefined){
					setting.columnGap = vbook_skin.column.gap;
				}
			}
			
			if (successCallback){
				successCallback(options);
			}
		}, function(flag, error){
			console.log("Load VBook skin failed:" + error);
			document.getElementById('header').innerHTML = '<div id="bookName">Book Title</div>'
				+ '<div id="chapterName"><span id="chapterLabel">Chapter Name</span></div>';
			document.getElementById('footer').innerHTML = '<div id="CurrentTime">Time</div>'
				+ '<div id="pageLabel">Page<</div>';
			area = document.getElementById('area');
			options = {};
			options.height = document.height - 20 - 20 - 10 - 10;
			options.width = document.width - 20 - 20;
			area.style.height = options.height + "px";
			area.style.width = options.width + "px";
			
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
	 * @param filename 要读的文件名
	 * @param successCallback 成功回调函数，参数为文件内容
	 * @param errorCallback 失败回调函数，第一个参数为flag，1表示文件存在，当无法获取文件对象，0表示文件不存在， 第二个参数为调试信息
	 */
	function readFileFromBookDir(filename, successCallback, errorCallback){
		window.resolveLocalFileSystemURL(bookURL + filename, function(fileEntry){
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
			  if (errorCallback) errorCallback(0, "readFileFromBookDir: File does not exist.");
		  });
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
	
	vReader.prevPage = function(){Book.prevPage();}
	vReader.nextPage = function(){Book.nextPage();}
	
	vReader.locateBookUrl = function(url){
		Book.goto(url);
	}
	
	vReader.chapterChange = function(e){
		var chapterIdx = null;
		for (var idx in chapterHref2Name){
			if (chapterIdx == null){ chapterIdx = idx;}
			if (idx > e.spinePos) break;
			if (idx <= e.spinePos){chapterIdx = idx;}
		}
		if (chapterIdx != null){
			var chapterLabel = document.getElementById('chapterLabel');
			if (chapterLabel == undefined){
				if (document.getElementById('headerIFM') != undefined && 
					document.getElementById('headerIFM').contentWindow.document.getElementById('chapterLabel') != undefined){
					document.getElementById('headerIFM').contentWindow.document.getElementById('chapterLabel').innerHTML
						= chapterHref2Name[chapterIdx];
				}
			}else{
				chapterLabel.innerHTML = chapterHref2Name[chapterIdx];
			}
		}
		// set audio event listener
		//initAllAudioElement();
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
		window.resolveLocalFileSystemURL(bookURL, 
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
						destDirEntry.nativeURL + bookName + "/", openEPUBBook);
			});
		}, function(e){
			// no epub file exist, just copy to current directory
			copyFileToSDCard(bookURL, destDirEntry);
		});
	}
	
	return vReader;
}());

