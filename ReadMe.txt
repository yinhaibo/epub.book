EPub Book Project
-------------------------
An electrical book reader and share app software for Android, iPhone, iPad and WindowsPhone devices.


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
cordova build android
cordova build ios
cordova run ios
cordova run ios --target="iPad-Air"

iOS真机调试需要加入uuid。

在mac上以下命令可以参看系统提供的仿真环境
./platforms/ios/cordova/lib/list-emulator-images

发布
-------------------------------
-->Windows
cordova build android --release
jarsigner -keystore cn.vbook -signedjar VBook_v0.03.apk .\platforms\android\build\outputs\apk\android-release-unsigned.apk cn.vbook
-->Mac OS X
cordova build android --release
jarsigner -keystore cn.vbook -signedjar VBook_v0.05.apk ./platforms/android/build/outputs/apk/android-release-unsigned.apk cn.vbook


Debug
需要Andorid手机，并打开调试，并且，安装好驱动
-------------------------------
cordova run --device


电子书目录结构：
==========================
dataDirectory
下存用户目录，缺省调试为default目录，下面为epub文件，书籍分页信息，还有解压的目录信息。
|
-<user dir>
   |
   |--aa.epub
   |--aa.page
   |--aa
      |--OPES
      |--...
-<default>
   |--zz.epub
   |--zz.page
   |--zz
      |--OPES
      |--...
