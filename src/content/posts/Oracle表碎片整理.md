---
title: Oracle表碎片整理
published: 2024-09-20
description: "Oracle 多表碎片回收（降低高水位）存储脚本"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

碎片回收
Oracle 多表碎片回收（降低高水位）存储脚本
https://support.enmotech.com/article/2913/search

脚本功能
由于shrink操作时间较长，并且需要后台常驻不能断开。如果有多张表需要做碎片回收操作。
可以通过如下过程来后台回收碎片。我们仅需在过程中修改需要回收多张表的名称即可。
  a.table_name IN ('tablename1','tablename2','tablename3')

注：此脚本用例运行在Oracle 11.2.0.4。

########################################脚本使用示例########################################
create or replace procedure ETL_PARTITION_shrink is
/*清理碎片,回收表空间*/
  V_NAMES VARCHAR2(1024);
  --V_CS        VARCHAR2(1024);
  V_SQL_VALUES       VARCHAR2(4000);
  V_SQL_SPACE_VALUES VARCHAR2(4000);
  V_SQL_MOVE_VALUES  VARCHAR2(4000);

  V_START_TIME DATE; --开始时间
  V_END_TIME   DATE; --结束时间
  V_IN_PARAM   VARCHAR2(500); --传入参数
  V_COUNT      INTEGER; --记录要处理表中记录数
  V_SUCCESS    INTEGER; --记录成功执行的记录数

CURSOR CUR_BATCH IS
SELECT distinct a.owner,
       a.table_name,
       a.num_rows,
       a.avg_row_len,
       round(a.avg_row_len * a.num_rows/1024/1024, 2) real_bytes_MB,
       round(b.seg_bytes_mb, 2) seg_bytes_mb ,
      (round(b.seg_bytes_mb, 2) - round(a.avg_row_len * a.num_rows/1024/1024, 2) )  GAP,
       decode(a.num_rows, 0, 100, (1-round(a.avg_row_len * a.num_rows/1024/1024/b.seg_bytes_mb, 2))*100)||'%' frag_percent
 FROM dba_tables a,
   ( SELECT  owner, segment_name, sum(bytes/1024/1024) seg_bytes_mb
   FROM dba_segments
   GROUP BY owner, segment_name) b,
  dba_segments c
 WHERE   a.table_name IN ('tablename1','tablename2','tablename3')
       AND owner = upper('owner') ---此处填入需要收缩表的用户，防止多用户表名相同
      AND a.table_name=b.segment_name
     AND a.table_name=c.segment_name
      AND a.owner=b.owner
 AND a.owner not IN ('SYS', 'SYSTEM', 'OUTLN', 'DMSYS', 'TSMSYS', 'DBSNMP', 'WMSYS', 'EXFSYS', 'CTXSYS', 'XDB', 'OLAPSYS', 'ORDSYS', 'MDSYS', 'SYSMAN')
  ORDER BY gap desc;

BEGIN
  V_START_TIME := SYSDATE;

--需要开关行迁移，不需要重建索引，
--V_NAMES :='V_SQL_VALUES';
  V_SQL_VALUES := 'alter table /*+APPEND*/ ' || V_NAMES ||' enable row movement nologging parallel 4';
  EXECUTE IMMEDIATE V_SQL_VALUES;

--V_NAMES :='V_SQL_SPACE_VALUES';
  V_SQL_SPACE_VALUES := 'alter table ' || V_NAMES || ' shrink space cascade';
  EXECUTE IMMEDIATE V_SQL_SPACE_VALUES;

--V_NAMES :='V_SQL_MOVE_VALUES';
  V_SQL_MOVE_VALUES := 'alter table ' || V_NAMES || ' disable row movement noparallel logging';
  EXECUTE IMMEDIATE V_SQL_MOVE_VALUES;

END ETL_PARTITION_shrink;

########################################END########################################

同时可以看到过程中有查询语句，我们可以单独执行查询单张表的碎片率：

SELECT distinct a.owner,
       a.table_name,
       a.num_rows,
       a.avg_row_len,
       round(a.avg_row_len * a.num_rows/1024/1024, 2) real_bytes_MB,
       round(b.seg_bytes_mb, 2) seg_bytes_mb ,
      (round(b.seg_bytes_mb, 2) - round(a.avg_row_len * a.num_rows/1024/1024, 2) )  GAP,
       decode(a.num_rows, 0, 100, (1-round(a.avg_row_len * a.num_rows/1024/1024/b.seg_bytes_mb, 2))*100)||'%' frag_percent
 FROM dba_tables a,
   ( SELECT  owner, segment_name, sum(bytes/1024/1024) seg_bytes_mb
   FROM dba_segments
   GROUP BY owner, segment_name) b,
  dba_segments c
 WHERE   a.table_name IN ('&TABALE_NAME')
      AND   a.owner IN upper('&OWNER')
      AND a.table_name=b.segment_name
     AND a.table_name=c.segment_name
      AND a.owner=b.owner
 AND a.owner not IN ('SYS', 'SYSTEM', 'OUTLN', 'DMSYS', 'TSMSYS', 'DBSNMP', 'WMSYS', 'EXFSYS', 'CTXSYS', 'XDB', 'OLAPSYS', 'ORDSYS', 'MDSYS', 'SYSMAN')
  ORDER BY gap desc;

我们从REAL_BYTES_MB字段中可以看到统计信息预估的表大小。
SEG_BYTES_MB字段可以看到真实占用的segment 大小。
如果两个值差距比较大（GAP 字段），可以判断表碎片较大做碎片回收更有效果。
同时FRAG_PERCENT值越大证明碎片越大。
25%以上考虑重新整理
