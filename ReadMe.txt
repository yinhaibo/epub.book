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
Cordova ��Ŀ
Build
-------------------------------
cordova build

����
-------------------------------
cordova build android --release
jarsigner -keystore cn.vbook -signedjar VBook_v0.03.apk .\platforms\android\build\outputs\apk\android-release-unsigned.apk cn.vbook
���룺87654321

Debug
��ҪAndorid�ֻ������򿪵��ԣ����ң���װ������
-------------------------------
cordova run --device


������Ŀ¼�ṹ��
==========================
dataDirectory
�´��û�Ŀ¼��ȱʡ����ΪdefaultĿ¼������Ϊepub�ļ����鼮��ҳ��Ϣ�����н�ѹ��Ŀ¼��Ϣ��
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