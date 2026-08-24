---
title: Oracle11g安装grid
published: 2024-09-26
description: "创建dg		 创建grid的dg"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

grid
grid用户
解压/tmp/压缩包p3

11g配置asm
创建+asm实例
创建dg		 创建grid的dg

asm	10g仅管理硬盘	diskgroup
asm	11g管理dg,管理css进程资源,管理监听资源
10g	asm配置	datadg	dbca建库时保存数据
11g	asm配置	grid	dbca建库时保存数据,用于存放+ASM实例相关管理信息
安装软件grid配置grid的griddg,grid安装完成使用asmca创建datadg

需要准备disk让asm使用,disk是字符设备文件

sdb 1G分给sdb1	4G分给sdb2
raw1	griddg
raw2	datadg

root用户
vim /etc/udev/rules.d/60-raw.rules
ACTION=="add",KERNEL=="sdb1",RUN+="/bin/raw /dev/raw/raw1 %N"
ACTION=="add",KERNEL=="sdb2",RUN+="/bin/raw /dev/raw/raw2 %N"
KERNEL=="raw*",OWNER="grid",GROUP="asmadmin",MODE="0660"
生效执行start_udev
yum install compat*

grid用户
进到grid执行runInstaller

软件更新,勾选第三跳过

安装并且配置Oracle集群软件,配置Oracle一个独立服务器只安装asm部分相关的功能,升级已经存在的软件,只安装软件
第四个不能选 选第二个

只要英文
创建dg,选择磁盘组特性创建磁盘
name:griddg	冗余:External选外部冗余	大小:不管		勾选:raw1

密码:上为用户密码不同,下为相同		--密码太简单会报错提醒
确定组:asmdba,asmoper,asmadmin
确认路径:上为oracle_base,下为oracle_home	oracle_home路径不能为oracle用户的oracle_home路径报错为正常

--oracle用户负责database软件,oracle_home在oracle_base中
--grid用户负责grid软件,oracle_home不能在oracle_base中

Fix & Check Again 检查环境,使用脚步
Packager可以不装

install
76%执行脚步,未执行全部重做	一定要完成成功再做下一步！！！

成功后创建+ASM实例,创建监听,创建griddg
完成

crs_stat	查看当前集群资源
资源名字
资源类型
指定资源期望状态
指定资源当前状态

创建dg为database提高数据存储

grid用户
asmca
检查dg,点create
name:datadg	冗余:External选外部冗余	勾选:raw2
ok	可视化工具模糊自行摸索找ok

crs_stat
集群会新增datadg资源
free -m	查看内存
