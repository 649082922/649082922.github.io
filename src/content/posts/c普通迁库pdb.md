---
title: c普通迁库pdb
published: 2025-07-10
description: "create user c##user_for_clone identified by user_for_clone container=a"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

1.源库操作CDB
#创建用于克隆的用户
create user c##user_for_clone identified by user_for_clone container=all;
grant create session, sysoper, create pluggable database to c##user_for_clone container=all;

#重启PDB到READONLY状态
alter pluggable database AKIMSG01 close immediate instances=all;
alter pluggable database AKIMSG01 open read only  instances=all;

alter pluggable database AKIMSG02 close immediate instances=all;
alter pluggable database AKIMSG02 open read only  instances=all;

2.目库操作CDB
#创建克隆源dblink
create public database link dblink_clone_pdb
connect to c##user_for_clone identified by user_for_clone
using '(DESCRIPTION =(ADDRESS_LIST =(ADDRESS =(PROTOCOL = TCP)(HOST = 192.168.1.14)(PORT = 1521)))(CONNECT_DATA =(SERVICE_NAME = UATUTF)))';

#克隆数据库
CREATE PLUGGABLE DATABASE AKIMSG01 FROM AKIMSG01@dblink_clone_pdb;
CREATE PLUGGABLE DATABASE AKIMSG02 FROM AKIMSG02@dblink_clone_pdb;

#OPEN PDB
ALTER PLUGGABLE DATABASE AKIMSG01 OPEN;
ALTER PLUGGABLE DATABASE AKIMSG02 OPEN;

#更新补丁字典  （检查是否成功，否则db是受限模式）
cd $ORACLE_HOME/OPatch
./datapatch -pdb AKIMSG01,AKIMSG02

#重启pdb
 alter pluggable database AKIMSG01 close instances=all;
 alter pluggable database AKIMSG01 open instances=all;
 alter pluggable database AKIMSG02 close instances=all;
 alter pluggable database AKIMSG02 open instances=all;

3.添加服务：
主库：

oracle用户：

PDB_NAME="AKIMSG01 AKIMSG02"
CDB_NAME=C19U05UT

for tmp_pdbname in ${PDB_NAME}
do
```
srvctl add service -d ${CDB_NAME} -s ${tmp_pdbname}_R1_S1  -r ${CDB_NAME}1 -a  ${CDB_NAME}2   -pdb ${tmp_pdbname}   -failback yes
srvctl add service -d ${CDB_NAME} -s ${tmp_pdbname}_R2_S1  -r ${CDB_NAME}2 -a  ${CDB_NAME}1   -pdb ${tmp_pdbname}   -failback yes
srvctl add service -d ${CDB_NAME} -s ${tmp_pdbname}_S1     -r ${CDB_NAME}1,${CDB_NAME}2       -pdb ${tmp_pdbname}
srvctl start service -d  ${CDB_NAME} -s ${tmp_pdbname}_R1_S1
srvctl start service -d  ${CDB_NAME} -s ${tmp_pdbname}_R2_S1
srvctl start service -d  ${CDB_NAME} -s ${tmp_pdbname}_S1
```
done

PDB_NAME="AKIMSG01 AKIMSG02"
for tmp_pdb in $PDB_NAME
do
export ORACLE_SID=`ps -ef|grep ora_pmon|grep -v grep |awk '{print $8}'|awk -F'_' '{printf $3}'`
sqlplus -s / as sysdba <<EOF
alter session set container=${tmp_pdb};
alter system set sga_target            =4000M   ;
alter system set shared_pool_size      =500M    ;
alter system set db_cache_size         =1000M   ;
alter system set pga_aggregate_limit   =4000M   ;
alter system set pga_aggregate_target  =2000M    ;
alter system set sessions              =300     ;
alter system set job_queue_processes   =20       ;
alter system set cpu_count             =0        ;
alter system set db_performance_profile=smallplan;
EOF
done
