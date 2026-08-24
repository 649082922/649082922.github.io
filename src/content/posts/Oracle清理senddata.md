---
title: Oracle清理senddata
published: 2024-10-15
description: "CREATE OR REPLACE PROCEDURE PROC_SC2 (proc_l VARCHAR2,PROC_N NUMBER)"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

CREATE OR REPLACE PROCEDURE PROC_SC2 (proc_l VARCHAR2,PROC_N NUMBER)
AUTHID CURRENT_USER
AS
CUR_1 SYS_REFCURSOR;
V_NAME VARCHAR2(66);
V_SQL VARCHAR2(666);
v_COUNT NUMBER;
V_1 NUMBER:=0+PROC_N;
BEGIN
SELECT COUNT(1) INTO v_COUNT FROM user_tables WHERE table_name=UPPER(proc_l);
IF v_count>0 THEN
V_SQL:='DROP TABLE '||proc_l||' PURGE';
EXECUTE IMMEDIATE V_SQL;
END IF;
OPEN CUR_1 FOR SELECT SEGMENT_NAME INTO V_NAME
               FROM (SELECT ROWNUM RM,SEGMENT_NAME FROM USER_SEGMENTS a WHERE SEGMENT_TYPE like 'TABLE%'
                                                                        AND SEGMENT_NAME<>'RDI_IND_CUST_INFO'
                                                                        AND SEGMENT_NAME<>'RDI_INDIV_DEPOSIT_ACCT')
               WHERE RM>=PROC_N AND RM<=PROC_N+9;
LOOP
FETCH CUR_1 INTO V_NAME;
EXIT WHEN CUR_1%NOTFOUND;
select COUNT(1) INTO V_COUNT from USER_tab_cols
where table_name=V_NAME AND column_name=UPPER('data_dt');
IF V_COUNT>0 THEN
V_SQL:=' CREATE TABLE '||proc_l||' TABLESPACE zbc AS SELECT * FROM '||V_NAME||'
                                       WHERE SUBSTR(data_dt,1,3)=''202''
                                       or data_dt=''2019-12-31''';
dbms_output.put_line(V_1||'  '||V_NAME);
EXECUTE IMMEDIATE V_SQL ;
V_SQL:='TRUNCATE TABLE '||V_NAME;
EXECUTE IMMEDIATE V_SQL;
V_SQL:='INSERT INTO '||V_NAME||' SELECT * FROM '||proc_l;
COMMIT;
EXECUTE IMMEDIATE V_SQL;
V_SQL:='DROP TABLE '||proc_l||' PURGE';
EXECUTE IMMEDIATE V_SQL;
END IF;
V_1:=V_1+1;
END LOOP;
CLOSE CUR_1;
EXCEPTION
 WHEN OTHERS THEN
 DBMS_OUTPUT.PUT_LINE(SQLERRM);
END;
