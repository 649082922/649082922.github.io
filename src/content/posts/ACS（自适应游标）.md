---
title: ACS（自适应游标）
published: 2025-04-18
description: "Oracle使用ACS（自适应游标）有二个前提条件："
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

Oracle使用ACS（自适应游标）有二个前提条件：
1、绑定变量使用了bind peeking。
2、绑定变量的列上有直方图信息。

官档(mos)
Adaptive Cursor Sharing in 11G[ID 836256.1]
Adaptive Cursor SharingOverview [ID 740052.1]

相关介绍
https://blog.csdn.net/tianlesoftware/article/details/7573502
https://www.modb.pro/db/14541#
http://www.itpub.net/thread-1779225-1-1.html

使用测试
http://www.itpub.net/thread-1762279-1-1.html
http://blog.itpub.net/15415488/viewspace-621535
http://blog.itpub.net/53956/viewspace-1384122/
https://blog.csdn.net/leshami/article/details/6923670

（1）已禁用扩展游标共享
（2）查询没有绑定变量
（3）使用并行查询
（4）设置了某些参数，例如（“_optim_peek_user_binds”=false）
（5）使用 /*+ NO_BIND_AWARE */ hint
（6）使用Outlines锁定执行计划
（7）递归查询
（8） sql 语句中的绑定数大于 14。** 可能会更少，具体取决于 Bug 10182051 的版本和fix_control设置。See Document : 1983132.1

########################################确认ACS是否能启用确认########################################

一、相关参数
自适应游标共享ACS(adaptiver cursor sharing)默认参数，默认启用
_optim_peek_user_binds=TRUE                          --启用用户绑定变量的窥探（binds）
_optimizer_adaptive_cursor_sharing=TRUE              --优化器自适应光标共享
_optimizer_extended_cursor_sharing=UDO               --优化器扩展光标共享
_optimizer_extended_cursor_sharing_rel=SIMPLE        --关系运算符的优化器扩展游标共享

修改后关闭ACS
alter system set "_optimizer_extended_cursor_sharing_rel"=none;
alter system set "_optimizer_extended_cursor_sharing"=none;
alter system set "_optimizer_adaptive_cursor_sharing"=false;

二、绑定变量的列上有直方图信息

查看直方图信息
select a.column_name 字段名字,
       b.num_rows   行数,
       a.num_distinct  基数,
        round(a.num_distinct / b.num_rows * 100, 2)  选择性,
       a.histogram  直方图的种类,
       a.num_buckets 桶
  from dba_tab_col_statistics a, dba_tables b
 where a.owner = b.owner
   and a.table_name = b.table_name
   and a.owner = 'SCOTT'
   and a.table_name = 'TEST';

收集/清除 直方图信息
1.收集
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS --统计表,列,索引的统计信息(对表进行直方图信息收集)
  (ownname          => 'oracle', --要分析表的拥有者
   tabname          => 'T231020_1', --要分析的表名.
   estimate_percent => 100, --采样行的百分比,取值范围[0.000001,100],null为全部分析,不采样.
   method_opt       => 'for all columns size skewonly', --决定histograms(直方图)信息是怎样被统计的.method_opt的取值如下(默认值为FOR ALL COLUMNS SIZE AUTO):
   no_invalidate    => FALSE, --如果将依赖游标设置为TRUE，则不使其无效。如果将依赖游标设置为FALSE，则该过程将立即使依赖游标无效
   degree           => 6, --决定并行度.默认值为null.
   cascade          => TRUE); --是收集索引的信息.默认为FALSE.
END;

--自动收集
begin dbms_stats.set_table_prefs(ownname => 'oracle',
                                 tabname => 'T231020_1',
                                 pname   => 'method_opt',
                                 pvalue  => 'for all columns size auto for columns size SKEWONLY OBJECT_NAME'
                                 );
--参考https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_STATS.html#GUID-CDAA4742-5398-4A64-B871-E39F38D0021F
END;

2.清除
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
begin dbms_stats.set_table_prefs(ownname => 'oracle',
                                 tabname => 'T231020_1',
                                 pname   => 'method_opt',
                                 pvalue  => 'for all columns size auto for columns size 1 OBJECT_NAME'
                                 );
END;

三、自适应游标共享的外在体现
        自适应游标共享主要通过三个字段来得以体现，即is_bind_sensitive,is_bind_aware,is_shareable。(注:此三个字段仅在Oracle 11g
        中存在)。通过上面从v$sql(v$sqlarea中不存在is_shareable)的查询可知，三个字段分别被赋予了不同的值，代表了不同的含义。

      is_bind_sensitive(绑定是否敏感)
          表示该子游标中是否使用了绑定变量要素，且采用bind peeking方法进行执行计划生成。如果执行计划依赖于窥探到的值，此处为Y，
          否则为N。

      is_bind_aware(绑定是否可知)
          表示该子游标是否使用了extended cursor sharing技术，是则为Y，否则为N，如为N，则该游标将废弃，不再可用。

      is_shareable(是否可共享)
          表示该子游标可否被下次软解析是否可共享使用。可共享则为Y，否则为N，表示该子游标失去了共享价值，按LRU算法淘汰。

      由于该SQL语句为首次执行，因此从v$sql查询的结果中得知
          is_bind_sensitive 为Y值(首次运行，执行了bind peeking)
          is_bind_aware     为N值(首次运行，不被extended cursor sharing支持)
          is_shareable      为Y值(执行计划可共享)
https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQL.html
https://blog.csdn.net/leshami/article/details/6923670

################################################################################################
1.建表
create table tab_acs(id int,value int);

2.插数据
begin
 for i in 1 .. 20000
   loop
     execute immediate 'insert into tab_acs values(1,'||i||')';
   end loop;
   COMMIT;
 end;
/

begin
  for i in 1 .. 10
    loop
      execute immediate 'insert into tab_acs values(2,'||i||')';
    end loop;
    COMMIT;
  end;
/

3.检查数据
select id,count(*) from tab_acs group by id;
        ID   COUNT(*)
---------- ----------
         1      20000
         2         10

4.建索引,收集统计信息直方图
create index idx_tab_acs on tab_acs(id);
begin dbms_stats.gather_table_stats(user,'TAB_ACS',cascade=>true); END;

5.查看直方图信息
select dbms_stats.get_param('method_opt') from dual;
DBMS_STATS.GET_PARAM('METHOD_OPT')
-----------------------------------------------------------------------------
FOR ALL COLUMNS SIZE AUTO

select table_name,column_name,histogram from dba_tab_col_statistics where table_name='TAB_ACS';
TABLE_NAME                     COLUMN_NAME                    HISTOGRAM
------------------------------ ------------------------------ ---------------
TAB_ACS                        VALUE                          NONE
TAB_ACS                        ID                             FREQUENCY

结果表明测试表tab_acs列上有直方图统计信息。

6.查看未使用绑定变量时的执行计划
sqlplus oracle/oracle@127.0.0.1:1521/orclpdb

set autotrace trace exp;
select count(value) from tab_acs where id=1;

Execution Plan
------------------------------------------------------------------------------
| Id  | Operation          | Name    | Rows  | Bytes | Cost (%CPU)| Time     |
------------------------------------------------------------------------------
|   0 | SELECT STATEMENT   |         |     1 |     8 |   105   (3)| 00:00:02 |
|   1 |  SORT AGGREGATE    |         |     1 |     8 |            |          |
|*  2 |   TABLE ACCESS FULL| TAB_ACS |   199K|  1561K|   105   (3)| 00:00:02 |
------------------------------------------------------------------------------

select count(value) from tab_acs where id=2;

Execution Plan
--------------------------------------------------------------------------------------------
| Id  | Operation                    | Name        | Rows  | Bytes | Cost (%CPU)| Time     |
--------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT             |             |     1 |     8 |     2   (0)| 00:00:01 |
|   1 |  SORT AGGREGATE              |             |     1 |     8 |            |          |
|   2 |   TABLE ACCESS BY INDEX ROWID| TAB_ACS     |   265 |  2120 |     2   (0)| 00:00:01 |
|*  3 |    INDEX RANGE SCAN          | IDX_TAB_ACS |   265 |       |     1   (0)| 00:00:01 |
--------------------------------------------------------------------------------------------
可见谓词条件为1时走全表扫描，谓词条件为2时走index range scan。

7.查看使用绑定变量时的执行计划
sqlplus oracle/oracle@127.0.0.1:1521/orclpdb

alter session set optimizer_mode=all_rows;
alter system flush shared_pool;
variable x number;
exec :x:=1;
select count(value) from tab_acs where id=:x;

COUNT(VALUE)
------------
      200000

SELECT sql_id,
       child_number,
       executions,
       loads,
       buffer_gets,
       is_bind_sensitive AS "bind_sensi",
       is_bind_aware     AS "bind_aware",
       is_shareable      AS "bind_share"
  FROM v$sql
 WHERE sql_text LIKE 'select count(value) from tab_acs where id=:x';

SQL_ID        CHILD_NUMBER EXECUTIONS      LOADS BUFFER_GETS b b b
------------- ------------ ---------- ---------- ----------- - - -
5gy2wu883n8ac            0          1          1         251 Y N Y

设置绑定变量值为2后的第一次查询：
exec :x:=2;
select count(value) from tab_acs where id=:x;
COUNT(VALUE)
------------
         100

SELECT sql_id,
       child_number,
       executions,
       loads,
       buffer_gets,
       is_bind_sensitive AS "bind_sensi",
       is_bind_aware     AS "bind_aware",
       is_shareable      AS "bind_share"
  FROM v$sql
 WHERE sql_text LIKE 'select count(value) from tab_acs where id=:x';

SQL_ID        CHILD_NUMBER EXECUTIONS      LOADS BUFFER_GETS b b b
------------- ------------ ---------- ---------- ----------- - - -
5gy2wu883n8ac            0          2          1         288 Y N Y
结果表明，谓词条件为2时的第一次查询，沿用了谓词等于1时的执行计划。

设置绑定变量值为2后的第二次查询：
exec :x:=2;
 select count(value) from tab_acs where id=:x;
SELECT sql_id,
       child_number,
       executions,
       loads,
       buffer_gets,
       is_bind_sensitive AS "bind_sensi",
       is_bind_aware     AS "bind_aware",
       is_shareable      AS "bind_share"
  FROM v$sql
 WHERE sql_text LIKE 'select count(value) from tab_acs where id=:x';

SQL_ID        CHILD_NUMBER EXECUTIONS      LOADS BUFFER_GETS b b b
------------- ------------ ---------- ---------- ----------- - - -
5gy2wu883n8ac            0          2          1         288 Y N N
5gy2wu883n8ac            1          1          1           4 Y Y Y
结果表明，谓词条件为2时的第二次查询，重新生成了新的执行计划。

设置绑定变量值为2后的第三次查询：
exec :x:=2;
select count(value) from tab_acs where id=:x;
SELECT sql_id,
       child_number,
       executions,
       loads,
       buffer_gets,
       is_bind_sensitive AS "bind_sensi",
       is_bind_aware     AS "bind_aware",
       is_shareable      AS "bind_share"
  FROM v$sql
 WHERE sql_text LIKE 'select count(value) from tab_acs where id=:x';

SQL_ID        CHILD_NUMBER EXECUTIONS      LOADS BUFFER_GETS b b b
------------- ------------ ---------- ---------- ----------- - - -
5gy2wu883n8ac            0          2          1         288 Y N Y
5gy2wu883n8ac            1          2          1           8 Y Y Y
结果表明，谓词条件为2时的第三次查询，沿用了新生成的执行计划。

设置绑定变量值为2后的第四次查询：
exec :x:=2;
select count(value) from tab_acs where id=:x;
SELECT sql_id,
       child_number,
       executions,
       loads,
       buffer_gets,
       is_bind_sensitive AS "bind_sensi",
       is_bind_aware     AS "bind_aware",
       is_shareable      AS "bind_share"
  FROM v$sql
 WHERE sql_text LIKE 'select count(value) from tab_acs where id=:x';

SQL_ID        CHILD_NUMBER EXECUTIONS      LOADS BUFFER_GETS b b b
------------- ------------ ---------- ---------- ----------- - - -
5gy2wu883n8ac            0          2          1         288 Y N Y
5gy2wu883n8ac            1          3          1          12 Y Y Y
结果表明，谓词条件为2时的第四次查询，继续沿用了新生成的执行计划。

Oracle从11g开始，在v$sql视图中增加了is_bind_sensitive、is_bind_aware和is_shareable三列。其中：
1、is_bind_sensitive
       表示游标是否对绑定变量敏感。数值如果为Y，表示当绑定变量的数值发生变化后，优化器有可能会产生一个不同的执行计划，简单说就是ACS生效了。
2、is_bind_aware
      表示该游标是否使用了extended cursor sharing技术，数值如果为Y，表示oracle认为此处cursor的值可能会改变执行计划。
3、is_shareable
      表示该游标能否重用，能否被下次共享。数值如果为Y表示能够共享，数值如果为N表示该子游标失去了共享价值，等待被Age Out出内存；

查看绑定变量为1时的执行计划：
select * from table(dbms_xplan.display_cursor('5gy2wu883n8ac',format => 'advanced'));

PLAN_TABLE_OUTPUT
------------------------------------------------------------------------------
SQL_ID  5gy2wu883n8ac, child number 0
-------------------------------------
select count(value) from tab_acs where id=:x
Plan hash value: 3684903434
------------------------------------------------------------------------------
| Id  | Operation          | Name    | Rows  | Bytes | Cost (%CPU)| Time     |
------------------------------------------------------------------------------
|   0 | SELECT STATEMENT   |         |       |       |   105 (100)|          |
|   1 |  SORT AGGREGATE    |         |     1 |     8 |            |          |
|*  2 |   TABLE ACCESS FULL| TAB_ACS |   199K|  1561K|   105   (3)| 00:00:02 |
------------------------------------------------------------------------------
Query Block Name / Object Alias (identified by operation id):
-------------------------------------------------------------
   1 - SEL$1
   2 - SEL$1 / TAB_ACS@SEL$1
Outline Data
-------------
  /*+
      BEGIN_OUTLINE_DATA
      IGNORE_OPTIM_EMBEDDED_HINTS
      OPTIMIZER_FEATURES_ENABLE('11.2.0.1')
      DB_VERSION('11.2.0.1')
      ALL_ROWS
      OUTLINE_LEAF(@"SEL$1")
      FULL(@"SEL$1" "TAB_ACS"@"SEL$1")
      END_OUTLINE_DATA
  */
Peeked Binds (identified by position):
--------------------------------------
   1 - :X (NUMBER): 1
Predicate Information (identified by operation id):
---------------------------------------------------
   2 - filter("ID"=:X)
Column Projection Information (identified by operation id):
-----------------------------------------------------------
   1 - (#keys=0) COUNT("VALUE")[22]
   2 - "VALUE"[NUMBER,22]
50 rows selected.

查看绑定变量为2时，新生成的执行计划：
select * from table(dbms_xplan.display_cursor('5gy2wu883n8ac',1,format => 'advanced'));

PLAN_TABLE_OUTPUT
-----------------------------------------------------------------------------
SQL_ID  5gy2wu883n8ac, child number 1
-------------------------------------
select count(value) from tab_acs where id=:x
Plan hash value: 3029888215
--------------------------------------------------------------------------------
| Id  | Operation                    | Name        | Rows  | Bytes | Cost (%CPU)| Time     |
--------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT             |             |       |       |     2 (100)|          |
|   1 |  SORT AGGREGATE              |             |     1 |     8 |            |          |
|   2 |   TABLE ACCESS BY INDEX ROWID| TAB_ACS     |   265 |  2120 |     2   (0)| 00:00:01 |
|*  3 |    INDEX RANGE SCAN          | IDX_TAB_ACS |   265 |       |     1   (0)| 00:00:01 |
--------------------------------------------------------------------------------------------
Query Block Name / Object Alias (identified by operation id):
-------------------------------------------------------------
   1 - SEL$1
   2 - SEL$1 / TAB_ACS@SEL$1
Outline Data
-------------
  /*+
      BEGIN_OUTLINE_DATA
      IGNORE_OPTIM_EMBEDDED_HINTS
      OPTIMIZER_FEATURES_ENABLE('11.2.0.1')
      DB_VERSION('11.2.0.1')
      ALL_ROWS
      OUTLINE_LEAF(@"SEL$1")
      INDEX_RS_ASC(@"SEL$1" "TAB_ACS"@"SEL$1" ("TAB_ACS"."ID"))
      END_OUTLINE_DATA
  */
Peeked Binds (identified by position):
--------------------------------------
   1 - :X (NUMBER): 2
Predicate Information (identified by operation id):
---------------------------------------------------
   3 - access("ID"=:X)
Column Projection Information (identified by operation id):
-----------------------------------
   1 - (#keys=0) COUNT("VALUE")[22]
   2 - "VALUE"[NUMBER,22]
   3 - "TAB_ACS".ROWID[ROWID,10]
53 rows selected.

      由执行计划可知，设置绑定变量为2后，第二次以后的执行计划是正确的执行计划。由此可知，ACS技术弥补了bind peeking的不足，保证了绑定变量数值发生变化后，sql语句能够选择正确的执行计划。
