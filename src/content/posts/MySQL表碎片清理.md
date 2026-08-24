---
title: MySQL表碎片清理
published: 2024-11-12
description: "MySQL表在经历多次删除、更新、插入之后，表空间会出现碎片。定期进行空间整理，消除碎片可以提高表空间的性能。"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

MySQL表碎片清理
https://support.enmotech.com/article/6253/search

MySQL表在经历多次删除、更新、插入之后，表空间会出现碎片。定期进行空间整理，消除碎片可以提高表空间的性能。

#####删除数据：
当执行delete操作时，被删除的记录只是被标记为删除，它们占用的空间并没有被释放，而是留给以后使用。
如果以后插入的数据不能完全填充这些空间，就会形成碎片。

delete from student where createtime < '2023-01-01 00:00:00';

#####更新数据：
①当执行update操作时，如果更新的字段是可变长度的（如varchar），并且更新后的值比原来的值短，那么原来的空间就会有多余。
如果更新后的值比原来的值长，那么可能导致页分裂，也会产生碎片。

update student set score=90 where id > 10;

②alter语句会修改表的结构，例如添加或删除列，创建或删除索引，更改列的类型等。
这些操作可能会导致表产生碎片，因为标的数据和索引可能会被重建或移动。

alter table student add column age int;

#####插入数据：
当执行insert操作时，如果插入的数据不是按照索引顺序插入，而是随机插入，那么可能导致页分裂或者页合并，也会产生碎片。

对于插入数据来说，如果插入的数据是按照主键或者唯一索引的顺序插入，那么就是按照索引顺序插入。
如果插入的数据是无序的或者按照非唯一索引的顺序插入，那么就是随机插入。
例如，假设有一个表student，它有一个主键id和一个非唯一索引name。如果执行以下语句：

insert into student (id, name) values (1, 'Alice'), (2, 'Bob'), (3, 'Charlie');

那么就是按照主键顺序插入，不会产生碎片。但如果执行以下语句：
insert into student (id, name) values (3, 'Charlie'), (1, 'Alice'), (2, 'Bob');

那么就是随机插入，可能会产生碎片。同样，如果执行以下语句：
insert into student (id, name) values (4, 'David'), (5, 'Eve'), (6, 'Frank');

那么就是按照name索引的顺序插入，也可能会产生碎片。

#####解决方案
MySQL表空间清理的方案可能取决于你的表的引擎类型，数据量，碎片程度和业务需求。

1.首先用下边SQL来查看MySQL库中前10碎片表情况：
SELECT table_schema,
       TABLE_NAME,
       (data_length + index_length) / 1024 / 1024 AS Total_MB,
       data_free / 1024 / 1024 AS data_free_mb,
       data_free * 100 / (data_length + index_length) AS data_free_percent,
       CURDATE() AS today
  FROM information_schema.tables
 WHERE table_schema NOT IN
       ('mysql', 'sys', 'information_schema', 'performance_schema')
 ORDER BY data_free_percent DESC LIMIT 10

 如果结果显示碎片较大，一些常用的清理碎片空间的方法有：

2.使用OPTIMIZE TABLE命令:这个命令可以对表进行重建，消除碎片，回收空间，优化索引。
过程中表数据会复制到新建的临时表中，增加实例的磁盘使用率。因此实例剩余磁盘空间要大于等于需释放表的空间，当机器剩余空间不足时，需先扩容。
它适用于MylSAM，BDB和InnoDB表，尤其是MyISAM表。但是这个命令会锁表，所以要在业务低峰期执行，并且要注意备份数据。

root@localhost:test 04:46:36 >optimize table chat_qa_record;
+---------------------+----------+----------+-------------------------------------------------------------------+
| Table               | Op       | Msg_type | Msg_text                                                          |
+---------------------+----------+----------+-------------------------------------------------------------------+
| test.chat_qa_record | optimize | note     | Table does not support optimize, doing recreate + analyze instead |
| test.chat_qa_record | optimize | status   | OK                                                                |
+---------------------+----------+----------+-------------------------------------------------------------------+
2 rows in set (0.10 sec)

在InnoDB引擎中执行optimize table 语句时，会出现Table does not support optimize, doing recreate + analyze instead的提示信息，
该信息是正常执行返回的结果，可忽略。确认返回ok即可。

3.使用ALTER TABLE xx ENGINE=INNODB;命令:这个命令也可以对表进行重建，它也会锁表，所以要在业务低峰期执行，并且要注意备份数据。

root@localhost:test 05:06:12 >alter table t4today engine = innodb;
Query OK, 0 rows affected (0.06 sec)
Records: 0  Duplicates: 0  Warnings: 0

###5.7版本有索引可能需要重建索引,否则清理碎片后,磁盘空间可能更大
#查看索引
show index from username.tablename

#重建索引
ALTER TABLE tablename DROP INDEX key_name;
ALTER TABLE tablename ADD INDEX key_name(column_name);
#重建主键
ALTER TABLE tablename DROP PRIMARY KEY;
ALTER TABLE tablename ADD PRIMARY KEY (column_name);

############################################非常规方法############################################

使用TRUNCATE TABLE命令: 这个命令可以删除表中的所有数据，并目回收空间。
它相当于先删除表，然后再创建一个空表。它不会锁表，但是会删除所有数据，需要和业务方沟通好数据问题，谨慎使用，并且要注意备份数据。

要避免表碎片，你可以参考以下的建议：

尽量按照索引顺序插入数据：如果你的表有主键或者唯一索引，那么尽量按照这些索引的顺序插入数据，避免随机插入。
这样可以减少页分裂或页合并的可能性。

尽量避免删除或更新可变长度的字段：如果你的表有可变长度的字段（如varchar），那么尽量避免删除或更新这些字段，
因为这样可能会导致空间浪费或页分裂。如果你需要删除或更新这些字段，那么可以考虑使用固定长度的字段（如char）来替换它们。

定期清理表碎片：MySQL官方建议不要经常（每小时或每天）进行碎片整理，一般根据实际情况，只需要每周或者每月挑选业务低峰期整理一次即可。
