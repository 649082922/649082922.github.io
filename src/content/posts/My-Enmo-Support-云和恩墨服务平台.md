---
title: My Enmo Support - 云和恩墨服务平台
published: 2024-06-09
description: "MES平台服务_MySQL巡检工具"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

MES平台服务_MySQL巡检工具
介绍
MES平台服务 mysql巡检工具，分为两个部分：
1，mysql.sh脚本用于在linux系统上采集数据库巡检数据。
2，mysql inspection_1.0.exe程序用于在windows系统上生成word版的巡检报告。

应用此工具，可以对主机，数据库需要巡检的信息进行一次性采集，并快速生成包含采集信息，关键参数说明和参数是否符合最佳实践判断的文档，方便运维人员在此基础上制作完整可交付的巡检报告。

使用说明
1，采集数据
mysql.sh 为在数据库主机上执行的采集信息脚本。
将mysql.sh拷贝到需要进行巡检mysql 数据库的linux主机上，然后执行，执行完成后会在当前目录生成一个以mysql 数据库名，ip 和日期拼接成的txt文件，例如:mysqldb01_192.168.100.200_20230607102706.txt，即为采集结果。

采集脚本执行命令为：
sh /opt/scripts/mysql.sh -excmysql /opt/idc/mysql8.0/bin/mysql -dbhost 192.168.100.201 -dbport 8032 -dbuser dbadmin -pass 123456

参数说明：
-excmysql mysql 安装目录
-dbhost 主机ip
-dbport mysql端口
-dbuser 登录数据库的用户
-pass 用户密码

巡检内容说明：
主机信息：

主机名
内核版本
操作系统
CPU核心数
主机内存
内存使用
总SWAP
SWAP使用
数据库类型
架构
数据库IP
数据库端口
数据库版本
内存使用情况
cpu使用情况
resource limit
limits.conf
swap method
io scheduler
disk mount
my.cnf detail

数据库信息：

数据库关键状态信息
数据库关键参数信息
replication info
非innodb表
无主键表
非utf8的表
分区表
自增键使用率
db size
data free size
innodb 信息中的 LATEST DETECTED DEADLOCK

2，生成报告
在windows系统上，双击执行mysql inspection_1.0.exe，会弹出选择框，选择mysql.sh采集的元数据txt文件，点击打开。

然后会根据采集内容，在当前目录生成一份mysql巡检报告。
