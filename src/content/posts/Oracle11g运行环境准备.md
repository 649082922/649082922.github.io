---
title: Oracle11g运行环境准备
published: 2025-09-16
description: "关闭selinux iptables ip6tables NetworkManager   yum源配置"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

11g 单机 asm

关闭selinux iptables ip6tables NetworkManager   yum源配置

1、设置ip地址
2、设置主机名、修改/etc/hosts,设置主机名和Ip的对应关系

3、安装oracle依赖的软件包
yum -y install binutils-* compat-libstdc++-* compat-libstdc++-*.i686 elfutils-libelf* elfutils-libelf-devel* gcc-* gcc-c++-* glibc-* glibc-*.i686 glibc-common* glibc-devel* glibc-devel*.i686 glibc-headers* ksh* libaio* libaio*.i686 libaio* libaio*.i686 libgcc* libgcc*.i686 libstdc++* libstdc++*.i686 libstdc++-devel* make* sysstat* unixODBC* unixODBC*.i686 unixODBC-devel* unixODBC-devel*

4、建立用户和组
oracle10g		安装管理database软件的用户	oracle用户	dba组
oracle11g 	安装管理database软件的用户	oracle用户	oinstall组
		安装管理grid软件的用户	grid用户		oinstall组

/usr/sbin/groupadd -g 501 oinstall
/usr/sbin/groupadd -g 502 dba
/usr/sbin/groupadd -g 504 asmadmin
/usr/sbin/groupadd -g 506 asmdba
/usr/sbin/groupadd -g 507 asmoper
/usr/sbin/useradd -u 501 -g oinstall -G asmadmin,asmdba,asmoper,dba grid
/usr/sbin/useradd -u 502 -g oinstall -G dba,asmdba oracle

passwd grid
passwd oracle

5、创建基本目录
创建grid目录结构   grid 软件相关路径   grid用户
mkdir -p /u01/app/oraInventory		oracle清单目录,保存甲骨文信息,10g是/u01/app/oracle/oraInventory
chown -R grid:oinstall /u01/app/oraInventory
chmod -R 775 /u01/app/oraInventory

mkdir -p /u01/app/grid			grid用户的oracle_base
chmod -R 775 /u01/app/grid
chown -R grid:oinstall /u01/app/grid

mkdir -p /u01/app/11.2.0/grid		grid用户的oracle_home
chown -R grid:oinstall /u01/app/11.2.0/grid
chmod -R 775 /u01/app/11.2.0/grid

创建oracle目录结构		创建的时database软件相关的路径  oracle用户

/u01/app/oracle/product/11.2/db_1	备注:oracle用户的oracle_home

/u01/app/oracle		oracle用户的$oracle_base,$oracle_home
mkdir -p /u01/app/oracle/cfgtoollogs		dbca/dbua配置工具日志
chown -R oracle:oinstall /u01/app/oracle
chmod -R 775 /u01/app/oracle
chown oracle /u01/app/oraInventory

编写用户.bash_profile
oracle用户操作:
vim ~/.bash_profile
export DISPLAY=192.168.81.1:0.0
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/11.2/db_1
export PATH=$PATH:$ORACLE_HOME/bin
生效 . .bash_profile
grid用户操作:
vim ~/.bash_profile
export DISPLAY=192.168.81.1:0.0
export ORACLE_BASH=/u01/app/grid
export ORACLE_HOME=/u01/app/11.2.0/grid
export PATH=$PATH:$ORACLE_HOME/bin
生效 . .bash_profile
