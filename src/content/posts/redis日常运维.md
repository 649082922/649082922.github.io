---
title: redis日常运维
published: 2024-01-22
description: "redis-cli -h 127.0.0.1 -p 6379"
tags: ["Redis", "实战笔记"]
category: 数据库
draft: false
---

参考
https://blog.csdn.net/whatday/article/details/102924661/

1.连接本地redis数据库
redis-cli

2.远程连接redis
redis-cli -h 127.0.0.1 -p 6379

如果设置了密码
redis-cli -h  -p  -a

3.通过服务的方式来进行查看
systemctl status redis_6379
● redis_6379.service - LSB: start and stop redis_6379
   Loaded: loaded (/etc/rc.d/init.d/redis_6379; bad; vendor preset: disabled)
   Active: inactive (dead)
     Docs: man:systemd-sysv-generator(8)

查看服务状态
service redis_6379 status
Redis is running (6952)

4.启停命令
service redis_6379 start                              ##启动redis，端口6379
service redis_6379 stop                               ##停止端口号为6379 的redis

5.Redis语法
set name demo    -- 插入一个键值,键(key)名为name,值(value)demo
get name         -- 查询一个键名为name的值
keys *           -- 查询所有键名
shutdown         -- 关闭数据库,关键字不保存或保存NOSAVE|SAVE
select 6         -- 切换到6号数据库
dbsize           -- 查看当前n号数据库所占size大小
flushdb          -- 清空当前n号数据库内存
flushall         -- 清空全部数据库内存

1.查看所有cluster nodes节点信息
redis-cli -h 192.168.1.17 -p 7078 -a 8kutnyedZm cluster nodes

2.清理redis,主库执行
#检查数据库中键值对的数量
redis-cli -h 192.168.1.17 -p 7078 -a 8kutnyedZm dbsize
清key清内存
redis-cli -h 192.168.1.18 -p 7078 -a 8kutnyedZm R6F7N6YGnETTw-flushdb
redis-cli -h 192.168.1.19 -p 7078 -a 8kutnyedZm R6F7N6YGnETTw-flushdb
redis-cli -h 192.168.1.17 -p 7078 -a 8kutnyedZm R6F7N6YGnETTw-flushdb
#sqm服务器
redis-cli -h 192.168.1.17 -p 7007 -a iqWe5BtJCR iZaLqeyIgcrBA-flushall

#再次检查数据库中键值对的数量
redis-cli -h 192.168.1.17 -p 7078 -a 8kutnyedZm dbsize

#chatgdp搜索仅供参考
该命令是使用redis-cli工具连接到主机为29.3.223.42、端口为7078的Redis实例，并使用密码"8kutnyedZm"进行身份验证。
命令"flushdb"用于清空当前数据库中的所有键值对。
命令"dbsize"用于获取当前数据库中键值对的数量。

要清理Redis内存，可以采取以下几种方法：
使用Redis的持久化机制：Redis可以通过将数据写入磁盘来进行持久化，可以选择使用RDB快照或者AOF日志两种方式。你可以通过配置Redis，定期进行RDB快照或者AOF日志重写，以清理内存并将数据存储到磁盘中。
使用过期时间：在设置键值对时，可以为键设置过期时间。当键过期后，Redis会自动清除该键值对，释放内存空间。
使用内存淘汰策略：当Redis内存超过设定的阈值时，可以启用内存淘汰策略，根据设定的规则淘汰部分数据，释放内存空间。常见的内存淘汰策略有LRU（最近最少使用）、LFU（最不经常使用）等。
使用Redis的删除命令：可以通过使用DEL命令来手动删除不再需要的键值对，以释放内存空间。
重启Redis服务：在没有持久化数据的情况下，可以通过重启Redis服务来清空内存，但请注意重启会导致服务中断和数据丢失。
需要注意的是，在清理Redis内存时要慎重操作，确保数据的重要性和一致性。最好在清理前备份数据，并在生产环境中谨慎执行清理操作。

以下是常用Redis用于删除键值对的几个删除命令,从而清理内存：

DEL key [key ...]：删除指定的键值对。可以同时指定多个键进行删除。
UNLINK key [key ...]：异步删除指定的键值对。与DEL命令不同，UNLINK命令将删除键的操作放入后台执行，不会阻塞客户端。适用于大量键的删除操作。
FLUSHDB：删除当前数据库中的所有键值对。
FLUSHALL：删除Redis中所有数据库中的键值对。

需要注意的是，删除键值对并不会立即释放内存，Redis会在后台进行内存回收。如果需要立即释放内存，可以考虑使用以下方法之一：
使用UNLINK命令异步删除键值对，然后使用BGREWRITEAOF命令或BGSAVE命令生成AOF文件或RDB快照文件，最后重启Redis服务。这将清空所有键值对并释放内存。
在Redis配置文件中启用maxmemory-p******选项，设置合适的内存淘汰策略，使Redis自动淘汰部分数据以释放内存。
请注意，在执行删除操作时，要谨慎操作并确保备份重要数据，以避免数据丢失。

3.修改键值删除策略
config set maxmemory-p****** allkeys-lru
config rewrite

auth C6ca#W4!8v
WPtSjUd9KN72-config set maxmemory-p****** allkeys-lru
WPtSjUd9KN72-config rewrite

#chatgdp搜索仅供参考
该命令是使用redis-cli工具连接到Redis实例，并进行一系列操作：
使用"config set maxmemory-p****** allkeys-lru"命令设置Redis实例的内存淘汰策略为"allkeys-lru"，即基于LRU算法淘汰键。
使用"config rewrite"命令将配置更改写入到配置文件中，以便永久保存配置。
使用"auth C6ca#W4!8v"命令进行身份验证，密码为"C6ca#W4!8v"。
使用"WPtSjUd9KN72-config set maxmemory-p****** allkeys-lru"命令设置Redis实例的内存淘汰策略为"allkeys-lru"，该命令中的"WPtSjUd9KN72-"为密码。
使用"WPtSjUd9KN72-config rewrite"命令将配置更改写入到配置文件中，该命令中的"WPtSjUd9KN72-"为密码。
注意：上述命令中的密码部分是示例，请根据实际情况替换为正确的密码。同时，请谨慎操作配置和密码相关的命令，确保安全性和正确性

4.判断是否共库 - 多人使用同一个库
scan 0 count 100
client list

"scan 0 count 100" 命令用于迭代遍历 Redis 数据库中的键。
它使用游标来实现逐步遍历，避免一次性返回所有键的开销。
该命令的参数 "0" 表示起始游标，"count 100" 表示每次迭代返回的最大键数量为 100。
您可以使用不同的游标和计数值来分批获取键。

"client list" 命令用于获取连接到 Redis 服务器的客户端列表信息。
该命令返回一个包含客户端详细信息的列表，包括客户端的唯一标识符、地址、连接状态等。
通过查看客户端列表，可以监控和管理与 Redis 服务器的连接情况。

5.内存扩容
config set maxmemory 内存大小;    --先扩slave再扩容master
config rewrite
