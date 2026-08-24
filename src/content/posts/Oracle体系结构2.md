---
title: Oracle体系结构2
published: 2024-09-05
description: "alter system checkpoint;	生成检查点（特殊时间点 scn）"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

Oracle实例进程

执行
alter system checkpoint;	生成检查点（特殊时间点 scn）
DBWn和LGWR都会工作，在这个时间的之前的脏块都会落盘

select status from v$instance;	查看当前数据库状态在哪个模式

数据库启动的第一步读取参数文件
参数文件路径:
/u01/app/oracle/product/10.2.0/db_1/dbs
$ORACLE_HOME/dbs
init+库名.ora	pfile参数文件
spfile+库名.ora	spfile参数文件
orapw+SID	数据库密码文件,存放sys密码文件,其他用户密码保存在数据库,sys远程连接会校验
orapwd file=orapw实例名 password=****** force=y	强制创建文件
告警日志路径
$ORACLE_BASE/diag/rdbms/db_name/SID/trace/alert_SID.log

创建spfile文件
create spfile from pfile;	默认路径是$ORACLE_HOME/dbs
create pfile='' from spfile='';	指定路径是file=''
如果在asm中 cp +DATADG/asmdb/spfileasmdb.ora  /tmp/spfileasmdb.ora
spfile优先级高于pfile;

strings 打印可打印的字符串,可以使用strings spfileasmdb.ora打印pfile文件

control01.ctl控制文件丢失可以直接根据其他control.ctl关库直接cp复制粘贴改名
alter system set control_files='路径','路径' scope=spfile;
想查看控制文件内容可以对控制文件备份追踪
alter database backup controlfile to trace as '/tmp/comtrol666.log';
alter system switch logfile;		切换重做日志文件

show parameter spfile;		查看参数文件没值说明使用pfile启动
show parameter control;		查看控制文件
select name from v$controlfile;	查看控制文件
show parameter name;		查看实例名(instance),库名(db)
select name from v$datafile;		查看数据文件
修改oracle内存	参数文件中*.memory_target=833617920	oracle数据库启动需要占用内存833内存空间(sga+pga)

desc 表名;		在SQL>命令窗口可以查看表结构

free -m	查看内存
total		used		free
物理内存		已使用内存	还剩内存

Oracle文件结构
控制文件中保存数据库中关于日志文件/数据文件/临时表空间文件信息;
控制文件正常才能使oracle数据库正常打开/关闭
所有控制文件大小一致,文件的最后修改时间一致

cat  /etc/oratab	记录所有实例信息
记录信息分三段	$ORACLE_SID:$ORACLE_HOME:upstart(N/Y)	实例名:数据库路径:是否开机启动

ps -ef |grep smon	查看运行哪些数据库

source(可以简写成 . )+oraenv(脚本)	在当前shell执行,声明环境变量

select * from v$bgprocess where paddr !='00';	举例
set linesize 300	一行显示300字符
set pagesize 200	一页显示的行数
$ORACLE_HOME/sqlplus/admin/glogin.sql	配置sqlplus显示
col col_name for 长度;	col设置字段长度,设置长度时需区分字段类型
字符类型	a+长度
数值类型   9(9为占位符)

show parameter;	查看oracle参数	大概400+参数,总参数有3000+参数是不能直接看的,称为隐含参数
show parameter db_write;	查看DBWn进程数量,建议数量和逻辑cpu数量相同,提高脏块落盘
show parameter sga_target;	ORACLE实例运行时,SGA占用内存空间大小

修改参数
alter system set 参数=修改值	修改全局生效
alter session set 参数=修改值	仅对当前会话生效
数据类型有布尔型[true(真),false(假)],字符型,数值型
字符串类型的参数修改时需要加引号

oracle中修改参数时需要定义scope来定义参数修改生效范围,若不指定则默认both生效
scope=both/spfile/memory
both	spfile+memory
spfile	仅针对spfile生效,保证重启生效,当前失效	很多参数都要写
memory	仅针对当前实例生效,保证当前生效,重启失效
alter system set sga_target=700M scope=both;

SELECT NAME, ISSES_MODIFIABLE as session, ISSYS_MODIFIABLE as system
  FROM v$parameter
 WHERE NAME IN ('workarea_size_policy',
                'audit_file_dest',
                'sga_target',
                'sga_max_size');--查看参数是否可以在不同会话生效,

数据字典特点
oracle自动维护，保存在system01.dbf文件中
数据字典的特征
dba_，all_，user_	开头

对控制文件进行冗余
alter system set control_files='控制文件第一份的路径,控制文件第二份的路径' scope=spfile;
关库cp,让检查点一致,文件要chown修改权限
cp 控制文件第一份的路径    控制文件第二份的路径

archive log list;	查看归档状态
alter database archivelog;	mount状态下开启归档
alter system set log_archive_dest_1='location=路径';	本地加路径
