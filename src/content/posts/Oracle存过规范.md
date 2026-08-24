---
title: Oracle存过规范
published: 2025-11-08
description: "CREATE OR REPLACE PROCEDURE PROC_I_TMP_项目名（参数1 参数类型，"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

CREATE OR REPLACE PROCEDURE PROC_I_TMP_项目名（参数1 参数类型，
                                               参数2 参数类型）
AS

--====================================================================

/*注释部分（为了后期维护大家方便，一定要写）
1.存过说明：实现功能
2.传参说明：参数1：日期，格式20211031；
            参数2：日期，格式yyyymmdd；
3.开发日期：2021-10-31
4.存过作者：刘思汗，
            刘德华，
            周润发
5.涉及的表：来源表：表1，
                    表2，
                    表3
            中间表：表1，
                    表2，
                    表3
            目标表：表1
6.执行周期：每天跑一次
7.修改记录：没修改就写无（这里只写每次上版修改即可）
            修改时间+修改人+修改的东西
*/

--声明变量
V_SQL VARCHAR(66);--声明异常

--====================================================================
BEGIN

--xxx表(这里备注我要插入的是什么表）注意书写格式，不要只有你自己看的懂！！！
  INSERT INTO 中间表名
  AS
  SELECT T1.列1，
         T1.列2，
         T1.列3
    FROM 来源表 T1
   WHERE T1.DATA_DT=参数1--传参
         T1.DEPT_ID=参数2;
COMMIT;--每次插入都要写commit;

--xxx表(这里备注我要插入的是什么表）注意书写格式，不要只有你自己看的懂！！！！！
  INSERT INTO 中间表名2
  AS
  SELECT T2.列1，
         T2.列2，
         T2.列3
    FROM 来源表 T2
   WHERE T1.DATA_DT=参数1
         T1.DEPT_ID=参数2;
COMMIT;--每次插入都要写commit;

 EXCEPTION
   WHEN OTHERS THEN
   V_SQL:=SQLERRM;
   IF SUBSTR(v_a,1,1)='O' THEN
     INSERT INTO proc_log
            VALUES('PROC_I_TMP_项目名',--这里写存过名
            V_SQL,
            SYSDATE);
   ELSE
     INSERT INTO proc_log
            VALUES('PROC_I_TMP_项目名',--这里写存过名
            '成功',
            SYSDATE);
   END IF;
   DBMS_OUTPUT.PUT_LINE(SQLERRM);
   END
