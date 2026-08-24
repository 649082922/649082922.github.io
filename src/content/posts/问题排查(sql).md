---
title: 问题排查(sql)
published: 2026-02-07
description: "1.执行sql,将sql缓存在数据库"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

1.执行sql,将sql缓存在数据库
select /*+ monitor */
       column_name
from table_name

2.根据sql_fulltext文本，获取想要的sql_id
select sql_fulltext,sql_id
from v$sql
where sql_text like '%/*+ monitor */ %'

3.查看执行计划

3.1获取sql awr
[alter session set container=xxx;]
@?/rdbms/admin/awrsqrpt.sql

3.2获取sql monitor
select dbms_sqltune.report_sql_monitor(sql_id=>'59aigx48d1ngs',type=>'TEXT') report from dual;

查看表,查看target_buffes值
SELECT *
FROM V$BUFFER_POOL;

db_cache_size
ALTER SYSTEM SET db_cache_size = <value> SCOPE = BOTH;

Global Information
记录sql执行用户，执行时间，使用工具等基本信息

Global Stats
Elapsed Time（消耗时间）：表示查询执行的总时间，包括 CPU 时间、等待时间和其他执行时间。它是一个衡量查询执行效率的重要指标。
CPU Time（CPU 时间）：表示查询执行期间 CPU 所消耗的时间。CPU 时间是指在 CPU 上执行指令和计算所用的时间。
IO Waits（IO 等待）：表示查询执行期间涉及到的 IO 操作所等待的时间。它反映了查询在读取或写入数据时由于等待磁盘IO而花费的时间。
Other Waits（其他等待）：表示查询执行期间发生的除了 IO 等待以外的其他等待时间。这可能包括锁等待、资源争用等等。
Fetch Calls（获取调用）：表示从数据库中检索数据所执行的获取操作的次数。每个获取调用通常对应于从数据库中获取一行或一块数据。
Buffer Gets（缓冲区获取）：表示查询执行期间从缓冲区（Buffer Cache）中读取数据块的次数。缓冲区是数据库中用于缓存数据块的内存区域。
Read Reqs（读请求）：表示查询执行期间发起的读取数据请求的次数。这通常对应于从磁盘或其他存储介质中读取数据块的操作。
Read Bytes（读取字节）：表示查询执行期间从磁盘或其他存储介质中读取的字节数。它反映了查询执行期间涉及的数据传输量。
Write Reqs（写请求）：表示查询执行期间发起的写入数据请求的次数。这通常对应于向磁盘或其他存储介质写入数据块的操作。
Write Bytes（写入字节）：表示查询执行期间写入磁盘或其他存储介质的字节数。它反映了查询执行期间涉及的数据传输量。

SQL Plan Monitoring Details (Plan Hash Value=1885709308)
Rows(Estim)：根据统计信息预估行数
Cost：根据统计信息预估成本
TimeActive(s)：活动时间
Start Active：
Execs：执行次数
Rows (Actual)：实际行数
Activity Detail:数据库的异常情况,重点关注

4.查看表统计信息
select OWNER,
       TABLE_NAME,
       COLUMN_NAME,
       NUM_DISTINCT,
       LAST_ANALYZED,
       SAMPLE_SIZE,
       HISTOGRAM
from dba_tab_col_statistics
where OWNER='xxx'
and TABLE_NAME='xx';

直方图

SELECT a.column_name,
       b.num_rows 行数,
       a.num_distinct 基数,
       round(a.num_distinct / decode(b.num_rows, 0, 1, b.num_rows) * 100, 2) 选择性,
       a.histogram 直方图的种类,
       a.num_buckets 桶,
	   a.LAST_ANALYZED
  FROM dba_tab_col_statistics a, dba_tables b
 WHERE a.owner = b.owner
   AND a.table_name = b.table_name
   AND a.owner = upper('oracle')
   AND a.table_name = upper('T231020_1')
   --AND a.column_name = upper('XXX');

5.查看索引状态
SELECT index_name, status
FROM DBA_INDEXES
where OWNER='xxx' and TABLE_NAME='xx';

SELECT T.INDEX_OWNER, T.INDEX_NAME,T.PARTITION_NAME
 FROM DBA_IND_PARTITIONS T
WHERE T.INDEX_OWNER = UPPER(USER_NAME)
  AND T.STATUS = 'UNUSABLE'

##查看索引用的字段
SELECT INDEX_NAME, COLUMN_NAME, COLUMN_POSITION
FROM DBA_IND_COLUMNS
WHERE TABLE_OWNER = '你的表的所有者' AND TABLE_NAME = '你的表名';

N/A:本地分区索引有效
VALID：索引是有效的，没有发现任何问题。
USABLE:分区索引有效
UNUSABLE：索引无效，不能被使用。这可能是由于底层表的结构更改或其他原因导致的。无法使用无效索引来加速查询，并且需要修复或重新创建索引。
IN_PROGRESS：索引正在被创建、重建或重新构建。在这个状态下，索引可能无法使用，直到操作完成。
FAILED：索引创建、重建或重新构建失败。这通常是由于错误或异常情况导致的，需要检查错误日志并采取适当的措施来修复索引。

OPTIMIZER_INDEX_COST_ADJ 参数可以调整索引访问与全表扫描之间的成本平衡。
默认值为100，降低此值会使索引扫描显得更“便宜”，从而更易被选择

##############重建索引##############
SELECT 'ALTER INDEX ' || owner || '.' || index_name ||
         ' rebuild;'
    FROM dba_indexes
	 where status not in ('VALID', 'N/A');

全局索引：
ALTER INDEX owner.idx_name REBUILD [online];
分区索引：
ALTER INDEX owner.idx_name REBUILD PARTITION part1 tablespace tablespacename;
ALTER INDEX owner.idx_name REBUILD PARTITION part2 tablespace tablespacename;

####################################10046使用####################################
参考https://blog.csdn.net/weixin_40913898/article/details/120622200
10046是一个Oracle的内部事件(event)，通过设置这个事件可以得到Oracle内部执行系统解析、调用、等待、绑定变量等详细的trace信息，
即帮助我们解析一条/多条SQL、PL/SQL语句的运行状态，这些状态包括：Parse/Fetch/Execute三个阶段中遇到的等待事件、
消耗的物理和逻辑读、CPU时间、执行计划等。它不仅为我们揭示了一条、多条SQL的运行情况，同时还能帮我们分析一些DDL维护命令的内部工作原理，
RMAN、Data Pump Expdp/impdp等工具缓慢问题。对于SQL性能优化、分析系统的性能有着非常重要的作用。

1.准备当前session使用oradebug
oradebug setmypid

2.激活10046,level 12
oradebug event 10046 trace name context forever,level 12

3.执行目标sql

4.查看激活10046事件后所对应的teace文件
oradebug tracefile_name

5.关闭10046事件
oradebug event 10046 trace name context off

6.使用tkprof查看文件
tkprof 第四步输出的路径
output=tkprof翻译后输出结果存放路径(/home/oracle/xxxxx.trc)

####################################10053使用####################################
oracle 10053事件—执行计划的解析
https://blog.51cto.com/u_12991611/6534467
10053事件event，我们可以监控到CBO对SQL进行成本计算和路径选择的过程和方法。

####################################问题处理####################################

1.收集统计信息,直方图
#用户
BEGIN
    DBMS_STATS.GATHER_SCHEMA_STATS(
        ownname          => 'L7WD_20250303',           -- 用户名/Schema名
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE, -- 自动采样率，（100 采样，更准确但慢）
        method_opt       => 'FOR ALL COLUMNS SIZE AUTO', -- 自动收集直方图
        degree           => 4,                           -- 并行度
        cascade          => TRUE,                        -- 同时收集索引统计
        options          => 'GATHER STALE'              -- 只收集过时的对象（推荐）
    );
END;

        cascade          => FALSE,                        -- 不收集索引统计
        options          => 'GATHER STALE'              -- 只收集过时的对象（推荐）
        options          => 'LIST STALE'                -- 只收集索引

#表
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS --统计表,列,索引的统计信息(对表进行直方图信息收集)
  (ownname          => 'oracle', --要分析表的拥有者
   tabname          => 'T1', --要分析的表名.
   estimate_percent => 100, --采样行的百分比,取值范围[0.000001,100],null为全部分析,不采样.
   method_opt       => 'for all columns size skewonly', --决定histograms(直方图)信息是怎样被统计的.method_opt的取值如下(默认值为FOR ALL COLUMNS SIZE AUTO):
   no_invalidate    => FALSE, --如果将依赖游标设置为TRUE，则不使其无效。如果将依赖游标设置为FALSE，则该过程将立即使依赖游标无效
   degree           => 1, --决定并行度.默认值为null.
   cascade          => TRUE); --是收集索引的信息.默认为FALSE.
END;

2.重建索引
drop index 用户名.索引名
create index 用户名.索引名 on 用户名.表名(字段) tablespace 表空间名 INITRANS 16 online local PARALLEL 6;
alter index 用户名.索引名 NOPARALLEL;

在线直接重建
alter index 用户名.索引名 rebuild ONLINE PARALLEL 6;
alter index 用户名.索引名 NOPARALLEL;

分区索引重建
alter index 用户名.索引名 rebuild PARTITION 分区名 ONLINE PARALLEL 6;
alter index 用户名.索引名 NOPARALLEL;

3.删除直方图
https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_STATS.html#GUID-CC7EA349-B3D0-472A-B3F2-BB4DF4BACC21
--清除当前直方图信息：
BEGIN
  DBMS_STATS.DELETE_COLUMN_STATS(ownname       => 'oracle',
                                 tabname       => 'T231020_1',
                                 colname       => 'OBJECT_NAME',
                                 --p******      => ,要删除统计信息的表分区的名称。如果表已分区且partname为NULL，则删除全局列统计信息。
                                 --stattab       => ,用户统计表标识符描述从哪里删除统计信息。如果stattab是NULL，则直接从字典中删除统计信息。
                                 --statid        => ,与这些统计数据相关联的标识符（可选）stattab（仅在stattab不相关时才相关NULL）。
                                 --cascade_parts => ,如果表已分区并且 ifpartname是NULL，则将其设置为 true 会导致删除所有基础分区的该列的统计信息。
                                 --statown       => ,架构包含stattab（如果不同于ownname）
                                 --no_invalidate => ,收集统计信息时控制相关游标的失效。该参数采用以下值：TRUE,FALSE,AUTO(default)
                                 --force         => ,当此参数的值为 时TRUE，即使锁定也会删除列统计信息
                                 col_stat_type => 'HISTOGRAM' --要删除的列统计信息的类型：HISTOGRAM- 仅删除列直方图,ALL- 删除基列统计数据和直方图
                                 );
END;

--避免下次收集统计信息又恢复：
BEGIN
  DBMS_STATS.SET_TABLE_PREFS(ownname => 'oracle',
                             tabname => 'T231020_1',
                             pname   => 'method_opt',
                             pvalue  => 'for all columns size auto for columns size 1 OBJECT_NAME'
                             );

--pname 首选项名称。以下首选项设置默认值：
--APPROXIMATE_NDV_ALGORITHM
--AUTO_STAT_EXTENSIONS
--CASCADE
--DEGREE
--ESTIMATE_PERCENT
--GRANULARITY
--INCREMENTAL
--INCREMENTAL_LEVEL
--INCREMENTAL_STALENESS
--METHOD_OPT
--NO_INVALIDATE
--OPTIONS
--PREFERENCE_OVERRIDES_PARAMETER
--PUBLISH
--STALE_PERCENT
--TABLE_CACHED_BLOCKS
END;

####################################相关查询####################################

#查看执行计划历史变化

#查看要找的sql的sql_id
select *
from dba_hist_sqltext
where sql_text like '%xxxxxx%'

#根据sql_id查看sql问题
set lines 900
col execs for 999,999,999
col avg_etime for 999,999.999
col avg_lio for 999,999,999.9
col begin_interval_time for a30
col node for 99999
break on plan_hash_value on startup_time skip 1

select ss.instance_number node,
begin_interval_time,
sql_id,
plan_hash_value,
nvl(executions_delta, 0) exe_num, --执行次数
trunc(elapsed_time_delta / 1000000) exe_time,--执行时间
trunc((elapsed_time_delta / decode(nvl(executions_delta, 0), 0, 1, executions_delta)) / 1000000) avg_exe_time,--平均执行时间
buffer_gets_delta lg_read,--逻辑读
trunc((buffer_gets_delta /  decode(nvl(buffer_gets_delta, 0), 0, 1, executions_delta))) avg_lg_read --平均逻辑读
from DBA_HIST_SQLSTAT S, DBA_HIST_SNAPSHOT SS
where sql_id = '6w3u9wccxtyzp'--问题sql语句的sql_id值
and ss.snap_id = S.snap_id
and ss.instance_number = S.instance_number
and s.instance_number=1
and executions_delta > 0
order by NODE,BEGIN_INTERVAL_TIME

查看Oracle保留约1周的历史执行计划
SELECT c.username,
       a.program,
       b.sql_text,
       b.command_type,
       a.sample_time
  FROM dba_hist_active_sess_history a
       JOIN dba_hist_sqltext b
          ON a.sql_id = b.sql_id
       JOIN dba_users c
          ON a.user_id = c.user_id
 WHERE     a.sample_time BETWEEN SYSDATE - 3 AND SYSDATE
         AND b.command_type IN (7, 85)
 ORDER BY a.sample_time DESC;

查看数据库全表扫描的sql_id
SELECT T.SQL_ID
  FROM dba_hist_sql_plan T
 WHERE T.OBJECT_OWNER NOT IN ('SYS')
   AND T.OPTIONS='FULL'
  -- AND T.OBJECT_NAME ='表名'
  -- OBJECT_ALIAS='连接对象'
  -- timestamp begin and
 GROUP BY T.SQL_ID

-- 从 v$sql 视图中选择有关 SQL 查询性能的信息，并按照执行时间降序排序
SELECT sql_id,                  -- SQL 语句的唯一标识符
       executions,              -- SQL 语句执行的次数
       cpu_time,                -- SQL 语句的总 CPU 时间
       elapsed_time,            -- SQL 语句的总体执行时间
       disk_reads,              -- SQL 语句的磁盘读取次数
       buffer_gets,             -- SQL 语句的缓冲区读取次数
       sql_fulltext             -- SQL 语句的完整文本
FROM  v$sql
ORDER BY  elapsed_time DESC;        -- 按照总体执行时间降序排序

相关查询试图：
v$session (当前正在发生)
v$session_wait (当前正在发生)
v$session_wait_history (会话最近的 10 次等待事件)
v$active_session_history (内存中的 ASH 采集信息，理论为 1 小时)
wrh$_active_session_history (写入 AWR 库中的 ASH 信息，理论为 1 小时以上)
dba_hist_active_sess_history (根据 wrh$_active_session_history 生成的视图)

dba_hist_sql_plan (记录所有sql的执行计划信息,可以查找全表扫描用)

#########################################################################
https://blog.51cto.com/ios9/3108383?u_atoken=66628c9463dc09c169cda8d0b42f1bf5&u_asession=01hQrZB0nQSIUfKfBld6bjfXc0xiHlp8zRM5TfGV_Q5LWIZalp4DjUhBAV4xdwAqG6dlmHJsN3PcAI060GRB4YZGyPlBJUEqctiaTooWaXr7I&u_asig=05vF4wabVJwBU0xI2oZn8lp5CfxcEjCvphE4x6j1qKdPiIimLF8Rfa4jOhxtpww5j73BtKwhbyPriUS5L1VhJYJ6K3oU9HMNsVdNPRlNYSoTYES1jYbEZV0I35BgXZa_ZSw4XvbeUZVCGsEIV11lSwRpGxICHfR17OapngE64ECORg2QMxYs6lyXb1lFWKql56C_7Vsumh6FZQtSicPQ2yRbdVV4YiTlvmgMp_THtLryA20SNf7dvAoPwG-sBEo_pjejZypjloUvJ-4-3nP1Q1uP3ckberODEL0ku1zwNxZP-sTpJ-4hEVCCqo-GZeD3WUZHi7af-9T9DT_5BT1SiXZw&u_aref=s4IfmXNxRHC91hxwGaKxM2H4z1I%3D

一、查询执行最慢的sql
select *
 from (select sa.SQL_TEXT,
        sa.SQL_FULLTEXT,
        sa.EXECUTIONS "执行次数",
        round(sa.ELAPSED_TIME / 1000000, 2) "总执行时间",
        round(sa.ELAPSED_TIME / 1000000 / sa.EXECUTIONS, 2) "平均执行时间",
        sa.COMMAND_TYPE,
        sa.PARSING_USER_ID "用户ID",
        u.username "用户名",
        sa.HASH_VALUE
     from v$sqlarea sa
     left join all_users u
      on sa.PARSING_USER_ID = u.user_id
     where sa.EXECUTIONS > 0
     order by (sa.ELAPSED_TIME / sa.EXECUTIONS) desc)
 where rownum <= 50;

二、查询次数最多的 sql
select *
 from (select s.SQL_TEXT,
        s.EXECUTIONS "执行次数",
        s.PARSING_USER_ID "用户名",
        rank() over(order by EXECUTIONS desc) EXEC_RANK
     from v$sql s
     left join all_users u
      on u.USER_ID = s.PARSING_USER_ID) t
 where exec_rank <= 100;

三、Oracle查询SQL语句执行的耗时
select a.sql_text SQL语句,
       b.etime 执行耗时,
       c.user_id 用户ID,
       c.SAMPLE_TIME 执行时间,
       c.INSTANCE_NUMBER 实例数,
       u.username 用户名, a.sql_id SQL编号
  from dba_hist_sqltext a,
       (select sql_id, ELAPSED_TIME_DELTA / 1000000 as etime
          from dba_hist_sqlstat
         where ELAPSED_TIME_DELTA / 1000000 >= 1) b,
       dba_hist_active_sess_history c,
       dba_users u
 where a.sql_id = b.sql_id
   and u.username <> 'SYS'
   and c.user_id = u.user_id
   and b.sql_id = c.sql_id
  -- and a.sql_text like '%insert into  select  %'
 order by  SAMPLE_TIME desc,
  b.etime desc;

四：定位系统里面哪些SQL脚本存在TABLE ACCESS FULL行为
select *
  from v$sql_plan v
 where v.operation = 'TABLE ACCESS'
   and v.OPTIONS = 'FULL'
   and v.OBJECT_OWNER <> 'SYS';

select s.SQL_TEXT
  from v$sqlarea s
 where s.SQL_ID = '4dpd97jh2gzsd'
   and s.HASH_VALUE = '1613233933'
   and s.PLAN_HASH_VALUE = '3592287464';
或
select s.SQL_TEXT from v$sqlarea s where s.ADDRESS = '00000000A65D2318';
