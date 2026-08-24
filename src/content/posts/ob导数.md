---
title: ob导数
published: 2025-06-08
description: "ob-loader-dumper-4.x.0-RELEASE需要单独下载,导数工具 V4.2.1 及之后的版本不再区分企业版和社区版"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

ob-loader-dumper-4.x.0-RELEASE需要单独下载,导数工具 V4.2.1 及之后的版本不再区分企业版和社区版
https://www.oceanbase.com/softwarecenter

java安装下载地址
https://www.oracle.com/java/technologies/javase/javase8u211-later-archive-downloads.html

软件安装官档
https://www.oceanbase.com/docs/common-oceanbase-dumper-loader-1000000000775409

obdumper 和 obloader 的使用
https://www.oceanbase.com/docs/common-oceanbase-dumper-loader-1000000000775398

#########################################软件安装#########################################

1.解压软件
unzip ob-loader-dumper-4.2.x-RELEASE.zip
cd ob-loader-dumper-4.2.x-RELEASE

2.配置运行环境
用户的本地环境中必须安装 Java 8+ 并配置 JAVA_HOME 环境变量。强烈建议安装 JDK 1.8.0_3xx 及之后的版本。
vi ~/.bash_profile
PATH=$PATH:{ob-loader-dumper}/bin/
export PATH

source ~/.bash_profile
ps:java安装变量设置不在赘述...

3.修改 JVM 参数。
JVM 内存太小可能会影响导入导出的性能，甚至影响导入导出功能的稳定性。例如：Full GC 或者 GC Crash。
编辑 JAVA_OPTS 选项所在的文件。

Linux 操作系统下，编辑 {ob-loader-dumper}/bin/ 目录下的 obloader 和 obdumper 脚本。
Windows 操作系统下，编辑 {ob-loader-dumper}/bin/windows/ 目录下的 obloader.bat 和 obdumper.bat 脚本。

示例：运行机器可用内存为 16G，将 JVM 堆内存设置为 8G。
JAVA_OPTS="$JAVA_OPTS -server -Xms8G -Xmx8G -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=128M -Xss352K"
JAVA_OPTS="$JAVA_OPTS -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -Xnoclassgc -XX:+DisableExplicitGC

#########################################软件使用#########################################

该软件只能一个库一个库的导,无法一个租户导

1.参数
导出dumper：
https://www.oceanbase.com/docs/common-oceanbase-dumper-loader-1000000001953270
导入loader：
https://www.oceanbase.com/docs/common-oceanbase-dumper-loader-1000000001953286
######必要的
-h(--host)                 连接 ODP 或者 OceanBase 物理节点的主机地址
-p(--port)	               连接 ODP 或者 OceanBase 物理节点的主机端口
-u(--user)	               指定数据库用户名、集群的租户名、集群名,格式:<user>@<tenant>#<cluster>
-c                         OB集群名
-t                         OB租户名
-D                         库名/用户名
--sys-user                 sys租户下的用户,用于查询系统表,默认值root,4.0及之后的版本无需指定该选项
--sys-password             sys租户下的密码
-f                         指定导出文件的存放路径
--file-name                指定最终导出的文件名称
--log-path                 指定 OBDUMPER 运行日志的输出目录
--thread                   导出任务的并发数,官档建议不超4,默认值：CPU 乘以 2

######业务需要
--all --ddl                     导出所有的数据库对象定义,默认的文件后缀是-schema.sql
--all [--csv,--sql,--cut]       只会导出表中的数据,不会导出数据库对象
--all --ddl [--csv,--sql,--cut] 导出所有的数据库对象定义和表数据
--column-splitter               指定列分隔字符串。（区别于 CSV 格式中的列分隔符）
--file-encoding                 表示导出数据文件时使用的文件编码，该编码不是数据库编码
--exclude-data-types	        排除导出指定的数据类型所对应的数据
--query-sql                     导出自定义结果集

######特殊需要
--drop-object		导出 DDL 时，前置追加 DROP 语句。 该选项仅与 --ddl 选项搭配使用。
--page-size                导出查询语句的分页大小。默认值：1000000
--skip-check-dir           用于标识跳过检查导出的数据目录是否为空。导出目录非空时，程序停止导出
--skip-header	           CSV 格式忽略导出表中的字段,配合--csv使用

--table-group		导出 表组 定义。	3.1.0
--table		        导出 表 定义或者 表 数据。
--view		        导出 视图 定义。
--function		    导出 函数 定义。
--procedure		    导出 存储过程 定义。
--trigger		    导出 触发器 定义。
--sequence		    导出 序列 定义。
--synonym		    导出 同义词 定义。（暂不支持 MySQL 租户）
--type		        导出 类型 定义。	4.0.0
--type-body		    导出 类型体 定义。
--package		    导出 程序包 定义。
--package-body		导出 程序包体 定义。
--thread            默认值为 CPU 乘以 2，如果 CPU 大于 16，则默认上限为 32。
--batch             批量写入的事务大小,该选项的值与表的宽度成反比的关系,默认值：200。

2.网络不通打包上传
1>打包
cd tmp_dump
tar -zcvf tmp_dump.tar *

2>将文件放置目标端口解压
mkdir -p tmp_dump
tar -xzvf tmp_dump.tar -C /xxx/xxx/tmp_dump

3.导入导出语句

导出模板（不能一次性全库导出，每次只能导单用户/单数据库）
obdumper -h 172.30.199.49 -P 2883 -uroot -c obcluster -t test_tenant_1 -p Root@2021 -D db1 \
--sys-user=root --sys-password=****** -f /tmp/test_tenant_1 --thread 32 \
--all --ddl --csv --skip-check-dir --skip-header  --log-path /tmp/test_tenant_1/

ps:多次不同用户导出可以使用相同- f 路径

导入模板
obloader -h 172.30.199.49 -P 2883 -uroot -c obcluster -t test_tenant_1 -p Root@2021 -D db1 \
-sys-user=root --sys-password=****** -f /tmp/test_tenant_1 --thread 32 \
--all --ddl --csv

#密码有特殊符号执行方法
-p'gZGd%n8K5&'

4.常用模板
#将sql语句导出成csv格式
obdumper -h 172.30.199.49 -P 2881 -uroot -t test_tenant_1 -p Root@2021 -D db1 \
-f /tmp/test_tenant_1 --csv --skip-check-dir --skip-header  \
--query-sql "select regexp_replace(empno,'[\\n\\r]+',' ')empno from tbl_test limit 100"

##regexp_replace(empno,'[\\n\\r]+',' ')empno
处理文本使用
\n：表示换行符（newline），即 ASCII 字符 \n,CHR(10)。
\r：表示回车符（carriage return），即 ASCII 字符 \r,CHR(13)。
+：加号表示匹配前面的字符集合一次或多次（即至少匹配一次）

#########################################报错#########################################
官方报错文档
https://www.oceanbase.com/knowledge-base/obloader-obdumper-1000000000486922

报错1.
[ERROR] Load failed! Error: The system config `open_cursors` value(50) may be not enough.
并行太高了,要么--thread 低于50,要么修改 open_cursors 参数

报错2.
[ERROR] Dump failed. Reason: Timeout, query has reached the maximum query timeout:300000000(us)
修改 ob-loader-dumper-192.168.1.13-RELEASE/conf 文件中的 session.config.json 的参数
set session ob_query_timeout=180000000000

报错3.
[ERROR] java.lang.OutOfMemoryError: Java heap space。
https://www.oceanbase.com/docs/common-oceanbase-dumper-loader-1000000002401648
可能涉及到宽表
vi {ob-loader-dumper}/bin/obdumper          修改 -Xms 与 -Xmx 同时调大
减小 --thread
减小 --batch

报错4.
ORA-00600:internal error code,arguments:-5031,Column not found.
这个库之前做过oms导数，有隐藏列的注释没删赶紧
sed -i '/Reserved for data migration tasks of OMS/d' /数据包路径/data/schema名/TABLE/*-schema.sql
