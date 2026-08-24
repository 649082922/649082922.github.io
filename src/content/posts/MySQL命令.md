---
title: MySQL命令
published: 2024-05-14
description: "mysql -uroot -p -h127.0.0.1 -P3306"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

mysql命令

1.登陆
#-u用户 root
mysql命令

1.登陆
#-u用户 root
#-p密码 不输入则交互输入密码
#-h主机ip
#-P端口号
mysql -uroot -p -h127.0.0.1 -P3306
#免密码登陆
mysql_config_editor set --login-path=root --user=root  --host=127.0.0.1 --port=3306 -p
mysql --login-path=root -A

2.创建数据库
CREATE DATABASE 'test' CHARACTER SET 'utf8' COLLATE 'utf8_general_ci';

#CREATE DATABASE oracle：　　　  代表的是创建数据库 oracle。
#DEFAULT CHARACTER SET utf8 ：  代表的是将该库的默认编码格式设置为 utf8 格式。
#COLLATE utf8_general_ci ：　　 代表的是数据库校对规则.分为三部分，分别为数据库字符集、解释不明白、区分大小写。

#utf8_bin将字符串中的每一个字符用二进制数据存储，区分大小写。
#utf8_genera_ci不区分大小写，ci为case insensitive的缩写，即大小写不敏感。
#utf8_general_cs区分大小写，cs为case sensitive的缩写，即大小写敏感。

3.创建用户,授权(用户密码需要加引号)
#grant 权限 on 数据库名.* to 用户名@'%' identified by '密码'
#写identified by '密码'会修改密码
如:
create user 'test'@'%' identified by '123123';
grant all on test.* to 'test'@'%';
#查看用户权限
show grants for '用户名'@'%';

权限
ALTER ROUTINE 	             编辑或删除存储过程
CREATE ROUTINE 	             创建存储过程
EXECUTE			             运行存储过程
all				             全部权限
select,insert,update,delete  增删改查
create,alter,drop,index      创建,控制,删除,索引

create,alter用户报错ERROR 1396
授权用户报错ERROR 1410创建用户的时候没指定ip,create user 'test'@'%' identified by '123123';
查看用户权限ERROR 1141创建用户的时候没指定ip,create user 'test'@'%' identified by '123123';

授权如下:
GRANT CREATE, ALTER, DROP, INDEX, CREATE TEMPORARY TABLES ON *.* TO 'edpusr'@'%';
GRANT SELECT,INSERT,UPDATE,DELETE ON *.* TO 'edpusr'@'%';
GRANT ALTER ROUTINE,CREATE ROUTINE,EXECUTE ON *.* TO 'edpusr'@'%';

4.修改密码
update mysql.user set authentication_string='新密码' where user='用户名';
alter user 用户名@'%' identified by "密码";
#命令刷新权限
flush privileges;

5.在操作系统添加mysql vip
ifconfig eth0:1 vip netmask xx.xx.xx.xx broadcast xx.xx.xx.xx up

ip a add 192.168.1.11/23 dev eth0:1  新增一个别名
ip a del 192.168.1.11/24 dev eth0:1  删除一个别名

6.常用操作
#查看数据库mysql的用户信息
desc mysql.user;
#查看数据库插件路径
show variables like '%plugin_dir%';
#查看数据库目录路径
show variables like'%datadir%';
#查看所有进程
show processlist;
#在从库查看主从信息
show slave status \G;
#切binlog日志
flush binary logs;
查看binlog日志
show binary logs;

7.数据库改名
1>.要改的名
create database 新库名
2>.旧库表迁移到新库(只修改中文部分)
select CONCAT('RENAME TABLE ',TABLE_SCHEMA,'.',TABLE_NAME,' to ', '新库名.',TABLE_NAME,';')
from information_schema.`TABLES`
where TABLE_SCHEMA = '旧库名';
3>.给新库库下用户重新授权权限
show grants for '旧库名的用户名'@'%';

8.忘记mysql密码
1>.关闭mysql实例
servic mysqld stop

2>.启动使用--skip-grant-tables参数,跳过权限验证
mysqld_safe --defaults-file=/etc/my.cnf --skip-grant-tables > /tmp/mysql_start.log &

3>.mysql连接,使用update方式修改密码
mysql
update mysql.user set authentication_string=password('123123')
                where user = 'root' host = 'localhost';
flush privileges;

4>.重启数据库
mysqladmin -uroot -p123123 shutdown
mysqld_safe --defaults-file=/etc/my.cnf > /tmp/mysql_start.log &

#相关报错
#下面是存储过程不能查看报错
user does not have access to metadata required to determine stored procedure
#增加执行存储过程权限,MySQL8之前的版本需要执行
#mysql早期版本需要执行flush privileges;刷新授权
GRANT SELECT ON mysql.proc TO 'user'@'%';
flush privileges;

#执行Function的访问权限
set global log_bin_trust_function_creators=true;
flush privileges;

5.在线参数修改

1>.wait_timeout：连接空闲超时时间。
#与服务器端无交互状态的连接，直到被服务器端强制关闭而等待的时间。可以认为是服务器端连接空闲的时间，空闲超过这个时间将自动关闭。

2>.max_prepared_stmt_count 参数限制了同一时间在mysqld上所有session中prepared 语句的上限。
#它的取值范围为“0 – 1048576”，默认为16382。
#mysql对于超出max_prepared_stmt_count的prepare语句就会报错

3>.执行Function的访问权限
#当二进制日志启用后，这个变量就会启用。它控制是否可以信任存储函数创建者，不会创建写入二进制日志引起不安全事件的存储函数。
#如果设置为0（默认值），用户不得创建或修改存储函数，除非它们具有除CREATE ROUTINE或ALTER ROUTINE特权之外的SUPER权限。
#设置为0还强制使用DETERMINISTIC特性或READS SQL DATA或NO SQL特性声明函数的限制。
#如果变量设置为1，MySQL不会对创建存储函数实施这些限制。 此变量也适用于触发器的创建

set global wait_timeout=28800;
set global max_prepared_stmt_count = 200000;
set global log_bin_trust_function_creators=true;

#下面是Function无访问权限报错
ERROR 1418 (HY000): This function has none of DETERMINISTIC, NO SQL, or READS SQL DATA in its declaration and binary logging is enabled (you *might* want to use the less safe log_bin_trust_function_creators variable)

#下面是max_prepared_stmt_count超出报错
Can’t create more than max_prepared_stmt_count statements (current value: 16382)”错误。

6.mysql
正确的写法:
alter table t1 modify state varchar(22) not null default '' comment '产品状态';

错误的写法:
alter table t1 modify state varchar(22) connect '产品状态' //此操作会讲not null default ''信息清掉

这种问题会发生在mysql,tidb中,需要特别注意,oracle中则没有这种问题.

7.SHOW CREATE TABLE语句无法使用
修改参数
set SQL_QUOTE_SHOW_CREATE=0;
或
mysql -uroot -e 'SET SQL_QUOTE_SHOW_CREATE=0; use test; show create table test';
mysql -e 'use test; show create table test \G' | tr -d '`';
mysql -e 'use test; show create table test \G' | sed -e 's/`//g';
https://blog.csdn.net/aosica321/article/details/53433677
