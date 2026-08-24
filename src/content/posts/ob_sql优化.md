---
title: ob_sql优化
published: 2025-10-10
description: "EXPLAIN BASIC 命令用于最基本的计划展示。"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

文本方式查看执行计划:
EXPLAIN BASIC 命令用于最基本的计划展示。
EXPLAIN EXTENDED 命令用于最详细的计划展示（通常在排查问题时使用这种展示模式）。
EXPLAIN 命令所展示的信息可以帮助普通用户了解整个计划的执行方式。
https://www.oceanbase.com/docs/enterprise-oceanbase-database-cn-10000000000946876
https://www.oceanbase.com/docs/enterprise-oceanbase-database-cn-10000000000946877

sql monitor:
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000819368

等待事件:
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000001573821

查看执行计划:
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000001576822

##############################################################################################
###报告 awr ash
集群>选择集群>性能报告>生成性能报告
租户>选择租户>会话管理>活跃会话历史报告>生成报告

1.查sql的 PLAN_ID,TENANT_ID,找到该sql
select /*+ parallel(16) */ usec_to_time(request_time),
       svr_ip,
	   sid,
	   ret_code,
	   retry_cnt,
	   trace_id,
	   plan_id,TENANT_ID
	   plan_type,
	   elapsed_time,
	   queue_time,
	   execute_time,
	   affected_rows,
	   partition_cnt,
	   query_sql
from gv$ob_sql_audit
where 1=1
and request_time > '2024-xx-xx 09:00:00'
and request_time < '2024-xx-xx 09:10:00'
and query_sql like '%%'
-- and ret_code <> 0; -- 表示没有错误，语句成功执行

或者

select SVT_IP,SVR_PORT,PLAN_ID,TENANT_ID,
 hit_count,
 executions,
 avg_exe_usec,
 slowest_exe_usec,
 plan_id,
 type,
 last_active_time
from oceanbase.V$OB_PLAN_CACHE_PLAN_STAT
where 1=1
and  sql_id='xx'
AND  STATEMENT LIKE 'INSERT INTO T1 VALUES%'\G

2.使用 tenant_id 和 plan_id 访问 V$OB_PLAN_CACHE_PLAN_EXPLAIN 视图查询执行计划相关信息
SELECT * FROM oceanbase.V$OB_PLAN_CACHE_PLAN_EXPLAIN WHERE tenant_id = 1001 AND plan_id = 9228;

或者

SELECT * FROM oceanbase.GV$OB_PLAN_CACHE_PLAN_EXPLAIN
WHERE tenant_id = 1001 AND plan_id = 9228
  AND SVT_IP='' AND SVR_PORT=2882;

3.分析执行计划
SELECT * FROM oceanbase.V$OB_PLAN_CACHE_PLAN_EXPLAIN WHERE tenant_id = 1001 AND plan_id = 9228;
+-----------+----------------+----------+---------+------------+--------------+------------------+------+------+------+----------+
| TENANT_ID | SVR_IP         | SVR_PORT | PLAN_ID | PLAN_DEPTH | PLAN_LINE_ID | OPERATOR         | NAME | ROWS | COST | PROPERTY |
+-----------+----------------+----------+---------+------------+--------------+------------------+------+------+------+----------+
|      1001 | xxx.xxx.xxx.xxx|     2882 |    9228 |          0 |            0 | PHY_INSERT       | NULL |    1 |   12 | NULL     |
|      1001 | xxx.xxx.xxx.xxx|     2882 |    9228 |          1 |            1 |  PHY_EXPR_VALUES | NULL |    1 |    0 | NULL     |
+-----------+----------------+----------+---------+------------+--------------+------------------+------+------+------+----------+
2 rows in set

name :选择用哪个索引来访问数据。选择的索引的名字会跟在表名后面，如果没有索引的名字，则说明执行的是主表扫描。
 这里需要注意，在 OceanBase 数据库中，主表和索引的组织结构是一样的，主表本身也是一个索引。

##############################################################################################
###统计信息
OceanBase 数据库 V4.0 版本的统计信息收集目前主要依靠手动统计信息收集和自动统计信息收集两种方式。
每日合并不会收集统计信息，统计信息收集在 OceanBase 数据库 MySQL 模式和 Oracle 模式的使用是相同的，不区分模式。
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000222327

1.查看统计信息
Oracle：DBA_TAB_COL_STATISTICS
MySQL：OCEANBASE.DBA_TAB_COL_STATISTICS
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000221487

#oceanbase.DBA_OB_TABLE_STAT_STALE_INFO	,4.2.1不适用

2.收集统计信息
#手动收集统计信息
#DBMS_STATS 系统包统计信息收集选项：
PROCEDURE gather_table_stats (
  ownname            VARCHAR2,
  tabname            VARCHAR2,
  partname           VARCHAR2 DEFAULT NULL,
  estimate_percent   NUMBER DEFAULT AUTO_SAMPLE_SIZE,
  block_sample       BOOLEAN DEFAULT FALSE,
  method_opt         VARCHAR2 DEFAULT DEFAULT_METHOD_OPT,
  degree             NUMBER DEFAULT NULL,
  granularity        VARCHAR2 DEFAULT DEFAULT_GRANULARITY,
  cascade            BOOLEAN DEFAULT NULL,
  stattab            VARCHAR2 DEFAULT NULL,
  statid             VARCHAR2 DEFAULT NULL,
  statown            VARCHAR2 DEFAULT NULL,
  no_invalidate      BOOLEAN DEFAULT FALSE,
  stattype           VARCHAR2 DEFAULT 'DATA',
  force              BOOLEAN DEFAULT FALSE
);

PROCEDURE gather_schema_stats (
  ownname            VARCHAR2,
  estimate_percent   NUMBER DEFAULT AUTO_SAMPLE_SIZE,
  block_sample       BOOLEAN DEFAULT FALSE,
  method_opt         VARCHAR2 DEFAULT DEFAULT_METHOD_OPT,
  degree             NUMBER DEFAULT NULL,
  granularity        VARCHAR2 DEFAULT DEFAULT_GRANULARITY,
  cascade            BOOLEAN DEFAULT NULL,
  stattab            VARCHAR2 DEFAULT NULL,
  statid             VARCHAR2 DEFAULT NULL,
  statown            VARCHAR2 DEFAULT NULL,
  no_invalidate      BOOLEAN DEFAULT FALSE,
  stattype           VARCHAR2 DEFAULT 'DATA',
  force              BOOLEAN DEFAULT FALSE
);

#实际执行命令：
CALL DBMS_STATS.GATHER_TABLE_STATS ('testUser01', 'tbl1', method_opt=>'FOR ALL COLUMNS SIZE
   5', granularity=>'ALL', degree=>4, no_invalidate=>FALSE);
Query OK, 0 rows affected

https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000003980722

#选项介绍：
ownname：用户名，如果用户名设置为 NULL，会默认使用当前登录用户名。
tabname：表名。
partname：分区名，默认为 NULL。
estimate_percent：指定使用多少比例的数据计算其分布特征，范围为 [0.000001,100]，如果指定为 NULL，则使用所有数据；
                  默认是 AUTO_SAMPLE_SIZE，由优化器内部决定使用多少比例的数据。
block_sample：是否使用块采样代替行采样，默认是 FALSE 的。

method_opt：设置列级别的统计信息收集方式，主要采用下面的语法方式来设定：
method_opt:
FOR ALL [INDEXED | HIDDEN] COLUMNS [size_clause]
| FOR COLUMNS [size clause] column [size_clause] [,column [size_clause]...]

size_clause:
SIZE integer
| SIZE REPEAT
| SIZE AUTO
| SIZE SKEWONLY

column:
column_name
| (column_name [, column_name])
integer：指定收集列的直方图桶的个数，范围在 [1-2048]。
REPEAT：仅仅只收集已经有收集过的直方图的列的直方图；使用之前收集直方图设置的桶个数。
AUTO：由 OceanBase 数据库优化器来决定是否收集列的直方图，取决于列的使用情况，桶个数使用默认值为 254。
SKEWONLY：仅仅只收集数据分布不均匀的列的直方图；直方图桶个数使用默认值为 254。
degree：统计信息收集时的并行度，默认是 NULL，使用 prefs 配置的并行度（默认为 1）。
granularity：统计信息收集时的分区粒度，目前支持以下几种设置：
 'GLOBAL'：收集全局级别的统计信息。
 'PARTITION'：收集分区级别的统计信息。
 'SUBPARTITION'：收集子分区级别的统计信息。
 'ALL'：收集所有的统计信息(GLOBAL、PARTITION、SUBPARTITION)。
 'AUTO'：使用默认方式收集(GLOBAL、PARTITION、SUBPARTITION) 统计信息，这个是默认值。
 'DEFAULT'：收集 GLOBAL、PATITION 级别的统计信息。
 'GLOBAL AND PARTITION'：收集全局、分区级别的统计信息。
 'APPROX_GLOBAL AND PARTITION'：收集分区级别的统计信息并根据分区信息推导出全局级别的统计信息。
cascade：是否同时收集表的索引统计信息，默认为 TRUE。
force：是否强制收集统计信息，忽略锁的状态，默认 FALSE。

https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000222325
