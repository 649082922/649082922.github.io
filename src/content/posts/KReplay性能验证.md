---
title: KReplay性能验证
published: 2025-07-27
description: "1、虚拟机【{1}节点 40（Oracle DB 源端、KES 灾备）】还原快照至【[5]全量数据搬迁完成】。"
tags: ["KingbaseES", "实战笔记"]
category: 数据库
draft: false
---

#######################################前情提要#######################################

1、虚拟机【{1}节点 40（Oracle DB 源端、KES 灾备）】还原快照至【[5]全量数据搬迁完成】。
2、虚拟机【{2}节点 50（KReplay 业务重放）】还原快照至【[2]KReplay 部署完成】。
3、虚拟机【{4}节点 111（迁移目标 KES DB）】还原快照至【[6]全量数据搬迁完成】。

编者注：本章实验会借助于测试表 space_layout_dtl、space_seg_dtl 进行验证，因此将虚拟机【{1}
节点 40（Oracle DB 源端、KES 灾备）】和【{4}节点 111（迁移目标 KES DB）】还原快照至【[5]全
量数据搬迁完成】之后的某一个快照或时刻即可

#########################################源端操作192.168.40.40节点操作
1.源端环境检查
su - oracle
env|grep -i sid
lsnrctl status

sqlplus / as sysdba
SELECT name,open_mode FROM v$database;

2.源端基础数据准备
CREATE USER KDTS_RAT IDENTIFIED BY oracle;
GRANT dba,connect TO KDTS_RAT;
GRANT advisor TO KDTS_RAT;
GRANT select any dictionary TO KDTS_RAT;
GRANT administer sql tuning set TO KDTS_RAT;

#清理部分测试数据。
TRUNCATE TABLE space01.space_layout_dtl;
TRUNCATE TABLE space01.space_seg_dtl;

3.统计业务用户SPACE01对应的模式下测试对象及数据量、数据类型信息。
exec DBMS_STATS.GATHER_SCHEMA_STATS('SPACE01');

#表信息
col owner for a20
col table_name for a30
SELECT owner,table_name,num_rows,blocks
FROM dba_tab_statistics WHERE owner='SPACE01'
AND table_name IN('SPACE_LAYOUT_DTL', 'SPACE_SEG_DTL');

col data_type for a30
SELECT distinct owner,table_name,data_type
FROM dba_tab_columns WHERE owner='SPACE01'
AND table_name IN('SPACE_LAYOUT_DTL', 'SPACE_SEG_DTL')
ORDER BY 2;

#########################################目标端操作192.168.40.111节点操作

1.目标端KES环境准备
#清理部分测试数据
su - kingbase
ksql -U system -d test

TRUNCATE TABLE space01.space_layout_dtl;
TRUNCATE TABLE space01.space_seg_dtl;
SELECT count(*) FROM space01.space_layout_dtl;
SELECT count(*) FROM space01.space_seg_dtl;

2.将模式space01中的对象进行碎片整理、统计信息收集。
VACUUM space01.space_base;
VACUUM space01.space_header;
VACUUM space01.space_segment_detail;
VACUUM space01.space_codeshare;
VACUUM space01.space_segment;
ANALYZE space01.space_base;
ANALYZE space01.space_header;
ANALYZE space01.space_segment_detail;
ANALYZE space01.space_codeshare;
ANALYZE space01.space_segment;

\q

3.设置KWR相关参数，便于对重放时对KES的负载进行性能信息采集。
su - kingbase
cat >> /data/kingbase.conf << "EOF"
############KWR add############
track_sql = on
track_instance = on
track_wait_timing = on
track_counts = on
track_io_timing = on
track_functions = 'all'
sys_stat_statements.track = 'top'
sys_kwr.enable = on
EOF

tail -10 /data/kingbase.conf
sys_ctl restart

ksql -U system -d test

CREATE EXTENSION sys_kwr;

\q
4.设置免密连接数据库
vi /data/sys_hba.conf
删除对应的3行,将下列3行换进去

# "local" 只能用于UNIX域套接字
local   all             all                                     trust
# IPv4 本地连接:
host    all             all             127.0.0.1/32            trust
host    all             all             0.0.0.0/0               trust

cat /data/sys_hba.conf | grep -i trust

5.生效后并进行验证。
sys_ctl reload
ksql -Usystem -dtest
\q
ksql -Usystem -dtest -h127.0.0.1 -p54321
\q
ksql -Usystem -dtest -h192.168.40.111 -p54321
\q

6.目标端用于性能监控的用户
--1、用管理员system连接数据库test。
--2、设置用户space01对数据库kingbase的操作权限。
ksql -Usystem -dtest
\c test system
ALTER USER space01 WITH superuser;
GRANT all ON database kingbase TO space01;
--3、设置用户space01对程序包dbms_output的操作权限。
GRANT all ON package dbms_output TO space01;

#########################################源端操作192.168.40.40节点操作

1、登录（或切换至）oracle用户，创建目录db_replay_capture，用于存放工作负载信息。
su - oracle
mkdir db_replay_capture
cd db_replay_capture/
pwd

2.连接数据库管理员sys，创建目录对象db_replay_capture_dir。
sqlplus / as sysdba
CREATE OR REPLACE directory db_replay_capture_dir AS '/home/oracle/db_replay_capture';
GRANT read,write ON directory db_replay_capture_dir TO KDTS_RAT;

#检查数据库的定义信息
set lines 222
col owner for a10
col directory_name for a25
col directory_path for a80
SELECT * FROM dba_directories;
col grantee for a10
col owner for a10
col table_name for a30
col grantor for a10
col privilege for a10
SELECT * FROM dba_tab_privs WHERE grantee='KDTS_RAT';

3.捕获工作负载
#连接数据库管理员sys，查看源端Oracle数据库的当前SCN信息。
col dt for a24
SELECT to_char(systimestamp,'yyyy-mm-dd hh24:mi:ss')dt, current_scn from v$database;
DT			 CURRENT_SCN
------------------------ -----------
2025-02-23 11:03:33	     1084296

#开启工作负载捕获操作。
BEGIN
  DBMS_WORKLOAD_CAPTURE.start_capture (name=>'test_capture_1',
    dir=>'DB_REPLAY_CAPTURE_DIR', duration=> NULL);
END;
/

4.上传测试数据的脚本至/home/oracle中。
cd ~
ls -l ora_*

#新建两个会话窗口，分别执行脚本，模拟数据库操作，以产生相应的工作负载。
nohup sqlplus space01/space01@192.168.40.40:1521/orcl @/home/oracle/ora_space_seg_dtl_V0.01.sql >> /home/oracle/info1.log 2>&1 &
nohup sqlplus space01/space01@192.168.40.40:1521/orcl @/home/oracle/ora_space_layout_dtl_V0.01.sql >> /home/oracle/info2.log 2>&1 &

5.脚本执行完成后，停止工作负载捕获。
sqlplus / as sysdba
BEGIN
  DBMS_WORKLOAD_CAPTURE.finish_capture;
END;
/

6.源端测试表数据信息统计。
SELECT count(*) FROM space01.space_layout_dtl;
SELECT count(*) FROM space01.space_seg_dtl;

7.获取工作负载捕获操作的captureid，查询负载的起止时间时间（或SCN）。
SELECT DBMS_WORKLOAD_CAPTURE.get_capture_info('DB_REPLAY_CAPTURE_DIR') FROM dual;
set lines 222
col start_time for a35
col end_time for a35
SELECT start_scn,to_char(scn_to_timestamp(start_scn),'yyyy-mm-dd hh24:mi:ss') start_time,
  end_scn,to_char(scn_to_timestamp(end_scn),'yyyy-mm-dd hh24:mi:ss') end_time
FROM dba_workload_captures;

 START_SCN START_TIME				  END_SCN END_TIME
---------- ----------------------------------- ---------- -----------------------------------
   1084538 2025-02-23 11:04:06			  1084885 2025-02-23 11:04:39

02/23/25 11:04:06
02/23/25 11:04:39

8.查看捕获到的工作负载生成的相关文件。
cd ~
cd db_replay_capture/
ls -l
ls -l cap
ls -l capfiles
ls -l capfiles/inst1
ls -l capfiles/inst1/aa

9.将工作负载生成的相关文件打包、下载。
cd ~
tar -cf db_replay_capture.tar db_replay_capture
ls -ld db_replay*
编者注：
（1）如需过滤 KDTS 迁移过程中的操作，可以添加过滤器：
exec dbms_workload_capture.ADD_FILTER('FILTER_KDTS','USER','KDTS_RAT');
（2）在多个 pdb 容器环境下，如需过滤掉不需要的 pdb，可以添加过滤器：
exec dbms_workload_capture.ADD_FILTER('FILTER_PDB','PDB_NAME','PDB');

10.收集源端Oracle的AWR、ASH、ADDM报告
#根据负载对应的开始和结束快照id，生成对应的AWR报告。
#根据负载对应的开始和结束快照 id，生成对应的 ASH 报告。
#根据负载对应的开始和结束快照 id，生成对应的 ADDM 报告。
sqlplus / as sysdba
@/u01/app/oracle/product/11.2.0/dbhome_1/rdbms/admin/awrrpt.sql
@/u01/app/oracle/product/11.2.0/dbhome_1/rdbms/admin/ashrpt.sql
@/u01/app/oracle/product/11.2.0/dbhome_1/rdbms/admin/addmrpt.sql

#查看相关报告，进行性能问题分析和处理。

#########################################KReplay端操作192.168.40.50节点操作
1.转换工具参数配置
#将工作负载文件上传至/install中，并进行解压。
scp oracle@192.168.40.40:/home/oracle/db_replay_capture.tar /install
ls -ld /install/db*
cd /install
tar -xf db_replay_capture.tar
ls -ld db*

2.创建目录db_replay_decode，设置属主和权限，用于存放解码后的文件。
cd /install
mkdir db_replay_decode
ls -ld db_replay_decode

3.配置conf目录中conf.properties参数。
cd /install/OracleDecode-20241114/
ls -l
ls -l conf/

vi ./conf/conf.properties

raw.value.char.nchar_charset = UTF-8
raw.value.char.char_charset = UTF-8
raw.cut.output.file.size = 1
raw.parser.source-file = /install/db_replay_capture
raw.parser.target-file = /install/db_replay_decode
raw.parser.name = parser
raw.parser.parallel-count = 8
raw.parser.output-file-xml = false
raw.parser.output-file-binary = true
raw.parser.index-storage = h2
raw.creat.default.login = false
raw.creat.default.logout = true
raw.record.default.transaction.command = false
raw.delete.decode.file = false
raw.parser.kdms-convert = false

cat ./conf/conf.properties |grep -v ^# |grep -v ^$

4.获取转换后的工作负载文件
#执行start.sh开始解码。
cd /install/OracleDecode-20241114/
sh start.sh

#查看目录db_replay_decode中解码后生成的文件。
cd /install/db_replay_decode/
ls -lrt

5.重放前的预处理准备（节点50）
#将目录db_replay_decode中解码后生成的文件，进行预处理操作。
su - kingbase
sys_ctl start -D /install/KES/bin/data
ksql -U kingbase -d kingbase

exec dbms_workload_replay.process_capture('/install/db_replay_decode',1);

#执行预处理统计信息显示函数。
SELECT show_process_capture_statistics();
alter system set max_worker_processes=10;
select sys_reload_conf();

6.备份数据库data目录。
sys_ctl stop -D /install/KES/bin/data
cp -r /install/KES/bin/data /install/KES/bin/databak
sys_ctl start -D /install/KES/bin/data

7.KReplay重放（节点50）
#初始化重放。
ksql -U kingbase -d kingbase
exec dbms_workload_replay.initialize_replay('replay1','/install/db_replay_decode');

SELECT replay_id, conn_id, capture_user, capture_conn
FROM dbms_database_replay.workload_connection_map;

8.生成重映射SQL命令。
SELECT 'exec dbms_workload_replay.remap_connection(' ||conn_id|| ','||'''192.168.40.111'''||', 54321, '||'''test'''||');'
FROM DBA_WORKLOAD_CONNECTION_MAP
WHERE capture_user='SPACE01';

#执行重映射SQL命令,命令上面获得,ip是111节点
exec dbms_workload_replay.remap_connection(3, '192.168.40.111', 54321, 'test');
exec dbms_workload_replay.remap_connection(4, '192.168.40.111', 54321, 'test');

9.设置重放模式、加压或减压策略。
set dbms_database_replay.debug_level = 3;
exec dbms_workload_replay.prepare_replay('TIME', 100, 100);

10.开始数据库重放操作。
exec dbms_workload_replay.start_replay();
\x
SELECT * FROM dba_workload_replays;
\x

#########################################各节点操作节点操作
1.重放结束后，源端、目标端数据比对（节点111）
#手工进行数据比对。
ksql -U space01 -d test
\dt+ space01.*
SELECT count(*) FROM space01.space_layout_dtl;
SELECT count(*) FROM space01.space_seg_dtl;

2.通过KFSMC进行数据比对。

3.重放结束后，收集重放报告（节点50）
SELECT dbms_workload_replay.get_replay_info('/install/db_replay_decode');
SELECT dbms_workload_replay.report(1,'HTML');
SELECT dbms_workload_replay.report(1,'TEXT');

4.收集目标端KES的KWR、KSH、KDDM报告（节点111）
ksql -Usystem -dkingbase
SELECT * FROM perf.kwr_snapshots;
SELECT perf.kwr_report_to_file(1,2,'html','/home/kingbase/kwr_1_2.html');
SELECT perf.ksh_report_to_file_by_snapshots(1,2,'/home/kingbase/ksh_1_2.html','html');
SELECT perf.kddm_report_to_file(1,2,'html','/home/kingbase/kddm_1_2.txt');
