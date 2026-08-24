---
title: DG搭建删除
published: 2024-07-07
description: "shutdown immediate"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

#备库删除命令
方法一：
shutdown immediate
startup mount
alter system enable restricted session;  --只有restricted session 权限的用户可以登录数据库，已存在的session不会中断
drop database;

方法二：（asmcmd删除数据文件，删除前先关闭数据库）
shutdown immediately
arch_dg
rm -rf ARCHIVELOG CONTROLFILE ONINELOG
data_dg
rm -rf CONTROLFILE DATAFILE ONINELOG TEMPFILE

参数文件要放到asm的话，要建到asm中，并在$ORACLE_HOME/dbs里创建init$ORACLE_SID.ora,设置spfile参数，删除spfile$ORACLE_SID.ora及spfile.ora文件

#修改数据库参数
主库参数：
show parmaeter unique
ALTER SYSTEM SET LOG_ARCHIVE_CONFIG='DG_CONFIG=(ogg,dgogg)' SCOPE=both; --主备数据库唯一名

ALTER SYSTEM SET LOG_ARCHIVE_DEST_2='SERVICE=DGOGGdg LGWR ASYNC VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE) DB_UNIQUE_NAME=dgogg'  SCOPE=both;
									 服务名=备库的tns                                                              备库唯一名
location指定本地路径，service为dataguard备库的service name
可通过查询V$ARCHIVE_DEST 视图来查看具体的属性设置
该参数必须和LOG_ARCHIVE_DEST_STATE_n一一对应

ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_1 = { enable | defer | alternate }  SCOPE=both;
取值范围:enable defer alternate  默认值:enable
enable 指定对应的归档日志路径是生效的，这是默认值
defer 指定对应的归档日志路径是暂时失效的，使用需重新开启(enable)
alternate 指定对应的归档日志路径是备用的，当另外路径失效时启用该路径
设置LOG_ARCHIVE_DEST_n 时相应的LOG_ARCHIVE_DEST_STATE_n也需设置
通过 V$ARCHIVE_DES视图查看该属性值

ALTER SYSTEM SET FAL_CLIENT=OGGdg SID='*' SCOPE=both;   --主库tns名
ALTER SYSTEM SET FAL_SERVER=DGOGGdg SID='*' SCOPE=both; --备库tns名，可以填多个

ALTER SYSTEM SET STANDBY_FILE_MANAGEMENT='AUTO' SID='*' SCOPE=both; --主库创建新的数据文件，备库自动创建该文件

磁带库起库
vim rman_recover.sh
#!/usr/bin/ksh
echo -------------------------begin---------------------------
date
rman target sys/123456@OGGdg auxiliary sys/123456@DGOGG_rman  <<EOF
run {
allocate channel prmy1 device type disk connect 'sys/123456@OGGdg';   --并行
allocate channel prmy2 device type disk connect 'sys/123456@OGGdg';
...
allocate channel prmy10 device type disk connect 'sys/123456@OGGdg';
allocate auxiliary channel stdy1 device type disk;	--并行
allocate auxiliary channel stdy2 device type disk;
...
allocate auxiliary channel stdy10 device type disk;
duplicate target database for standby from active database nofilenamecheck;
sql channel prmy1 "alter system archive log current";
sql channel stdy1 "alter database recover managed standby database disconnect";
release channel prmy1;
release channel prmy2;
...
release channel prmy10;
release channel stdy1;
release channel stdy2;
...
release channel stdy10;
}
exit;
EOF
sleep 90
sqlplus / as sysdba <<EOF
alter database recover managed standby database cancel;
alter database add standby logfile thread 2 group 31 '+DATA_DG' size 1024m;
alter database add standby logfile thread 2 group n '+DATA_DG' size 1024m;
alter database open;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE USING CURRENT LOGFILE DISCONNECT;
exit
EOF
date
echo "-----------------------------END---------------------------"

执行脚本
chmod +x rman_recover.sh
nohup rman_recover.sh > rman_recover.log &
tail -2000f recover.log
