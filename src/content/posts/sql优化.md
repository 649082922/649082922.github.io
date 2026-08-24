---
title: sql优化
published: 2025-12-23
description: "SP_SET_PARA_VALUE(1,'ENABLE_MONITOR',1);"
tags: ["达梦", "实战笔记"]
category: 数据库
draft: false
---

###################################################生成执行计划
1.开启monitor
SP_SET_PARA_VALUE(1,'ENABLE_MONITOR',1);
SP_SET_PARA_VALUE(1,'MONITOR_SQL_EXEC',1);

2.查看执行计划
set autotrace traceonly;
explain SELECT ID,NAME FROM T1 WHERE NAME ='aaaaaaaaaa';

3.最后，关闭monitor
SP_SET_PARA_VALUE(1,'ENABLE_MONITOR',0);
SP_SET_PARA_VALUE(1,'MONITOR_SQL_EXEC',0);

###################################################10053trace事件
https://mp.weixin.qq.com/s/hraTpxZ-NTkyOUzWRo8fgg

1.检查并关闭monitor达梦数据库开启monitor可能会对性能有影响，比如使用ET时需要提前开启monitor，
但10053没有这个限制，可以在monitor关闭的情况下生成10053 trace：
SP_SET_PARA_VALUE(1,'ENABLE_MONITOR',0);
SP_SET_PARA_VALUE(1,'MONITOR_SQL_EXEC',0);

2.配置10053事件语法和Oracle相同
alter session set events '10053 trace name context forever,level 1';

3.执行SQL其中：t1表及测试数据生成方式见末尾。
SELECT ID,NAME FROM T1 WHERE NAME ='aaaaaaaaaa';

4.关闭10053事件
alter session set events '10053 trace name context off';

5.查看10053 trace日志查看路径
```
SQL> select PARA_NAME,PARA_VALUE from v$dm_ini where PARA_NAME like '%TRACE_PATH%';
```
行号     PARA_NAME  PARA_VALUE
---------- ---------- ----------------------
1          TRACE_PATH /db/dm8/data/cjc/trace

查看trace文件
dmdba@SATEST-DB-004:/db/dm8/data/cjc/trace$ls -lrth /db/dm8/data/cjc/trace
-rw-r--r-- 1 dmdba dinstall 8.9K Mar 20 16:56 CJC_0320_1656_140272893910344.trc

6.分析trace
vi CJC_0320_1656_140272893910344.trc
