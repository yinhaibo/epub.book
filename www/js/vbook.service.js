/**
 * VBook Servic Help Javascript
 * Need jQuery
 */
"use strict";
var VBookService = (function(){
	var vService = {};
	var baseServiceURL = 'http://101.200.73.55/webservice.php';
	
	vService.login = function(username, password, successCallback, errorCallback){
		$.ajax(
		{
			type:'post',
			url : baseServiceURL,
			data:'act=signin' + '&username=' + username + '&password=' + password,
			dataType : 'jsonp',
			success  : function(data) {
				if (data && (data.ret == "0" || data.ret == "2")){
					if (successCallback) successCallback(data);
				}else{
					showTip("用户名或密码错误，请重试");
					if (errorCallback) errorCallback();
				}
			},
			error : function() {
				showTip("登陆失败，请重试");
				if (errorCallback) errorCallback();
			}
		}
		);
	}

	return vService;
}());