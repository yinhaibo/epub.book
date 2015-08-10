VBook Project
-------------------------
An electrical book reader and share app software for Android, iPhone, iPad and WindowsPhone devices.

Create by Yinhaibo in data 2015.7

Features:
1. Book list.
2. Book reading, pagination, chapter, image view, bookmark.

Develop:
1. Annotate and comments.
2. Share

=================================================
Cordova 项目
Build
-------------------------------
cordova build

发布
-------------------------------
cordova build android --release
jarsigner -keystore cn.vbook -signedjar VBook_v0.03.apk .\platforms\android\build\outputs\apk\android-release-unsigned.apk cn.vbook
密码：87654321

Debug
需要Andorid手机，并打开调试，并且，安装好驱动
-------------------------------
cordova run --device