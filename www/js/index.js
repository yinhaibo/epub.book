/**
 * VBook index.js
 * 定义首页自定义脚步
 */

/*计算菜单位置*/
function openGroupMenu(){
	var left, top;
	var rect = document.getElementById('vbook-books-menu').getBoundingClientRect();
	var winrect = document.getElementById('vbook-menu-group').getBoundingClientRect();
	left = rect.right - winrect.width/2;
	top = rect.bottom + winrect.height/2;
	$('#vbook-menu-group').popup("open", {
		x:left,
		y:top});
	/*计算三角型的位置*/
	winrect = document.getElementById('vbook-menu-group').getBoundingClientRect();
	left = rect.left + rect.width/2 - winrect.left;
	rect = document.getElementById('vbook-menu-group-arrow').getBoundingClientRect();
	left -= rect.width/2 * 0.75;
	document.getElementById('vbook-menu-group-arrow').style.left = left + "px";
}

/*书架切换到列表模式*/
function vbook_shelf_switch_list_mode(){
	$('#vbook-shelf-main').removeClass('vbook-shelf').addClass('vbook-shelf-list');
	$('#vbook-menu-item-cover-mode').removeClass('vbook-show').addClass('vbook-hide');
	$('#vbook-menu-item-list-mode').removeClass('vbook-hide').addClass('vbook-show');
	$('#vbook-menu-group').popup("close");
	//TODO:保存配置到用户配置数据库
}

/*书架切换到封面模式*/
function vbook_shelf_switch_cover_mode(){
	$('#vbook-shelf-main').removeClass('vbook-shelf-list').addClass('vbook-shelf');
	$('#vbook-menu-item-cover-mode').removeClass('vbook-hide').addClass('vbook-show');
	$('#vbook-menu-item-list-mode').removeClass('vbook-show').addClass('vbook-hide');
	$('#vbook-menu-group').popup("close");
	//TODO:保存配置到用户配置数据库
}