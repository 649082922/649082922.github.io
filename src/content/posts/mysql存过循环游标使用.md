---
title: mysql存过循环游标使用
published: 2025-06-04
description: "DROP TABLE IF EXISTS t_student;"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

-- 学生信息表
DROP TABLE IF EXISTS t_student;
CREATE TABLE `t_student` (
  `id` BIGINT(12) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `code` VARCHAR(10) NOT NULL COMMENT '学号',
  `name` VARCHAR(20) NOT NULL COMMENT '姓名',
  `age` INT(2) NOT NULL COMMENT '年龄',
  `gender` CHAR(1) NOT NULL COMMENT '性别（M：男，F：女）',
  PRIMARY KEY (`id`),
  UNIQUE KEY UK_STUDENT (`code`)
) CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 学生成绩表
DROP TABLE IF EXISTS t_achievement;
CREATE TABLE `t_achievement` (
  `id` BIGINT(12) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `year` INT(4) NOT NULL COMMENT '学年',
  `subject` CHAR(2) NOT NULL COMMENT '科目（01：语文，02：数学，03：英语）',
  `score` INT(3) NOT NULL COMMENT '得分',
  `student_id` BIGINT(12) NOT NULL COMMENT '所属学生id',
  PRIMARY KEY (`id`)
) CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 成绩汇总表
DROP TABLE IF EXISTS t_achievement_report;
CREATE TABLE `t_achievement_report` (
  `id` BIGINT(12) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `student_id` BIGINT(12) NOT NULL COMMENT '学生id',
  `year` INT(4) NOT NULL COMMENT '学年',
  `total_score` INT(4) NOT NULL COMMENT '总分',
  `avg_score` DECIMAL(4,2) NOT NULL COMMENT '平均分',
  PRIMARY KEY (`id`)
) CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 学生信息表插入数据
INSERT INTO t_student(id, CODE, NAME, age, gender) VALUES
(1, '2022010101', '小张', 18, 'M'),
(2, '2022010102', '小李', 18, 'F'),
(3, '2022010103', '小明', 18, 'M');
-- 学生成绩表插入数据
INSERT INTO t_achievement(YEAR, SUBJECT, score, student_id) VALUES
(2022, '01', 80, 1),
(2022, '02', 85, 1),
(2022, '03', 90, 1),
(2022, '01', 60, 2),
(2022, '02', 90, 2),
(2022, '03', 98, 2),
(2022, '01', 75, 3),
(2022, '02', 100, 3),
(2022, '03', 85, 3);

-- 如果存储过程存在，先删除存储过程
DROP PROCEDURE IF EXISTS statistics_achievement;
-- 定义存储过程
CREATE PROCEDURE statistics_achievement()
BEGIN
        -- 定义变量记录循环处理是否完成
	DECLARE done BOOLEAN DEFAULT FALSE;
        -- 定义变量传递学生id
	DECLARE studentid BIGINT(12);
	-- 定义游标
	DECLARE cursor_student CURSOR FOR SELECT id FROM t_student;
	-- 定义CONTINUE HANDLER，当循环结束时 done=true
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=TRUE;
	-- 打开游标
	OPEN cursor_student;
	-- 重复遍历
	REPEAT
		-- 每次读取一次游标
		FETCH cursor_student INTO studentid;
                -- 计算总分、平均分插入汇总表
		INSERT INTO t_achievement_report(student_id, `YEAR`, total_score, avg_score)
		SELECT studentid, `YEAR`, SUM(score), ROUND(SUM(score) / 3, 2) FROM t_achievement t1 WHERE student_id = studentid AND NOT EXISTS(
			SELECT 1 FROM t_achievement_report t2 WHERE student_id = studentid AND t1.year = t2.year
		) GROUP BY `YEAR`;
	-- 结束循环，意思是等到done=true时，结束循环REPEAT
	UNTIL done END REPEAT;
	-- 查询结果，仅会展示查出的最后一条
	SELECT studentid;
	-- 关闭游标
	CLOSE cursor_student;
END$$
DELIMITER ;

-- 执行存储过程
CALL statistics_achievement();

https://www.ab62.cn/article/19763.html
http://www.popnic.cn/article/297237
