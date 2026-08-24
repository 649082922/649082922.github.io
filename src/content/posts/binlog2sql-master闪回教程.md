---
title: binlog2sql-master闪回教程
published: 2025-05-10
description: "参考网址https://www.cnblogs.com/plluoye/p/12995350.html#1-%E7%8E%AF%E5%A2%"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

参考网址https://www.cnblogs.com/plluoye/p/12995350.html#1-%E7%8E%AF%E5%A2%83

下载Binlog2sql: https://codeload.github.com/danfengcao/binlog2sql/zip/master

该工具的使用依赖以下三个包：
PyMySQL==0.7.8
wheel==0.24.0
mysql-replication==0.9

1.安装依赖
yum install -y zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gcc libffi-devel

2.安装pymysql库
pip3 install pymysql
pip3 install mysql-replication
pip3 install replication

或(可省略第三步)
git clone https://github.com/danfengcao/binlog2sql.git
cd binlog2sql  //进入下载的源码目录里
pip3 install -r requirements.txt

#检查配置
pip3 list

Package           Version
----------------- -------
deepdiff          5.7.0
mysql-replication 0.44.0
ordered-set       4.0.2
pip               23.2.1
PyMySQL           1.1.0
pyzmq             25.1.1
replication       0.9.9
setuptools        65.5.0
wheel             0.41.2

3.下载Binlog2sql,解压即可使用
wget https://codeload.github.com/danfengcao/binlog2sql/zip/master
unzip master

##########################################binlog2sql使用##########################################
1.检查MySQL测试库配置
SHOW VARIABLES LIKE 'log_bin';
SET GLOBAL log_bin = ON;

2.案例准备
create database cym;
use cym;
create table t1(id int,name varchar(10),addtime datetime default now());
insert into t1 values(1,'赵',now()),(2,'钱',now()),(3,'孙','2022-01-12 12:12:12'),(4,'李','2000-12-12 1:00:00');
select * from t1;

+------+------+---------------------+
| id   | name | addtime             |
+------+------+---------------------+
|    1 | 赵   | 2023-09-22 16:50:53 |
|    2 | 钱   | 2023-09-22 16:50:53 |
|    3 | 孙   | 2022-01-12 12:12:12 |
|    4 | 李   | 2000-12-12 01:00:00 |
+------+------+---------------------+
4 rows in set (0.00 sec)

3.故障模拟
select now();
delete from cym.t1;
select * from cym.t1;

Empty set (0.00 sec)  -- 确定数据丢失

4.故障恢复
可以使用root 操作，也可以设置专门的最小权限binlog挖掘用户
create user binlog2sql identified by 'binlog2sql';
GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO binlog2sql;

#检索需要用到的binlog文件
```
[root@localhost][(none)]> show master status;
```
+------------------+----------+--------------+------------------+---------------------------------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set                           |
+------------------+----------+--------------+------------------+---------------------------------------------+
| mysql-bin.000024 |     1805 |              |                  | f475cd3a-e62f-11ed-be51-000c2967fa34:1-8594 |
+------------------+----------+--------------+------------------+---------------------------------------------+
1 row in set (0.00 sec)

如果删除的时间比较久，需要根据大概的时间范围，结合binlog最后更新时间，确定可能用到的binlog 文件

获取binlog 位置：
```
[root@localhost][(none)]> select @@log_bin_basename;
```
+-----------------------------------+
| @@log_bin_basename                |
+-----------------------------------+
| /mysql/mysqldata/binlog/mysql-bin |
+-----------------------------------+
1 row in set (0.00 sec)

5.获取误删除操作的undo语句
已知：
误操作时间范围：2023-09-22 16:00:00 之后
mysql-bin.000024 包含的16:00之前的操作
所以我们要挖掘的binlog文件为：mysql-bin.000024
获取Undo语句
python3 /root/binlog2sql-master/binlog2sql/binlog2sql.py -ubinlog2sql -p****** -dcym -t t1 -B --start-file='mysql-bin.000024' --start-datetime='2023-09-22 16:00:00' --only-dml

python3 /root/binlog2sql/binlog2sql/binlog2sql.py -ubinlog2sql -p****** -dcym -t t1 -B --start-file='mysql-bin.000024' --start-datetime='2023-09-22 16:00:00' --only-dml

python3 /root/binlog2sql/binlog2sql/binlog2sql.py -uroot -p123123 -dcym -t t1 -B --start-file='mysql-bin.000024' --start-datetime='2023-09-22 16:00:00' --only-dml

报错:
Traceback (most recent call last):
  File "/root/binlog2sql/binlog2sql/binlog2sql.py", line 145, in <module>
    binlog2sql = Binlog2sql(connection_settings=conn_setting, start_file=args.start_file, start_pos=args.start_pos,
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/binlog2sql/binlog2sql/binlog2sql.py", line 48, in __init__
    cursor.execute("SHOW MASTER STATUS")
    ^^^^^^^^^^^^^^
AttributeError: 'Connection' object has no attribute 'execute'
