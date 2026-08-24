---
title: sql 历史
published: 2024-03-19
description: "1.oracle查看表水位线表碎片查询以及整理（高水位线）"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

1.oracle查看表水位线表碎片查询以及整理（高水位线）
SELECT table_name,
ROUND ( (blocks * 8), 2) "高水位空间 k",
ROUND ( (num_rows * avg_row_len / 1024), 2) "真实使用空间 k",
ROUND ( (blocks * 10 / 100) * 8, 2) "预留空间(pctfree) k",
ROUND ((  blocks * 8 - (num_rows * avg_row_len / 1024) - blocks * 8 * 10 / 100),2)"浪费空间 k"
FROM user_tables
WHERE temporary = 'N'
ORDER BY 5 DESC;
-----------------------------------

2.查看表上次收集统计信息时间
select table_name,last_analyzed from dba_tables where owner = 'SCHEMA_NAME'

3.查看历史等待事件
select trunc(sample_time, 'mi'), event,sql_id, count(1)
  from dba_hist_active_sess_history
 where sample_time > to_date('2022-07-12 18:00:00', 'yyyy-mm-dd hh24:mi:ss')
   and sample_time < to_date('2022-07-12 19:30:00', 'yyyy-mm-dd hh24:mi:ss')
   -- and instance_number=1
   -- and sql_id='6x3zmz8xw92cf'
 group by trunc(sample_time, 'mi'), event,sql_id
 order by 1 desc, 3, 2

#根据历史等待事件异常sql，找到该sql

DELETE /*+INDEX(T1 WCP_LIMIT_TRANS_IDX_02) */
        FROM WCP_LIMIT_TRANS_T T1 WHERE PARTITION_NO = :1
        AND (T1.CLIENT_ID, T1.CARD_INTERNAL_NBR) IN (
        SELECT /*+INDEX(T2 WCP_CARD_INFO_IDX_3) */
        T2.CLIENT_ID, T2.CARD_INTERNAL_NBR FROM
        WCP_CARD_INFO_T T2
        WHERE T2.REL_CLIENT_ID = :2
        AND T2.REL_INTERNAL_NBR = :3
        AND T2.CARD_TYPE = 'L'
        AND T2.CARD_SEQUENCE_NBR = '00'
        )
        AND ROWNUM <= :4

--6x3zmz8xw92cf
SQL Monitoring Report

SQL Text
------------------------------
DELETE /*+INDEX(T1 WCP_LIMIT_TRANS_IDX_02) */ FROM WCP_LIMIT_TRANS_T T1 WHERE PARTITION_NO = :1 AND (T1.CLIENT_ID, T1.CARD_INTERNAL_NBR) IN ( SELECT /*+INDEX(T2 WCP_CARD_INFO_IDX_3) */ T2.CLIENT_ID, T2.CARD_INTERNAL_NBR FROM WCP_CARD_INFO_T T2 WHERE T2.REL_CLIENT_ID = :2 AND T2.REL_INTERNAL_NBR = :3 AND T2.CARD_TYPE = 'L' AND T2.CARD_SEQUENCE_NBR = '00' ) AND ROWNUM <= :4

Error: ORA-1013
------------------------------
ORA-01013: user requested cancel of current operation

Global Information
------------------------------
 Status              :  DONE (ERROR)
 Instance ID         :  1
 Session             :  APPBATCH (9410:46128)
 SQL ID              :  6x3zmz8xw92cf
 SQL Execution ID    :  16777259
 Execution Started   :  07/13/2022 10:17:13
 First Refresh Time  :  07/13/2022 10:17:19
 Last Refresh Time   :  07/13/2022 11:01:56
 Duration            :  2683s
 Module/Action       :  JDBC Thin Client/-
 Service             :  WCPACT09_r1_s1
 Program             :  JDBC Thin Client

Binds
========================================================================================================================
| Name | Position |   Type    |                                         Value                                          |
========================================================================================================================
| :1   |        1 | CHAR(32)  | 11                                                                                     |
| :2   |        2 | CHAR(128) | 9630112933                                                                             |
| :3   |        3 | CHAR(32)  | S0408002                                                                               |
| :4   |        4 | NUMBER    | 10000                                                                                  |
========================================================================================================================

Global Stats
=============================================================================================
| Elapsed |   Cpu   |    IO    | Concurrency | Cluster  |  Other   | Buffer | Read  | Read  |
| Time(s) | Time(s) | Waits(s) |  Waits(s)   | Waits(s) | Waits(s) |  Gets  | Reqs  | Bytes |
=============================================================================================
|    2683 |    2651 |       25 |        0.04 |     0.88 |     5.25 |     3G | 50214 | 392MB |
=============================================================================================

SQL Plan Monitoring Details (Plan Hash Value=4156913200)

=====================================================================================================================================================================================
| Id |            Operation             |          Name          |  Rows   | Cost |   Time    | Start  | Execs |   Rows   | Read  | Read  | Activity |       Activity Detail        |
|    |                                  |                        | (Estim) |      | Active(s) | Active |       | (Actual) | Reqs  | Bytes |   (%)    |         (# samples)          |
=====================================================================================================================================================================================
|  0 | DELETE STATEMENT                 |                        |         |      |           |        |     1 |          |       |       |          |                              |
|  1 |   DELETE                         | WCP_LIMIT_TRANS_T      |         |      |           |        |     1 |          |       |       |          |                              |
|  2 |    COUNT STOPKEY                 |                        |         |      |           |        |     1 |          |       |       |          |                              |
|  3 |     NESTED LOOPS                 |                        |       1 | 1305 |           |        |     1 |          |       |       |          |                              |
|  4 |      NESTED LOOPS                |                        |    8654 | 1305 |      2678 |     +6 |     1 |        0 |       |       |          |                              |
|  5 |       PARTITION LIST SINGLE      |                        |       1 |    1 |      2678 |     +6 |     1 |       3M |       |       |          |                              |
|  6 |        INDEX SKIP SCAN           | WCP_LIMIT_TRANS_IDX_02 |       1 |    1 |      2678 |     +6 |     1 |       3M | 50214 | 392MB |     0.90 | gc current block 2-way (1)   |
|    |                                  |                        |         |      |           |        |       |          |       |       |          | Cpu (3)                      |
|    |                                  |                        |         |      |           |        |       |          |       |       |          | db file sequential read (20) |
|  7 |       INDEX RANGE SCAN           | WCP_CARD_INFO_IDX_3    |    8654 |   63 |      2683 |     +1 |    3M |        0 |       |       |    99.10 | Cpu (2641)                   |
|  8 |      TABLE ACCESS BY INDEX ROWID | WCP_CARD_INFO_T        |       1 | 1304 |           |        |       |          |       |       |          |                              |
=====================================================================================================================================================================================

select dbms_sqltune.report_sql_monitor(sql_id=>'6x3zmz8xw92cf',type=>'TEXT') report from dual;

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

select trunc(sample_time, 'mi'), event, count(1)
  from v$active_session_history
 where sample_time >
       to_date('2022-07-11 18:00:00', 'yyyy-mm-dd hh24:mi:ss')
 and sample_time <
       to_date('2022-07-13 19:30:00', 'yyyy-mm-dd hh24:mi:ss')
 and sql_id='2ch4qsxmr7a3c'
 group by trunc(sample_time, 'mi'), event
 order by 1 desc, 3, 2

select sql_text from  v$sql where sql_id='6x3zmz8xw92cf'
select sql_text from  dba_hist_sqltext where sql_id='6x3zmz8xw92cf'

--UPDATE /*+ OPT_PARAM('_parallel_syspls_obey_force' 'false') */ OPTSTAT_HIST_CONTROL$ SET SPARE6 = SYSTIMESTAMP WHERE SNAME = 'SCAN_RATE' AND (SPARE6 < SYSTIMESTAMP - NUMTODSINTERVAL(:B1 , 'minute') OR SPARE6 IS NULL)

select sql_id from  dba_hist_active_sess_history
 where sample_time >
       to_date('2022-07-12 18:00:00', 'yyyy-mm-dd hh24:mi:ss')
 and sample_time <
       to_date('2022-07-12 19:30:00', 'yyyy-mm-dd hh24:mi:ss')
 and event='enq: TX - row lock contention'

select * from v$sql where sql_text like '%DELETE%/*+INDEX(T1 WCP_LIMIT_TRANS_IDX_02) */%'
select * from dba_hist_sqltext where sql_text like '%DELETE%/*+INDEX(T1 WCP_LIMIT_TRANS_IDX_02) */%'  -- 2ch4qsxmr7a3c

DELETE
/*+INDEX(T1 WCP_LIMIT_TRANS_IDX_02) */
FROM
  WCP_LIMIT_TRANS_T T1
WHERE
  PARTITION_NO = '11'
  AND (T1.CLIENT_ID,
	T1.CARD_INTERNAL_NBR) IN (
	SELECT
		/*+INDEX(T2 WCP_CARD_INFO_IDX_3) */
		T2.CLIENT_ID,
		T2.CARD_INTERNAL_NBR
	FROM
		WCP_CARD_INFO_T T2
	WHERE
		T2.REL_CLIENT_ID = '9630112933'
		AND T2.REL_INTERNAL_NBR = 'S0408002'
		AND T2.CARD_TYPE = 'L'
		AND T2.CARD_SEQUENCE_NBR = '00' )
	AND ROWNUM <= 10000

4.sql分析
set linesize 400 pagesize 9999
col shijian for a12
col execu_d for 999999
col bufferg_d for 9999999999
col diskr_d for 9999999999
col et_d for 99999999
col cput_d for 99999999
col io_time for 999999
col clus_time for 999999
col ap_time for 999999
col cc_time for 999999
col et_onetime for 999999
select
    a.snap_id snap,
    to_char(b.END_INTERVAL_TIME,'yyyymmddhh24') shijian,
    PLAN_HASH_VALUE plan,
    sum(a.EXECUTIONS_DELTA) execu_d,
    sum(a.BUFFER_GETS_DELTA ) bufferg_d,
    sum(a.DISK_READS_DELTA ) diskr_d,
    sum(a.ELAPSED_TIME_DELTA/1000000) et_d,
    sum(a.CPU_TIME_DELTA/1000000)  cput_d,
    sum(IOWAIT_DELTA/1000000) io_time,
    sum(CLWAIT_DELTA/1000000) clus_time,
    sum(APWAIT_DELTA/1000000) ap_time,
    sum(ccwait_delta/1000000) cc_time,
    sum(ROWS_PROCESSED_DELTA) rows_processed,
    decode(sum(a.EXECUTIONS_DELTA), 0, sum(a.ELAPSED_TIME_DELTA) / 1000000, sum(a.ELAPSED_TIME_DELTA) / sum(a.EXECUTIONS_DELTA) / 1000000) et_onetime_s
from
    dba_hist_sqlstat a,
    dba_hist_snapshot b
where
    a.SNAP_ID =b.SNAP_ID
and a.INSTANCE_NUMBER=b.INSTANCE_NUMBER
and a.sql_id='&sql_id'
group by
    a.snap_id,
    to_char(b.END_INTERVAL_TIME,'yyyymmddhh24'),
    PLAN_HASH_VALUE
 order by 1;
