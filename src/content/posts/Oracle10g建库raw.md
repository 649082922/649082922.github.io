---
title: Oracle10g建库raw
published: 2023-11-14
description: "vim /etc/udev/rules.d/60-raw.rules"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

建库

裸设备建库
分区
fdisk /dev/sdc
创建3个1g,8个100m

字符设备文件映射
vim /etc/udev/rules.d/60-raw.rules
ACTION=="add", KERNEL=="sdc5", RUN+="/bin/raw /dev/raw/raw5 %N"
ACTION=="add", KERNEL=="sdc6", RUN+="/bin/raw /dev/raw/raw6 %N"
ACTION=="add", KERNEL=="sdc7", RUN+="/bin/raw /dev/raw/raw7 %N"
ACTION=="add", KERNEL=="sdc8", RUN+="/bin/raw /dev/raw/raw8 %N"
ACTION=="add", KERNEL=="sdc9", RUN+="/bin/raw /dev/raw/raw9 %N"
ACTION=="add", KERNEL=="sdc10", RUN+="/bin/raw /dev/raw/raw10 %N"
ACTION=="add", KERNEL=="sdc11", RUN+="/bin/raw /dev/raw/raw11 %N"
ACTION=="add", KERNEL=="sdc12", RUN+="/bin/raw /dev/raw/raw12 %N"
ACTION=="add", KERNEL=="sdc13", RUN+="/bin/raw /dev/raw/raw13 %N"
ACTION=="add", KERNEL=="sdc14", RUN+="/bin/raw /dev/raw/raw14 %N"
ACTION=="add", KERNEL=="sdc15", RUN+="/bin/raw /dev/raw/raw15 %N"
KERNEL=="raw*",OWNER="oracle",GROUP="dba",MODE="0660"

start_udev

oracle用户
编写映射文件
vim ~/mapfile
system=/dev/raw/raw5
sysaux=/dev/raw/raw6
undotbs1=/dev/raw/raw7
temp=/dev/raw/raw8
users=/dev/raw/raw9
redo1_1=/dev/raw/raw10
redo1_2=/dev/raw/raw11
redo1_3=/dev/raw/raw12
control1=/dev/raw/raw13
control2=/dev/raw/raw14
control3=/dev/raw/raw15

dbca
在选择系统类型中勾选映射关系,选中mapfile配置前面配置每个文件对应磁盘的位置
更换uf8显示界面,点下parameter file
文件路径不对应,检查~/mapfile参数文件
