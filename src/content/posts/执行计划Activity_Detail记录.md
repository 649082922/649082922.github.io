---
title: 执行计划Activity_Detail记录
published: 2026-02-14
description: "monitor执行计划Activity Detail显示异常"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

monitor执行计划Activity Detail显示异常

异常1
Duration 16s
Elapsed Time(s) 15
IO Waite(s) 14
cpu(2)
db file sequential read(8)
read by other session(6)

"db file sequential read(8)" 表示发生了顺序读取（Sequential Read）的操作，每次读取一个数据块，"(8)" 表示数据块的大小为8KB（或根据系统配置的块大小而有所不同）。
"read by other session(6)" 表示当前会话正在等待其他6个会话完成对相同数据块的读取操作。这意味着当前会话需要等待其他会话释放对该数据块的读取权限，才能继续执行。
"cpu(2)" 表示在执行计划中发生了2个CPU操作。这可能涉及一些需要进行计算、排序或聚合的操作，需要使用CPU资源进行处理。

解决方案
查看表,查看target_buffes值
SELECT *
FROM V$BUFFER_POOL;

发现值过小修改db_cache_size
ALTER SYSTEM SET db_cache_size = <value> SCOPE = BOTH;

优化方式:
优化查询语句：确保查询语句使用适当的索引、过滤条件和连接方式，以减少对数据块的读取操作，并尽可能减少CPU的使用。
数据库缓存调整：调整数据库的缓存设置，如增加数据库缓冲区大小，以减少从磁盘读取数据的频率。
硬件性能优化：确保磁盘驱动器和存储系统的性能良好，例如使用高速磁盘或固态驱动器（SSD），以提高读取操作的速度。
并发控制：评估并发访问模式，考虑采用合适的并发控制策略，如调整事务隔离级别或锁定策略，以减少对相同数据块的读取争用。
查询优化：分析查询执行计划，查看是否存在性能瓶颈，并根据需要进行索引优化、统计信息收集或查询重写等操作。

异常2
Duration 96s
Elapsed Time(s) 95
IO Waite(s) 78
cpu(14) 这里ACTIVITY 100%
db file scattered read(4)
db file sequential read (37)
read by other session (40)

CPU (14): 表示在查询执行期间使用的CPU资源百分比。这包括CPU计算和处理查询的操作。在这个示例中，CPU资源占用了查询执行的14%。

db file scattered read (4): 表示执行期间进行散乱读取的数据文件块数量。散乱读取是指在物理存储设备上读取非连续数据块的操作。执行期间进行了4次散乱读取操作。

db file sequential read (37): 表示执行期间进行顺序读取的数据文件块数量。顺序读取是指在物理存储设备上按照顺序读取连续数据块的操作。执行期间进行了37次顺序读取操作。

read by other session (40): 表示在查询执行期间由其他会话（session）读取的数据块数量。这可能发生在并发环境中，当多个会话同时读取相同的数据块时。
有40个数据块被其他会话读取。
