---
title: ob到o
published: 2026-01-14
description: "类型	               支持的操作"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

参考文档:
https://www.oceanbase.com/docs/enterprise-oms-doc-cn-1000000000091379

支持介绍
使用限制4.2企业版
oms使用前提
oms操作步骤
#########################################支持介绍

类型	               支持的操作
单主库	               结构迁移 + 全量迁移 + 增量同步+ 全量校验 + 反向增量
单备库	               不支持将单备库的 Oracle 数据源作为数据迁移的目标端
主备库	               主库：支持结构迁移 + 全量迁移 + 增量同步
                       备库：支持全量校验 + 反向增量

同时，OMS 支持将多个 OceanBase 数据库 Oracle 租户的表数据汇聚至 Oracle 数据库的同一张表中，
其中无需结构迁移，只需要进行全量迁移和增量同步。该汇聚同步功能的使用限制如下：

对于全量迁移和增量同步，源端有的列，目标端必须有。如果不满足该要求，OMS 会报错。
主键列在源端表中必须存在。
目标表中的列，可以存在源端不存在的列。

迁移类型	描述
结构迁移	结构迁移任务开始后，OMS 会迁移源库中的数据对象定义（表、索引、约束、注释和视图等）
            至目标端数据库中，并自动过滤临时表。
全量迁移	全量迁移任务开始后，OMS 会迁移源库表的存量数据至目标端数据库对应的表中。如果选择 全量迁移，
            建议您在迁移数据前，收集 OceanBase 数据库 Oracle 租户的统计信息。详情请参见 手动收集统计信息。
增量同步	增量同步任务开始后，OMS 会同步源库发生变化的数据（新增、修改或删除）至目标端数据库对应的表中。
            增量同步 包括 同步 DML 和 同步 DDL，您可以根据需求进行选择。
			当源端与目标端数据库字符集编码不一致时，OMS 不支持表结构字段变更。
			同步 DDL 的详情请参见 OceanBase 数据库 Oracle 租户至 Oracle 数据库的同步 DDL。
			增量同步 的使用限制如下：
              如果您选择了 同步 DDL，当源端数据库发生 OMS 未支持的同步 DDL 操作时，会存在数据迁移中断的风险。
              如果 DDL 操作为新增列，建议您设置该列的属性为 Null，会存在数据迁移中断的风险。

全量校验	在全量迁移完成、增量数据同步至目标端并与源端基本追平后，OMS 会自动发起一轮针对
            源库配置的数据表和目标表的全量数据校验任务。
            如果选择 全量校验，建议您在全量校验开始前，收集 OceanBase 数据库 Oracle 租户的统计信息，
			并使用 GATHER_SCHEMA_STATS 或 GATHER_TABLE_STATS 语句收集 Oracle 数据库的统计信息。
            如果您选择了 增量同步，且 同步 DML 选项中未选择所有的 DML，则 OMS 不支持本场景下的全量数据校验。

反向增量	反向增量任务开始后，可以实时回流业务切换后在目标端数据库产生的变更数据至源端数据库。
            以下情况均不支持选择 反向增量：
              存在多表汇聚的情况。
              存在 Schema 多到一映射的情况。

#########################################使用限制4.2企业版
源端数据库的操作限制
请勿在结构迁移和全量迁移阶段执行库或表结构变更的 DDL 操作，否则可能造成数据迁移项目中断。

目前支持 Oracle 数据库 10G/11G/12C/18C/19C 版本，12C 及以上版本包含数据库容器（Container Database，CDB）和可插拔数据库（Pluggable Database，PDB）。
不支持表中全部列均为 LOB 类型（BLOB/CLOB/NCLOB）的增量数据迁移。
不支持迁移 OceanBase 数据库 Oracle 租户的非模板化二级分区表至 Oracle 数据库。
仅支持有主键表的多表汇聚。
OMS 暂不支持基于表达式的索引。
目标端是数据库的情况下，OMS 不支持目标端存在 Trigger。如果存在，可能导致数据迁移失败。
源端 OceanBase 数据库为 1.4.x 版本时，OMS 不支持主键中包含 FLOAT 和 DOUBLE 类型。
数据源标识和用户账号等，在 OMS 系统内全局唯一。
Oracle 数据库的增量日志解析最大支持 5T/天。
Oracle 数据库 11G 及以下版本不支持创建超过 30 个字节的数据库对象。请注意迁移 OceanBase 数据库 Oracle 租户的数据至 Oracle 数据库时，不能在源端创建大于本限制的数据库对象。
OceanBase 数据库 Oracle 租户至 Oracle 数据库 12C 及以上版本的反向增量步骤，OMS 不支持迁移超过 30 个字节的数据库对象（包括 Schema、表和列等）。如果您需要迁移超过 30 个字节的数据库对象，请参见 如何迁移超过 30 个字节的 Oracle 数据库对象。
OMS 仅支持迁移库名、表名和列名为 ASCII 码且不包含特殊字符（包括 .|"'`()=;/& 和换行）的对象。
OMS 不支持 OceanBase 备库作为源端
OceanBase 数据库 Oracle 租户至 Oracle 数据库的反向增量中，OMS 不支持 Oracle 数据库执行某些 UPDATE 命令。以下示例为一个不支持的 UPDATE 命令。
UPDATE TABLE_NAME SET KEY=KEY+1;

#########################################oms使用前提

1.已在目标端 Oracle 数据库创建对应的 Schema,及对应大小的表空间,及授权
select 'create tablespace '||tablespace_name||' datafile ''+DATA_DG'' size 1024M autoextend on next 100M maxsize unlimited;'
      SUM(bytes) / 1024 / 1024 / 1024
 from  dba_segments
 where owner in ('oracle') --用户名
group by tablespace_name
order by 2 desc;

CREATE USER oracle IDENTIFIED BY oracle DEFAULT TABLESPACE demo;

GRANT CONNECT TO oracle;
GRANT CREATE VIEW TO oracle;
GRANT CREATE CLUSTER TO oracle;
GRANT CREATE INDEXTYPE TO oracle;
GRANT CREATE OPERATOR TO oracle;
GRANT CREATE PROCEDURE TO oracle;
GRANT CREATE SEQUENCE TO oracle;
GRANT CREATE TABLE TO oracle;
GRANT CREATE TRIGGER TO oracle;
GRANT CREATE TYPE TO oracle;

GRANT UNLIMITED TABLESPACE TO TS;

2.为源端 OceanBase 数据库 Oracle 租户和目标端 Oracle 数据库创建专用于数据迁移项目的数据库用户
以19c非 PDB,不做细致权限划分为例
1>创建用户
create user omsadmin identified by oraoms1# account unlock;
###ob没有 account unlock语法

2>执行下述授权语句，为迁移用户赋予 DBA 权限。
GRANT DBA TO <user_name>;

3>执行下述语句，赋予迁移用户对 SYS.USER$ 表的读权限。
GRANT SELECT ON SYS.USER$ TO <user_name>;

3."源端业务租户"中创建 __OCEANBASE_INNER_DRC_USER 用户并赋予其权限。
1>基本权限
CREATE USER '__OCEANBASE_INNER_DRC_USER' IDENTIFIED BY "oraoms1#";  -- 复杂密码双引号，MySQL用户名小写创建
GRANT CREATE SESSION TO '__OCEANBASE_INNER_DRC_USER';
GRANT SELECT ANY DICTIONARY TO '__OCEANBASE_INNER_DRC_USER';

2>对迁移库表的 SELECT 权限，支持以下两种赋权方式：
赋予系统权限
GRANT SELECT ANY TABLE TO '__OCEANBASE_INNER_DRC_USER';
赋予对象权限（仅支持对具体库表对象赋权,常见用于MySQL租户）
GRANT SELECT ON <schema>.<table> TO '__OCEANBASE_INNER_DRC_USER';

4.创建 DRC 用户
读取 OceanBase 数据库的增量日志数据和数据库对象结构信息，在源端 sys 租户下创建 DRC 用户。
CREATE USER drcadmin IDENTIFIED BY oradrc1#;
GRANT SELECT ON *.* TO drcadmin;

https://www.oceanbase.com/docs/enterprise-oms-doc-cn-1000000000091344

5.源端-最大允许包大小检查参数修改
set global max_allowed_packet=67108864

6.归档日志开启
#开之前看看有没有配置备份目录,归档存档目录和备份是同一个,3.x只能设置在一起,4.x忽略提示
https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000001052459
show parameters like 'backup_dest';

#os执行,使用NFS目录,提前建好路径,否则报错I/O异常
cd /ob_data
mkdir archive
chown admin:admin archive

#数据库执行log_archive_dest里的路径
alter system set log_archive_dest='LOCATION=file:///OBBACKUP/tpccarchive' [TENANT=obmark_mysql_tenant];
alter system archivelog [TENANT=ALL/obmark_mysql_tenant];
参考:https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000001050235
回退:ALTER SYSTEM NOARCHIVELOG [TENANT = ALL/obmark_mysql_tenant];
参考:https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000002013182

#########################################oms操作步骤

1.新建数据迁移项目。
登录 OMS 控制台。
在左侧导航栏，单击 数据迁移。
在 数据迁移 页面，单击右上角的 新建迁移项目。

2.在 选择源和目标 页面，配置各项参数。

3.单击 下一步，在 选择迁移类型 页面，配置各项参数。
迁移类型 包括 结构迁移、全量迁移、增量同步、全量校验 和 反向增量。

4.（可选）单击 下一步。
源端为 OceanBase 数据库 Oracle 租户数据源时：
如果您需要进行增量同步，请配置 Configurl、用户名和密码。
如果您仅需要进行结构迁移，请配置用户名和密码。

5.单击 下一步，在 选择迁移对象 页面，选择迁移对象和迁移范围。

6.单击 下一步，在 迁移选项 页面，配置各项参数。

7.单击 预检查，系统对数据迁移项目进行预检查。
1>源端-最大允许包大小检查=警告,这个能改就改,后面全量迁移太慢了
2>源端-禁止伪列存在检查  =警告,不清楚影响

#########################################oms迁移过程

1.结构迁移
1>已完成(有转换),ob的约束语法带有"ENABLE",会将"ENABLE"词删除转换成DDL语句给Oracle导入
2>约束报错,修改名字或删除约束尝试重导新导入

2.全量迁移
预估行数53,517,096
开始时间8:41,完成时间13:42,用时5小时
ob数据库unit规格:4C/16G,日志盘48G,3-3-3架构
目标端oracle资源:8C,SGA=8G,PGA=2G,使用ASMM

3.增量同步
源端插入测试,目标端检查被插入表情况
oms web端同步对象统计未记录插入数据,但数据正常插入到目标服务器

4.全量校验
时间太久,进度条跑到一半就跳了

5.正向切换

如果数据迁移项目未启用正向切换，请删除目标端数据库对应的唯一索引和伪列。如果不删除唯一索引和伪列，
会导致无法写入数据，以及往下游导入数据时，会重新生成伪列，导致与源端数据库的伪列发生冲突。

如果数据迁移项目已启用正向切换，OMS 会根据数据迁移项目的类型，自动删除隐藏列和唯一索引。
详情请参见 数据迁移服务隐藏列机制说明。
https://www.oceanbase.com/docs/enterprise-oms-doc-cn-1000000000091479

1.执行下述命令（其中 {schema}、{table} 需要替换），判断是否为无主键表。如果无返回结果，即可视为无主键表。

SELECT 1
  FROM (SELECT DC.OWNER, DC.TABLE_NAME, DC.CONSTRAINT_NAME
          FROM ALL_CONS_COLUMNS DCC
          JOIN ALL_CONSTRAINTS DC
            ON DCC.CONSTRAINT_NAME = DC.CONSTRAINT_NAME
           AND DCC.OWNER = DC.OWNER
          JOIN ALL_TAB_COLUMNS DTC
            ON DCC.COLUMN_NAME = DTC.COLUMN_NAME
           AND DCC.OWNER = DTC.OWNER
           AND DCC.TABLE_NAME = DTC.TABLE_NAME
         WHERE DCC.OWNER = {schema}
           AND DCC.TABLE_NAME = {table}
           AND DC.CONSTRAINT_TYPE IN ('U', 'P')
         GROUP BY DC.OWNER, DC.TABLE_NAME, DC.CONSTRAINT_NAME
        HAVING COUNT(*) = COUNT(CASE DTC.NULLABLE
          WHEN 'Y' THEN
           NULL
          ELSE
           1
        END)
        MINUS
        SELECT TABLE_OWNER, TABLE_NAME, INDEX_NAME
          FROM ALL_IND_EXPRESSIONS
         WHERE TABLE_OWNER = {schema}
           AND TABLE_NAME = {table});

2.添加隐藏列
// Oracle 数据库 12C 以前版本
ALTER TABLE "{schema}"."{table}" ADD "OMS_PK_INCRMT" NUMBER;
// Oracle 数据库 12C 及以后版本
ALTER TABLE "{schema}"."{table}" ADD "OMS_PK_INCRMT" NUMBER INVISIBLE;

3.添加唯一索引
// 有分区字段
CREATE UNIQUE INDEX "{schema}"."{table}" ON "{schema}"."{table}"("{partition_col_0}", "{partition_col_1}", "OMS_PK_INCRMT") LOCAL;
// 没有分区字段
CREATE UNIQUE INDEX "{schema}"."{table}" ON "{schema}"."{table}"("OMS_PK_INCRMT");

4.删除唯一索引
DROP INDEX "{schema}"."{table}";

5.删除隐藏列
ALTER TABLE "{schema}"."{table}" DROP COLUMN "OMS_PK_INCRMT";

#########################################导入存过,函数等对象
dbcat只能用来从Oracle到OceanBase导入
OceanBase到Oracle只能用obdump导出,再手动导入

1.执行obdumper导出sql
obdumper -h 172.30.199.49 -P 2883 -uroot -c obcluster -t test_tenant_1 -p Root@2021 -D db1 \
-sys-user=root --sys-password=****** -f /tmp/test_tenant_1/table_schema_meta \
--all --ddl --skip-check-dir --skip-header
3534个对象,用时15.83分钟

2.将所有除TABLE数据库定义对象,在Oracle目标端执行
#删除首位两行
sed -i -e '1d' -e '$d' file.sql
#对最后一行添加"/"
echo "/" >> file.sql

#执行创建对象语句sql,一定要在指定用户下登陆执行
sqlplus oracle/oracle
