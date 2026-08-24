---
title: redis性能测试
published: 2025-03-27
description: "序号	  选项	                描述	                                           "
tags: ["Redis", "实战笔记"]
category: 数据库
draft: false
---

参考
https://www.runoob.com/redis/redis-benchmarks.html
https://www.bilibili.com/video/BV1S54y1R7SB?p=10&spm_id_from=pageDriver&vd_source=b48a21f0ce58055f66209ce8081c63cd

序号	  选项	                描述	                                            默认值
1	      -h	                指定服务器主机名	                                127.0.0.1
2	      -p	                指定服务器端口	                                    6379
3	      -s	                指定服务器 socket
4	      -c	                指定并发连接数	                                    50
5	      -n	                指定请求数	                                        10000
6	      -d	                以字节的形式指定 SET/GET 值的数据大小	            2
7	      -k	                1=keep alive 0=reconnect	                        1
8	      -r	                SET/GET/INCR 使用随机 key, SADD 使用随机值
9	      -P	                通过管道传输 <numreq> 请求	                        1
10	      -q	                强制退出 redis。仅显示 query/sec 值
11	      --csv	                以 CSV 格式输出
12	      -l（L 的小写字母）	生成循环，永久执行测试
13	      -t	                仅运行以逗号分隔的测试命令列表。
14	      -I（i 的大写字母）	Idle 模式。仅打开 N 个 idle 连接并等待。

redis-benchmark -h localhost -p 6379 -c 100 -n 10000

测试结果
  10000 requests completed in 0.06 seconds
  100 parallel clients
  3 bytes payload
  keep alive: 1

99.91% <= 1 milliseconds
100.00% <= 1 milliseconds
175438.59 requests per second

############
0.06秒内完成10000个请求
100个并行客户端
3字节有效载荷
保持活力：1

99.91%<=1毫秒
100.00%<=1毫秒
每秒175438.59个请求
