---
title: IDEA安装
published: 2026-01-09
description: "搜索Download，下载.exe格式"
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

IDEA下载地址：
https://www.jetbrains.com/idea/download/#section=windows

搜索"Download"，下载.exe格式

打开ideaIU-2023.2.exe软件
路径改至
A:\Program Files\JetBrains\IntelliJ IDEA 2023.2
其他next后直接install

安装教程
https://juejin.cn/post/6844904020780253191#heading-1

在A:\Program Files\JetBrains\IntelliJ IDEA 2023.2路径下的bin目录执行软件，输入Licenses
Licenses：

####启动
doskey ls=dir
a:
cd A:\Program Files\JetBrains\IntelliJ IDEA 2023.2\bin
ls
idea64.exe

###################################插件安装###################################
1、打开idea，点击菜单栏file-->settings(设置),或者Ctrl+Alt+S

2、选择Maven
修改
User settings file: A:\Program Files (x86)\apache-maven-3.9.4\conf\settings.xml
Local repository:   A:\Program Files (x86)\apache-maven-3.9.4\repository

3、在弹出的界面中选择Plugins

4、在搜索框中输入chinese,搜索完成后选择第二个带汉图标的点击install

5、安装完成后重启idea，语言即切换成中文
