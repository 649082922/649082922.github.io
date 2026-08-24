---
title: linux下rman脚本
published: 2024-06-19
description: "mkdir /oradata/rman"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

rman备份
-1.进入linux系统175(要备份的目标服务器)

-2.切换到oracle用户下
su - oracle

-3.创建一个放rman的目录
mkdir /oradata/rman

-4.创建一个查看rman备份日志的目录
mkdir /oradata/rman/rman_log

-4.创建一个存放rman备份文件的目录
mkdir /oradata/rman/rman_backup

-5.连接rman
rman target  /

-6.查看rman所能涉及到的相关参数
show all
-6.1.输入命令:configure retention policy to redundancy 3; #策略配置为冗余3
-6.2.输入命令:configure controlfile autobackup on;

-7.退出
exit

-8.创建shell脚步
vi /oradata/rman/full.sh

#!/bin/bash
. ~/.bash_profile
export nls_date_format='yyyy-mm-dd hh24:mi:ss'

echo '----------------------------------'>>/home/oracle/rman/rman_full.log
echo 'start full backup at '`date +%y-%m-%d:%h:%m:%s` >>/home/oracle/rman/rman_full.log
echo '----------------------------------'>>/home/oracle/rman/rman_full.log

rman target / nocatalog log /home/oracle/rman/rman_full.log append<<eof
run{
allocate channel c1 type disk;
allocate channel c2 type disk;
allocate channel c3 type disk;
allocate channel c4 type disk;
crosscheck backup;
delete noprompt expired backup;
crosscheck archivelog all;
delete noprompt expired archivelog all;
backup as compressed backupset database format '/home/oracle/rman/full_%d_%t_%s_%p';
sql 'alter system archive log current';
sql 'alter system archive log current';
backup archivelog all delete input format '/home/oracle/rman/arch_%d_%t_%s_%p';
backup current controlfile format '/home/oracle/rman/ctl_%d_%t_%s_%p';
backup spfile format '/home/oracle/rman/%d_%u.spfile' ;
report obsolete;
delete noprompt obsolete;
release channel c1;
release channel c2;
release channel c3;
release channel c4;
}
eof

-9.验证,再打开一个窗口进到175
tail -f /oradata/rman/rman_log/rman_full.log

-10.执行脚步
sh /oradata/rman/full.sh   &

验证
第9步或完成脚本后查看/oradata/rman/rman_log/rman_full.log文件

回退
无更改操作,不需要回退

delete expired删除的是那些本来RMAN以为存在但是实际上在磁盘或者磁带上已经被删除了的信息，删除的只是RMAN资料库中的记录；
delete obsolete则删除旧于备份保留策略定义的备份数据同时也更新RMAN资料库以及控制文件。
######################################部署定时需要的脚本######################################

1.编辑/home/oracle/backup/backup.sh脚本
vi /home/oracle/backup/backup.sh

if [ $# -eq 0]
then
  WORKDATE=`date +'%Y-%m-%d'`
else
  WORKDATE=$1
fi

echo "Begin Backup---------------------------------"
date
cd
--若为aix系统,则是. ~/.profile
. ~/.bash_profile
--若为远程备份,则是rman target /@需要备份的库的tns catalog /@本机tns cmdfile /home/oracle/backup/backup.sql
--该方法适用于从远程获取其他数据库rman备份文件
rman target / cmdfile /home/oracle/backup/backup.sql
RETCODE=$?
date
if [ "$RETCODE"="0" ]
then
  echo "**********end backup successfully**********"
else
echo "#######end backup in error! please check the rman log!########"
fi

2.编辑/home/oracle/backup/backup.sql脚本
vi /home/oracle/backup/backup.sql

run{
allocate channel c1 type disk;
allocate channel c2 type disk;
allocate channel c3 type disk;
allocate channel c4 type disk;
delete noprompt archivelog until time 'sysdate-7';
backup as compressed backupset database format '/home/oracle/rman/DB_%d_%U_%T.bak';
sql 'alter system switch logfile';
sql 'alter system switch logfile';
release channel c1;
release channel c2;
release channel c3;
release channel c4;
}
change archivelog all crosscheck;
run{
allocate channel ch1 device type disk;
backup current controlfile format '/home/oracle/rman/CTL_%d_%U_%T.bak';
release channel ch1;
}
run{
allocate channel dev1 type disk;
allocate channel dev2 type disk;
sql 'alter system checkpoint';
sql 'alter system switch logfile';
backup as compressed backupset archivelog all delete input format '/home/oracle/rman/LOG_%d_%U_%T.bak';
release channel dev1;
release channel dev2;
}
change archivelog all crosscheck;
delete noprompt archivelog until time 'sysdate-3';
change archivelog all crosscheck;
crosscheck backup;
delete expired backup;
report obsolete;
delete obsolete;

3.授权执行,加入定时任务设置晚上10点,追踪日志
nohup /home/oracle/backup/backup.sh >> backup.log &

crontab -e
* 22 * * * /home/oracle/backup/backup.sh >> backup.log

tail -f backup.log

##############################################脚本报错处理##############################################
执行delete obsolete;时报错,原因是在执行show all;的时候,
CONFIGURE SNAPSHOT CONTROLFILE NAME TO '/u01/app/oracle/product/11.2.0/db_1/dbs/snapcf_db1.f'; # default
以上控制文件不存在,重新设置控制文件即可

RMAN-03009: failure of delete command on ORA_DISK_4 channel at 11/01/2022 13:55:45
ORA-19606: Cannot copy or restore to snapshot control file
或者
RMAN-03009: failure of delete command on ORA_DISK_4 channel at 11/01/2022 13:55:45
ORA-00245: control file backup failed; target is likely on a local file system

解决办法：重建 snapshot controlfile文件

1、重命名SNAPSHOT控制文件
```
RMAN> configure snapshot controlfile name TO '/u01/app/oracle/product/11.2.0/dbs/snapcf_aps.f_bak'; # default
```

```
RMAN> backup tablespace system tag=system_tbs_bak;
```

2、crosscheck controlfilecopy快照控制文件
```
RMAN> crosscheck controlfilecopy '/u01/app/oracle/product/11.2.0/dbs/snapcf_aps.f';
```

3、删除过期controlfilecopy快照控制文件
```
RMAN> delete expired controlfilecopy '/u01/app/oracle/product/11.2.0/dbs/snapcf_aps.f';
```

4、配置默认快照控制文件
```
RMAN> configure snapshot controlfile name clear;
```

还有一种可能:rac 环境，控制文件快照备份设置到单节点本地导致其他实例无法写入快照文件
将控制文件快照备份的位置更改到共享存储ASM磁盘位置即可
-----------------------------------
ORACLE---ORA-19606(RMAN删除obsolete报错)
https://blog.51cto.com/u_14286115/5194500
