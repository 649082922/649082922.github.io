---
title: db2数据导入导出
published: 2023-11-13
description: "db2 export to <文件路径> of del select * from <表名>"
tags: ["DB2", "实战笔记"]
category: 数据库
draft: false
---

1.导出（Export）
--------------------------------------------------
#基本语法
db2 "export to <文件路径> of del select * from <表名>"

#导出整张表
db2 "export to /backup/t01_qassign.del of del select * from AWP.T01_QASSIGN"

#导出带条件
db2 "export to /backup/t01_qassign.del of del select * from AWP.T01_QASSIGN where created > '2026-01-01'"

#指定分隔符（默认逗号，这里改为竖线）
db2 "export to /backup/t01_qassign.del of del modified by coldel| select * from AWP.T01_QASSIGN"

2.导入（Import）
--------------------------------------------------
#三种模式
  insert         追加数据，不影响已有数据
  insert_update  有则更新，无则插入（需主键）
  replace        先清空表，再导入（慎用！）

#追加导入
db2 "import from /backup/t01_qassign.del of del insert into AWP.T01_QASSIGN"

#清空后导入（慎用！会删掉原有数据）
db2 "import from /backup/t01_qassign.del of del replace into AWP.T01_QASSIGN"

#带消息日志（推荐，方便排查错误）
db2 "import from /backup/t01_qassign.del of del messages /tmp/import.log insert into AWP.T01_QASSIGN"

#指定提交行数（大数据量时推荐，每1000行提交一次）
db2 "import from /backup/t01_qassign.del of del commitcount 1000 messages /tmp/import.log insert into AWP.T01_QASSIGN"

3.批量导入（Load）— 大数据量用这个，速度快
--------------------------------------------------
#基本语法
db2 "load from /backup/t01_qassign.del of del insert into AWP.T01_QASSIGN"

#带日志
db2 "load from /backup/t01_qassign.del of del messages /tmp/load.log insert into AWP.T01_QASSIGN nonrecoverable"

#Import 与 Load 对比
  特性            Import                Load
  速度            慢（逐行写入）         快（直接写页）
  触发器          执行                  不执行
  日志记录        全部记录              少量
  表锁定          弱                    强
  适用场景        小数据量              大数据量（百万级+）

4.常用组合场景
--------------------------------------------------
#表到表复制（不需要文件中转，最快）
db2 "insert into AWP.T01_QASSIGN_BAK select * from AWP.T01_QASSIGN"

#完整流程：导出 → 建表 → 导入
db2 "export to /backup/t01_qassign.del of del select * from AWP.T01_QASSIGN"
db2 "create table AWP.T01_QASSIGN_BAK like AWP.T01_QASSIGN"
db2 "import from /backup/t01_qassign.del of del insert into AWP.T01_QASSIGN_BAK"

#跨库导出导入（源库导出，目标库导入）
#-- 源库操作
db2 "export to /backup/t01_qassign.del of del select * from AWP.T01_QASSIGN"
#-- 目标库操作
db2 connect to <目标库名>
db2 "import from /backup/t01_qassign.del of del insert into AWP.T01_QASSIGN"

5.查看导出文件内容
--------------------------------------------------
#查看前几行，确认数据格式和分隔符
head -5 /backup/t01_qassign.del

#查看文件大小
ll /backup/t01_qassign.del

#统计行数（大致等于记录数）
wc -l /backup/t01_qassign.del

6.常见报错
--------------------------------------------------
SQL1024N   没连数据库                先执行 db2 connect to <库名>
SQL3015N -526  目标表是临时表        drop后建正式表，或换个表名
SQL3007C   消息文件写入失败          加 messages /tmp/xxx.log 指定路径
SQL0601N   表已存在                  先 drop 或换个表名
SQL3016N   分隔符不匹配              导出用了什么分隔符，导入也要指定
SQL0204N   表不存在                  先建表：create table ... like ...

7.实操示例
--------------------------------------------------
#场景：将 /backup/test/sunbh/20260420/AWP.T01_QASSIGN 的数据导入新表

#1.连接数据库
db2 connect to <数据库名>

#2.查看原表结构
db2 "describe table AWP.T01_QASSIGN"

#3.建目标表（和原表结构一样）
db2 "create table AWP.T01_QASSIGN20260428 like AWP.T01_QASSIGN"
  如果报 SQL0601N（表已存在），先删除：
  db2 "drop table AWP.T01_QASSIGN20260428"
  再重建

#4.导入数据
db2 "import from /backup/test/sunbh/20260420/AWP.T01_QASSIGN of del messages /tmp/import_qassign.msg insert into AWP.T01_QASSIGN20260428"

#5.验证数据量
db2 "select count(*) from AWP.T01_QASSIGN20260428"
