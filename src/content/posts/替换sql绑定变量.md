---
title: 替换sql绑定变量
published: 2023-12-14
description: "SELECT t1.sql_id,"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

with temp as
(
SELECT t1.sql_id,
       lower(T1.sql_text) sql_text,
       lower(T2.NAME) name,
       DATATYPE_STRING,
       CASE
         WHEN DATATYPE_STRING = 'DATE' THEN 'to_date(''' || replace(T2.VALUE_STRING,':','.') || ''',''mm/dd/yyyy hh24.mi.ss'')'
         WHEN DATATYPE_STRING LIKE 'TIMESTAMP%' THEN 'to_date(''' || replace(T2.VALUE_STRING,':','.') || ''',''mm/dd/yyyy hh24.mi.ss'')'
         WHEN DATATYPE_STRING = 'NUMBER' THEN T2.VALUE_STRING
         ELSE '''' || T2.VALUE_STRING || ''''
       END VALUE_STRING,
       position as rn
  FROM (SELECT SQL_ID, SQL_TEXT FROM V$SQL GROUP BY SQL_ID, SQL_TEXT) T1
  JOIN (SELECT a1.SQL_ID, a1.NAME, a1.VALUE_STRING, a1.position,a1.DATATYPE_STRING
          FROM (SELECT SQL_ID, NAME, VALUE_STRING,SNAP_ID,position,DATATYPE_STRING
                  FROM DBA_HIST_SQLBIND
                 GROUP BY SQL_ID, NAME, VALUE_STRING,SNAP_ID,position,DATATYPE_STRING) a1
          JOIN (SELECT SQL_ID, NAME, MAX(SNAP_ID) SNAP_ID,position,DATATYPE_STRING
                 FROM DBA_HIST_SQLBIND
                WHERE VALUE_STRING IS NOT NULL
                GROUP BY SQL_ID, NAME,position,DATATYPE_STRING) a2
            ON a1.SQL_ID = a2.SQL_ID
           AND a1.NAME = a2.NAME
           AND a1.SNAP_ID = a2.SNAP_ID
           AND a1.position = a2.position) T2
    ON T1.SQL_ID = T2.SQL_ID
 WHERE T2.VALUE_STRING IS NOT NULL
   AND t1.SQL_ID = '5u7g54s63p4ts'
)
select str1 from
(
select str1,rn from temp
MODEL RETURN UPDATED ROWS
DIMENSION BY (rn)
MEASURES (sql_text,name,value_string,CAST(' ' AS VARCHAR2(2000)) STR1)
RULES AUTOMATIC ORDER
(
STR1[ANY] ORDER BY rn = DECODE(CV(rn),1
                                ,REPLACE(sql_text[CV(rn)],name[CV(rn)],value_string[CV(rn)])
                                ,replace(STR1[CV(rn)-1],name[CV(RN)],value_string[CV(rn)])
                               )
)
ORDER BY rn desc
) where rownum <= 1;
