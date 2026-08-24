---
title: OUTFILE导出
published: 2023-10-15
description: "使用INTO OUTFILE两种格式"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

使用INTO OUTFILE两种格式
#直接导出
mysql -hxx.xx.xx.xx -p2881 -uroot@ocp_meta -p \
-e "SELECT * FROM oracle.active_log_table INTO OUTFILE '/tmp/data.xls';"

#在数据库里导出
mysql -hxx.xx.xx.xx -p2881 -uroot@sys -p
SELECT *
INTO OUTFILE '/tmp/data.xls'
fields terminated by ','
lines terminated by '\n'
FROM oracle.active_log_table;

#############################################报错问题#############################################

1.设置参数为空,修改参数需要使用sock连接方式修改,否则报错
ERROR 1235 (0A000): modify SECURE_FILE_PRIV not by unix socket connection not supported
#sql.sock路径不同版本查看:
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000002522398

2.使用observer直连2881,不能通过obproxy,并且secure_file_priv从 V4.2.1需要为'/',否则报错
ERROR 1227 (42501): Access denied
#secure_file_priv设置方法:
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000002015981

mysql -uroot@ocp_meta -pxxxx -S $OB_HOME/run/sql.sock
SET GLOBAL secure_file_priv = '/';
#重连
show variables like 'secure-file-priv'

3.如果是多表子查询,最后要把sql再套一层,否则报错
ERROR 5617 (HY000): inapproproiate INTO

4.导出目录在-hxx.xx.xx.xx服务器上必须有admin的读写权限,否则报错
ERROR 4009 (58030): IO error

#########################################另一种临时方法
mysql -H 'select x from x;' > xxx.html
然后浏览器打开, 然后ctrl+a ctrl+c 然后在excel里ctrl+v
