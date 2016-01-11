////////////////////////////////////////////////////////////////
// File Utils for cordova file and cordova file transfer plugin
// 2016.1.3
//
////////////////////////////////////////////////////////////////
// File
function getExternalDir(){
	var targetDir;
	if (device.platform == "Android"){
		targetDir = cordova.file.externalDataDirectory;
	}else{
		targetDir = cordova.file.dataDirectory;
	}
	return targetDir;
}
function createDir(path, dirname, successCallback, errorCallback)
{
	window.resolveLocalFileSystemURL(path, function(dir){
		dir.getDirectory(dirname, {create:true}, 
			function(dir){
				if (successCallback) successCallback(dir);
			},function(e){
				if (errorCallback) errorCallback(e);
			}
		);
	},function(e){
		if (errorCallback) errorCallback(e);
	});
}

function moveFile(oldfilename, newfilename, successCallback, errorCallback){
	window.resolveLocalFileSystemURL(oldfilename, function(a){
		var parentDir = newfilename.substring(0, newfilename.lastIndexOf('/')+1);
		var newfile = newfilename.substring(newfilename.lastIndexOf('/')+1);
		window.resolveLocalFileSystemURL(parentDir, 
			function(d){
				a.moveTo(d, newfile, successCallback, errorCallback);
			},
			errorCallback
		);
	},errorCallback);

	 
}
function fileIsExist(filename, successCallback, errorCallback){
	window.resolveLocalFileSystemURL(filename, function(fileEntry){
		if (successCallback) successCallback();
	},function(e){
		if (errorCallback) errorCallback(e);
	});
}
////////////////////////////////////////////////////////////////
// File transfer

// File download from server
function fileUtil_Download(localfile, remoteuri, successCallback, errorCallback, progressCallback){
	var fileTransfer = new FileTransfer();
	if (progressCallback){
		fileTransfer.onprogress = function(progressEvent) {
			if (progressEvent.lengthComputable) {
				progressCallback(parseInt(progressEvent.loaded / progressEvent.total * 100));
			} else {
				console.log("progressEvent:++");
				console.log(progressEvent);
			}
		};
	}

	var uri = encodeURI(remoteuri);

	fileTransfer.download(
		uri,
		localfile,
		function(entry) {
			console.log("download complete: " + entry.toURL());
			if (successCallback) successCallback(localfile);
		},
		function(error) {
			console.log("download error source " + error.source);
			console.log("download error target " + error.target);
			console.log("upload error code" + error.code);
			if (errorCallback) errorCallback(error.code);
		},
		false,
		{
			headers: {
				"Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
			}
		}
	);
}