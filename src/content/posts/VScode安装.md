---
title: VScode安装
published: 2026-01-06
description: "官网地址：https://code.visualstudio.com/"
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

参考
https://blog.csdn.net/Java_ZZZZZ/article/details/131552722

######################################软件下载######################################
1、进入VScode官网
官网地址：https://code.visualstudio.com/
点击【Download】进入下载，不要点击【Download for Windows Stable Build】，否则它会自动帮你下载User Installer用户版本。

【Stable】：稳定版本，比较稳定。

【Insiders】:测试版本，添加了一些新东西，还在测试中，可能会存在一些Bug，不怎么稳定。

2、然后你会看见Windows，Linux，苹果三个版本，我们选择Windows版本，选择System Installer 点击【x64】进行下载，
不要点击【↓ Windows windows8,10,11】，否则它也会自动默认下载User Installer用户版本。

【User Installer】：用户安装程序，VScode安装在你电脑当前账户的目录上，
如果你换了一个其他账户登录你的电脑，那么你就用不了之前那个账户下载的VScode了。

【System Installer】：系统安装程序，VScode不会安装在你电脑的当前账户上，而是直接安装在系统上，所有账户都可以使用。

安装目录修改为
A:\Program Files\Microsoft VS Code

选择附加任务,这里个人需求,全选也无所谓
【创建桌面快捷方式】：在桌面创建VScode快捷方式。
【将“通过Code打开”操作添加到Windows资源管理器文件上下文菜单】： 选中一个 文件 鼠标右键可以通过VScode打开 文件。
【将“通过Code打开”操作添加到Windows资源管理器目录上下文菜单】：选中一个文件夹鼠标右键可以通过VScode打开文件夹。
【将Code注册为受支持的文件类型的编辑器】：对于受支持的文件类型的文件，鼠标右键选择“打开方式”，可以通过“Vscode”打开。
【添加到PATH】：添加VScode文件夹里的bin目录到PATH环境变量里，添加完以后可通过系统命令输入code直接启动VScode。

######################################插件下载######################################

VScode下载插件
1、下载汉化包，点击扩展，在搜索栏搜索Chinese，选择Chinese中文简体点击【Install】进行安装。
（建议少用，多看英文，这是一位优秀的程序员走向成功的标志性成长。不像我，我就不会用汉化包，我直接一手百度翻译走天下。）

Ctrl+shift+x输入 Chinese

安装完后单击【Change Language and Restart】重启VScode软件，刷新一下就变成中文简体了。

2、下载【会了吧】插件，在搜索栏里搜索【会了吧】，这个是在你敲代码时会自动识别你敲的单词进行翻译，
如果你有一个单词不认识，可以点进“会了吧”看看翻译，对英语基础差的人很友好。

Ctrl+shift+x输入 会了吧

3、下载【Open in browser】插件，这个是用来运行代码，并且在浏览器打开，查看运行效果的，这个插件必须下，
否则当你写完HTML网页时你无法运行，无法预览页面，不信你可以先试试能不能运行再回来下载。

Ctrl+shift+x输入 Open in browser

4、下载【Live Server】插件，这个是用于实时预览运行效果，当你使用open in browser运行代码时，
只要你的代码有改变，你就需要手动刷新重新预览页面运行结果，而Live Server是自动刷新运行结果，非常方便，非常滴银性！

Ctrl+shift+x输入 Live Server

######################################编译测试######################################
1、先去B:\需求文档\数据库笔记\JavaScript里创建一个新文件夹取名叫“Workspace”（名字随便取名）。

2、进入VScode找到左上角的≡符号,点击文件,选择点击打开文件夹,将上面建的文件夹打开。

3、找到WORKSPACRE，点击新建文件，名字输入“01.html”,然后点击回车键创建。

4、在刚刚创建的01.html文件下输入代码
<!DOCTYPE html>
<html>
    <head>
        <meta charest="utf-8">
        <title>HTML</title>
    </head>
    <body>
        <h1>软件测试</h1>
    </body>
</html>

5、鼠标右击空白处单击【Open In Default Browser】查看运行结果。
