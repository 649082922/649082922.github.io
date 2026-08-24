---
title: postgresql常用命令
published: 2024-02-25
description: "\dt schema_name.*"
tags: ["PostgreSQL", "实战笔记"]
category: 数据库
draft: false
---

1.切换到pg用户
su - postgres

2.登陆数据库
psql zone

3.查看有哪些表
查看当前数据库中所有表
\dt

查看特定模式中的表：
\dt schema_name.*

使用 SQL 查询查看表：
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema');

4.查看有哪些用户
查看所有用户：
\du

使用 SQL 查询查看用户：
SELECT usename FROM pg_user;

5.查看有哪些数据库
查看所有数据库：
\l

使用 SQL 查询查看数据库：
SELECT datname FROM pg_database WHERE datistemplate = false;

6.查看表的结构
描述表结构：
\d table_name

查看表的列信息：
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'table_name';

7.查看当前连接的信息
查看当前连接的用户和数据库：
SELECT current_user, current_database();

查看当前连接的会话信息：
SELECT * FROM pg_stat_activity;

8.查看索引
查看表上的索引：
\di table_name

使用 SQL 查询查看索引：
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'table_name';

9.查看序列
查看所有序列：
\ds

使用 SQL 查询查看序列：
SELECT sequence_schema, sequence_name
FROM information_schema.sequences;

10.查看权限
查看表的权限：
\dp table_name

使用 SQL 查询查看权限：
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'table_name';

11.查看函数和存储过程
查看所有函数：
\df

查看特定模式中的函数：
\df schema_name.*

使用 SQL 查询查看函数：
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE specific_schema NOT IN ('pg_catalog', 'information_schema');
