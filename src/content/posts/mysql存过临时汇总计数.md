---
title: mysql存过临时汇总计数
published: 2026-07-26
description: "create table db_sqltext_temp_all (table_name varchar(36),"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

--创建汇总表
create table db_sqltext_temp_all (table_name varchar(36),
								  gmt_create varchar(12),
								  sql_fulltext mediumtext);

-- 如果存储过程存在，先删除存储过程
DROP PROCEDURE IF EXISTS proc_sqltext_temp_all;
-- 定义存储过程
CREATE PROCEDURE proc_sqltext_temp_all()
BEGIN
        -- 定义变量记录循环处理是否完成
	DECLARE done BOOLEAN DEFAULT FALSE;
        -- 定义变量传递表名
	DECLARE v_tablename BIGINT(12);
	-- 定义游标,将需要查询的表取出
	DECLARE cursor_student CURSOR FOR select substr(table_name,12) from information_schema.tables
									   where table_name like 'db_sqltext_%'
									     and substr(table_name,12) regexp '^[0-9]';
	-- 定义CONTINUE HANDLER，当循环结束时 done=true
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=TRUE;
	-- 打开游标
	OPEN cursor_student;
	-- 重复遍历
	REPEAT
		-- 每次读取一次游标
		FETCH cursor_student INTO v_tablename;
                -- 汇总表
set @sql_run1= concat('insert into db_sqltext_temp_all select ',v_tablename,' ,DATE_FORMAT(gmt_create,''%Y'') ,sql_fulltext
														 from db_sqltext_',v_tablename,'
													    where (sql_fulltext like ''%temp\_%'' or sql_fulltext like ''%\_temp%''
														   or  sql_fulltext like ''%tmp\_%'' or sql_fulltext like ''%\_tmp%''
														   or  sql_fulltext like ''%test\_%'' or sql_fulltext like ''%\_test%'')');

	prepare stmt1 from @sql_run1;

	execute stmt1;

	deallocate prepare stmt1;

	-- 结束循环，意思是等到done=true时，结束循环REPEAT
	UNTIL done END REPEAT;
	-- 查询结果，仅会展示查出的最后一条
	SELECT v_tablename;
	-- 关闭游标
	CLOSE cursor_student;
END;

-- 执行存储过程
CALL proc_sqltext_temp_all();
