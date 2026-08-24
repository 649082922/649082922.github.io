---
title: SQL_LOADER
published: 2026-08-18
description: "参考：https://blog.csdn.net/yk10010/article/details/88978522"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

参考：https://blog.csdn.net/yk10010/article/details/88978522

#########################################################
注意事项：
表名和列名不要用中文，ctl文件写起来很麻烦
尽量不要空空格分隔符，内容里有空格就会报错
不要写注释在ctl文件中，可能会识别不了

#########################################################
OPTIONS (skip=1,rows=128)     -- skip=1 用来跳过数据中的第一行
LOAD DATA
CHARACTERSET UTF8             -- 必加，不然容易乱码
INFILE '/path/to/data.csv'    -- 数据文件路径
APPEND                        -- 加载模式（APPEND/REPLACE/INSERT）
INTO TABLE your_table         -- 目标表
FIELDS TERMINATED BY ','      -- 字段分隔符（如逗号、制表符X'09'）
OPTIONALLY ENCLOSED BY '"'    -- 数据中每个字段用 '"' 框起，比如字段中有 "," 分隔符时（可选）
TRAILING NULLCOLS 			  --表的字段没有对应的值时允许为空
(
   col1 CHAR,                 -- 列定义及数据类型(数据类型可以不写)
   col2 INTEGER EXTERNAL,
   col3 DATE "YYYY-MM-DD"
)

sqlldr oracle/oracle control=/home/demo.ctl  data=/home/demo.txt  direct=true;

Direct导入可以跳过数据库的相关逻辑(DIRECT=TRUE)，而直接将数据导入到数据文件中，可以提高导入数据的性能。
在很多情况下，不能使用此参数(如果主键重复的话会使索引的状态变成UNUSABLE!)。
