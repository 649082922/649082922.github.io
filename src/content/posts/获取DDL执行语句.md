---
title: 获取DDL执行语句
published: 2026-07-06
description: "参考https://www.cnblogs.com/smyx/p/13743076.html"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

参考https://www.cnblogs.com/smyx/p/13743076.html

注意如果使用sqlplus需要进行下列格式化，特别需要对long进行设置，否则无法显示完整的SQL

set linesize 180
set pages 999
set long 90000

1.查看序列定义的SQL语句
select dbms_metadata.get_ddl('SEQUENCE','SEQ_ID') from dual;

2.查看表的定义

select dbms_metadata.get_ddl('TABLE','TABLENAME','USERNAME') from dual;

3.查看用户的约束定义

select dbms_metadata.get_ddl('CONSTRAINT','CONSTRAINTNAME','USERNAME') from dual;

4.查看外键定义

select dbms_metadata.get_ddl('REF_CONSTRAINT','REF_CONSTRAINTNAME','USERNAME') from dual;

5.查看视图sql语句的定义

select dbms_metadata.get_ddl('VIEW','VIEWNAME','USERNAME') from dual;

6.查看用户定义

select dbms_metadata.get_ddl('USER','USERNAME') from dual;

7.查看表空间定义

select dbms_metadata.get_ddl('TABLESPACE','TABLESPACENAME') from dual;

8.查看物化视图定义

select dbms_metadata.get_ddl('MATERIALIZED VIEW','MVNAME') from dual;

9.查看DB_LINK语句定义

select dbms_metadata.get_ddl('DB_LINK','DBLINKNAME','USERNAME') from dual;

10.查看用户触发器定义

select dbms_metadata.get_ddl('TRIGGER','TRIGGERNAME','USERNAME') from dual;

11.查看函数语句定义

select dbms_metadata.get_ddl('FUNCTION','FUNCTIONNAME','USERNAME') from dual;

12.查看包定义

select dbms_metadata.get_ddl('PACKAGE','PACKAGENAME','USERNAME') from dual

13.查看存储过程定义

select dbms_metadata.get_ddl('PROCEDURE','PROCEDURENAME','USERNAME') from dual

14.查看权限的定义

select dbms_metadata.get_ddl('ROLE_GRANT','rolename') from dual;

15. 查看系统权限的定义

select dbms_metadata.get_ddl('SYSTEM_GRANT','rolename') from dual;

16. 查看对像权限的定义

select dbms_metadata.get_ddl('OBJECT_GRANT','角色名') from dual;

17.查看db_link定义

SELECT to_char(dbms_metadata.get_ddl('DB_LINK','SRP1.COM','PUBLIC')) FROM dual;

查看当前用户表的SQL
select dbms_metadata.get_ddl('TABLE','EMPLOYEES') from dual;
查看其他用表或索引的SQL

SELECT DBMS_METADATA.GET_DDL('TABLE','DEPT','SCOTT') FROM DUAL;

查看创建用户索引的SQL
查看所需表的索引
```
SQL> select INDEX_NAME, INDEX_TYPE, TABLE_NAME from user_indexes WHERE table_name='EMP';
```
查看当前用户索引的SQL
select dbms_metadata.get_ddl('INDEX','PK_DEPT') from dual;

查看其他用户索引的SQL
select dbms_metadata.get_ddl('INDEX','PK_DEPT','SCOTT‘) from dual;
查看创建主键的SQL
查看所需表的约束
```
SQL> select owner, table_name, constraint_name, constraint_type from user_constraints where table_name='EMP';
```
查看创建主键的SQL
SELECT DBMS_METADATA.GET_DDL('CONSTRAINT','EMP_PK') FROM DUAL;
查看创建外键的SQL
```
SQL> SELECT DBMS_METADATA.GET_DDL('REF_CONSTRAINT','EMP_FK_DEPT') FROM DUAL;
```
查看创建VIEW的语句
查看当前用户视图的SQL
```
SQL> SELECT dbms_metadata.get_ddl('VIEW', 'MY_TABLES')
```

查看其他用户视图的SQL
```
SQL> SELECT dbms_metadata.get_ddl('VIEW', 'MY_TABLES','SCOTT‘) FROM DUAL;
```
查看创建视图的SQL也可以
```
SQL> select text from user_views where view_name=upper('&view_name');
```
DBMS_METADATA.GET_DDL的一些使用技巧
1、得到一个用户下的所有表，索引，存储过程，函数的ddl
SELECT DBMS_METADATA.GET_DDL(U.OBJECT_TYPE, u.object_name)
FROM USER_OBJECTS u
where U.OBJECT_TYPE IN ('TABLE','INDEX','PROCEDURE','FUNCTION‘);
2、得到所有表空间的ddl语句
SELECT DBMS_METADATA.GET_DDL('TABLESPACE', TS.tablespace_name)
FROM DBA_TABLESPACES TS;
3、得到所有创建用户的ddl
SELECT DBMS_METADATA.GET_DDL('USER',U.username)
FROM DBA_USERS U;
4、去除storage等多余参数
EXECUTE DBMS_METADATA.SET_TRANSFORM_PARAM(DBMS_METADATA.SESSION_TRANSFORM,'STORAGE',false);

--所支持的45个OBJECT TYPE：

　　Type Name Meaning
　　------------------------------ ------------------------------
　　AUDIT_OBJ audits of schema objects
　　AUDIT audits of SQL statements
　　ASSOCIATION associate statistics
　　CLUSTER clusters
　　COMMENT comments
　　CONSTRAINT constraints
　　CONTEXT application contexts
　　DB_LINK database links
　　DEFAULT_ROLE default roles
　　DIMENSION dimensions
　　DIRECTORY directories
　　FUNCTION stored functions
　　INDEX indexes
　　INDEXTYPE indextypes
　　JAVA_SOURCE Java sources
　　LIBRARY external procedure libraries
　　MATERIALIZED_VIEW materialized views
　　MATERIALIZED_VIEW_LOG materialized view logs
　　OBJECT_GRANT object grants
　　OPERATOR operators
　　OUTLINE stored outlines
　　PACKAGE stored packages
　　PACKAGE_SPEC package specifications
　　PACKAGE_BODY package bodies
　　PROCEDURE stored procedures
　　PROFILE profiles
　　PROXY proxy authentications
　　REF_CONSTRAINT referential constraint
　　ROLE roles
　　ROLE_GRANT role grants
　　ROLLBACK_SEGMENT rollback segments
　　SEQUENCE sequences
　　SYNONYM synonyms
　　SYSTEM_GRANT system privilege grants
　　TABLE tables
　　TABLESPACE tablespaces
　　TABLESPACE_QUOTA tablespace quotas
　　TRIGGER triggers
　　TRUSTED_DB_LINK trusted links
　　TYPE user-defined types
　　TYPE_SPEC type specifications
　　TYPE_BODY type bodies
　　USER users
　　VIEW views
　　XMLSCHEMA XML schema
