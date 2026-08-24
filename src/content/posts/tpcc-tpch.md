---
title: tpcc-tpch
published: 2026-04-10
description: "<<<#———————————————————————————#———————————————————————————#——————————"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

<<<#———————————————————————————#———————————————————————————#———————————————————————————>>>
一、tpcc
<<<#———————————————————————————#———————————————————————————#———————————————————————————>>>
工具:benchmarksql-5.0
		/xxx/xxx/benchmarksql-5.0/run/probs.ob
建表:TPC-C脚本
参数:4.2.1TPCC-cs.md
https://www.oceanbase.com/docs/community-tutorials-cn-10000000000012261
<<<#———————————————————————————#———————————————————————————#>>>
1、准备工具
解压benchmarksql-5.0
修改probs.ob文件
	warehouses=xxx									多少仓数据,1000仓=100g,但是ob有数据压缩
	loadWorkers=									(案例写的20)
	terminals=100									并发
	runMins=60										时间
	osCollectorDevices=net_xxx blk_sda				网络相关
						--xxx = ip addr 当前ip的网卡名
2、造数
./runLoader.sh probs.ob
	然后select count(*) 各表
	select /*+ parallel(32) */ count(*) from bmsql_config
	select /*+ parallel(32) */ count(*) from bmsql_warehouse;
	select /*+ parallel(32) */ count(*) from bmsql_district;
	select /*+ parallel(32) */ count(*) from bmsql_customer;
	select /*+ parallel(32) */ count(*) from bmsql_history;
	select /*+ parallel(32) */ count(*) from bmsql_new_order;
	select /*+ parallel(32) */ count(*) from bmsql_oorder;
	select /*+ parallel(32) */ count(*) from bmsql_order_line;
	select /*+ parallel(32) */ count(*) from bmsql_item;
	select /*+ parallel(32) */ count(*) from bmsql_stock;

3、查看到ob的大小
select svr_ip,sum(data_size)/1024/1024/1024 from  dba_ob_tablet_replicas group by svr_ip;

4、执行
./runBenchmark.sh probs.ob

<<<#———————————————————————————#———————————————————————————#———————————————————————————>>>
二、tpch
<<<#———————————————————————————#———————————————————————————#———————————————————————————>>>
工具:TPC-H_Tools_v3.0.0
		/xxx/TPC-H_Tools_v3.0.0/dbgen
建表:TPC-H脚本
参数:README
	:4.2.1TPCC-cs.md
		--这俩都参考一下吧
sql:D:\zcj\自我笔记\ob\qt\任务\TPCC+H\tpch\sql\
https://www.oceanbase.com/docs/community-tutorials-cn-10000000000012262
<<<#———————————————————————————#———————————————————————————#>>>
1、准备工具
cd /xxx/TPC-H_Tools_v3.0.0/dbgen
cp makefile.suite makefile
vi makefile
	CC=gcc
	DATABASE=ORACLE
	MARCHINE=LINUX
	WORKLOAD=TPCH
make -f makefile
2、
	(选做,如果你是mysql,你需要在这里面加新的一条)
	/xxx/TPC-H_Tools_v3.0.0/dbgen/tpcd.h
	#ifdef MYSQL
	#define GEN_QUERY_PLAN ""
	#define START_TRAN "START TRANSACTION"
	#define END_TRAN "COMMIT"
	#define SET_OUTPUT ""
	#define SET_ROWCOUNT "limit %d;\n"
	#define SET_DBASE "use %s;\n"
	#endif

3、准备数据
mkdir /obbackup/db1
cp dists.dss /obbackup/db1
cp dbgen /obbackup/db1

./dbgen -s 100 -f
		-s 100代表100g -f代表覆盖

--选做(如果你想3个节点一起跑,这样造数快,需要后续脚本配置)
	3、①
	mkdir /obbackup/db2
	cp dists.dss /obbackup/db2
	cp dbgen /obbackup/db2

	mkdir /obbackup/db3
	cp dists.dss /obbackup/db3
	cp dbgen /obbackup/db3

	3、②vi gen_data.sh
		--也是三份
	split=1
	END_SPLIT=100
	while [ $split -le $END_SPLIT]
	do
	 ./dbgen -f -s xxxx -C300 -S $split 2>&1 &
	 split =$[ split + 1]
	done

	split=101
	END_SPLIT=200
	while [ $split -le $END_SPLIT]
	do
	 ./dbgen -f -s xxxx -C300 -S $split 2>&1 &
	 split =$[ split + 1]
	done

	split=201
	END_SPLIT=300
	while [ $split -le $END_SPLIT]
	do
	 ./dbgen -f -s xxxx -C300 -S $split 2>&1 &
	 split =$[ split + 1]
	done
4、准备库:
create user tpch identified by aaAA11__;
grant dba to tpch;

执行TPC-H脚本的内容,
(选做:清理↓)
alter table lineitem  set tablegroup '';
alter table orders    set tablegroup '';
alter table partsupp  set tablegroup '';
alter table part      set tablegroup '';
alter table customer  set tablegroup '';
alter table supplier  set tablegroup '';
alter table nation    set tablegroup '';
alter table region    set tablegroup '';

drop table group tpch_tg_1000g_lineitem_order_group;
drop table group tpch_tg_1000g_partsupp_part;

5、配置路径权限:
obclient -S /home/admin/oceanbase/run/sql.sock -utpch@ -p'aaAA11__'
select * from sys.tenant_virtual_global_variable where variable_name like '%secure%';
set global secure_file_priv='/obbackup/db1/'

6、加载数据
set @@session.ob_query_timeout = 7200 000000;

load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/customer.tbl' into table customer fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/lineitem.tbl' into table lineitem fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/nation.tbl'   into table nation fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/orders.tbl'   into table orders fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/partsupp.tbl' into table partsupp fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/part.tbl'     into table part fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/region.tbl'   into table region fields terminated by '|';
load data /*+ load_batch_size(1000) parallel(64)*/ infile '/obbackup/db1/supplier.tbl' into table supplier fields terminated by '|';

select /*+ parallel(32) */ count(*) from lineitem  ;
select /*+ parallel(32) */ count(*) from orders    ;
select /*+ parallel(32) */ count(*) from partsupp  ;
select /*+ parallel(32) */ count(*) from part      ;
select /*+ parallel(32) */ count(*) from customer  ;
select /*+ parallel(32) */ count(*) from supplier  ;
select /*+ parallel(32) */ count(*) from nation    ;
select /*+ parallel(32) */ count(*) from region    ;

6、执行22个sql并记录
D:\zcj\自我笔记\ob\qt\任务\TPCC+H\tpch\sql\
