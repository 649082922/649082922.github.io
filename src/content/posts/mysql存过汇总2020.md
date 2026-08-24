---
title: mysql存过汇总2020
published: 2025-07-04
description: "create table db_sqltext_1 (	 id         int(11) unsigned,"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

#################################前期测试数据###########################################
-- 建表
create table db_sqltext_1 (	 id         int(11) unsigned,
								  gmt_create datetime,
								  db_pk      int(11) unsigned,
								  sql_pk	 int(11) unsigned,
								  snap_id    int(11) unsigned,
								  sql_id	 varchar(13),
								  fms		 decimal(65,30),
								  psn		 varchar(30),
								  sqltext	 varchar(128),
								  sql_fulltext mediumtext,
								  origin_id	 int(11) unsigned,
								  gmt_modified datetime,
								  first_load_time datetime);
create table db_sqltext_2 (	 id         int(11) unsigned,
								  gmt_create datetime,
								  db_pk      int(11) unsigned,
								  sql_pk	 int(11) unsigned,
								  snap_id    int(11) unsigned,
								  sql_id	 varchar(13),
								  fms		 decimal(65,30),
								  psn		 varchar(30),
								  sqltext	 varchar(128),
								  sql_fulltext mediumtext,
								  origin_id	 int(11) unsigned,
								  gmt_modified datetime,
								  first_load_time datetime);
create table db_sqltext_3 (	 id         int(11) unsigned,
								  gmt_create datetime,
								  db_pk      int(11) unsigned,
								  sql_pk	 int(11) unsigned,
								  snap_id    int(11) unsigned,
								  sql_id	 varchar(13),
								  fms		 decimal(65,30),
								  psn		 varchar(30),
								  sqltext	 varchar(128),
								  sql_fulltext mediumtext,
								  origin_id	 int(11) unsigned,
								  gmt_modified datetime,
								  first_load_time datetime);

-- 插入数据
insert into  db_sqltext_1 values(1,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
insert into  db_sqltext_2 values(2,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
insert into  db_sqltext_2 values(3,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
insert into  db_sqltext_3 values(4,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
insert into  db_sqltext_3 values(5,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
insert into  db_sqltext_3 values(6,sysdate(),1,1,1,'sql_id',6.6,'psn','sqltext','sql_fulltext',1,now(),now());
truncate db_sqltext_1;
truncate db_sqltext_2;
truncate db_sqltext_3;
#################################数据汇总###########################################
--创建汇总表
create table db_sqltext_all_2020 (table_name varchar(36),
								  id         int(11) unsigned,
								  gmt_create datetime,
								  db_pk      int(11) unsigned,
								  sql_pk	 int(11) unsigned,
								  snap_id    int(11) unsigned,
								  sql_id	 varchar(13),
								  fms		 decimal(65,30),
								  psn		 varchar(30),
								  sqltext	 varchar(128),
								  sql_fulltext mediumtext,
								  origin_id	 int(11) unsigned,
								  gmt_modified datetime,
								  first_load_time datetime);

-- 如果存储过程存在，先删除存储过程
DROP PROCEDURE IF EXISTS proc_sqltext_all_2020
-- 定义存储过程
CREATE PROCEDURE proc_sqltext_all_2020()
BEGIN
        -- 定义变量记录循环处理是否完成
	DECLARE done BOOLEAN DEFAULT FALSE;
        -- 定义变量传递表名
	DECLARE v_tablename BIGINT(12);
		-- 定义游标值
	DECLARE cursor_student CURSOR FOR select substr(table_name,12) from information_schema.tables
									   where table_name like 'db_sqltext_%'
									     and substr(table_name,12) regexp '^[0-9]';
	-- 定义CONTINUE HANDLER，当循环结束时 done=true
	 DECLARE CONTINUE HANDLER FOR not FOUND SET done=1;
	-- 打开游标
	OPEN cursor_student;
          -- 开始循环
  read_loop: LOOP
		-- 每次读取一次游标
		FETCH cursor_student INTO v_tablename;
    IF done THEN
      LEAVE read_loop;
    END IF;
    -- 这里做你想做的循环的事件
                    -- 汇总表
set @sql_run1= concat('insert into db_sqltext_all_2020 select ',v_tablename,' ,t.*
														 from db_sqltext_',v_tablename,' t ');
													     --  where date_format(gmt_create,''%Y'')=2020'
	prepare stmt1 from @sql_run1;

	execute stmt1;

	deallocate prepare stmt1;

	-- 结束循环，意思是等到done=true时，结束循环REPEAT
  END LOOP;
  -- 查询结果，仅会展示查出的最后一条
	SELECT v_tablename;
	-- 关闭游标
	CLOSE cursor_student;
END;

-- 执行存储过程
CALL proc_sqltext_all_2020();
