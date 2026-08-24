---
title: GaussDB数据库开发设计
published: 2023-12-18
description: "3.1 选择服务列表-弹性云服务器，在服务器列表找到ecs-hccdp"
tags: ["GaussDB", "实战笔记"]
category: 数据库
draft: false
---

3 登录ECS云服务器
3.1 选择服务列表-弹性云服务器，在服务器列表找到ecs-hccdp
3.2 查看预支好的ecs-os绑定的弹性ip
3.3 打开桌面上的终端 ，使用如下命令登录ecs-hccdp.(用实际弹性ip地址替换命令中的EIP)

ssh root@EIP

3.4 下载GaussDB链接工具并解压
wget https://dbs-download.obs.cn-north-1.myhuaweicloud.com/GaussDB/1642684986086/GaussDB_opengauss_client_tools.zip
unzip GaussDB_opengauss_client_tools.zip
cd /root/GaussDB_opengauss_client_tools/Euler2.5_X86_64
cp GaussDB-Kernel-V500R001C20-EULER-64bit-gsql.tar.gz /opt
cd /opt/
tar -zxvf GaussDB-Kernel-V500R001C20-EULER-64bit-gsql.tar.gz
source gsql_env.sh

3.5 使用gsql客户端连接数据库，并创建数据库及对应用户，以下命令的192.168.0.50是GaussDB主节点的IP，Test-1234是数据库密码，请根据实际情况替换
gsql -h 192.168.0.50 -d postgres -p 8000 -U root -W Test-1234 -r

3.6 创建一个'devdb'的库并登录
CREATE DATABASE devdb ENCODING 'UTF8' template = template0;
\q
gsql -h 192.168.0.50 -d devdb -p 8000 -U root -W Test-1234 -r
CREATE USER hccdp SYSADMIN IDENTIFIED BY "NHY^7ujm";
\q

3.7 登录devdb库，192.168.0.50是主节点IP注意根据实际情况更换，hccdp是用户名，NHY^7ujm是密码
gsql -h 192.168.0.50 -d devdb -p 8000 -U hccdp -W NHY^7ujm -r

4 使用create语句创建表
由于存在外键关联，需要注意创建先后顺序
--1
CREATE TABLE bmsql_warehouse (
     w_id integer NOT NULL,
     w_ytd numeric(12,2),
     w_tax numeric(4,4),
     w_name character varying(10),
     w_street_1 character varying(20),
     w_street_2 character varying(20),
     w_city character varying(20),
     w_state character(2),
     w_zip character(9)
 );
ALTER TABLE bmsql_warehouse ADD CONSTRAINT bmsql_warehouse_pkey PRIMARY KEY (w_id);
--2
CREATE TABLE bmsql_district (
     d_w_id integer NOT NULL,
     d_id integer NOT NULL,
     d_ytd numeric(12,2),
     d_tax numeric(4,4),
     d_next_o_id integer,
     d_name character varying(10),
     d_street_1 character varying(20),
     d_street_2 character varying(20),
     d_city character varying(20),
     d_state character(2),
     d_zip character(9),
     CONSTRAINT d_warehouse_fkey FOREIGN KEY (d_w_id) REFERENCES bmsql_warehouse(w_id)
 );
ALTER TABLE bmsql_district ADD CONSTRAINT bmsql_district_pkey PRIMARY KEY (d_w_id, d_id);
--3
CREATE TABLE bmsql_customer (
     c_w_id integer NOT NULL,
     c_d_id integer NOT NULL,
     c_id integer NOT NULL,
     c_discount numeric(4,4),
     c_credit character(2),
     c_last character varying(16),
     c_first character varying(16),
     c_credit_lim numeric(12,2),
     c_balance numeric(12,2),
     c_ytd_payment numeric(12,2),
     c_payment_cnt integer,
     c_delivery_cnt integer,
     c_street_1 character varying(20),
     c_street_2 character varying(20),
     c_city character varying(20),
     c_state character(2),
     c_zip character(9),
     c_phone character(16),
     c_since timestamp without time zone,
     c_middle character(2),
     c_data character varying(500),
     CONSTRAINT c_district_fkey FOREIGN KEY (c_w_id, c_d_id) REFERENCES bmsql_district(d_w_id, d_id)
);
ALTER TABLE bmsql_customer ADD CONSTRAINT bmsql_customer_pkey PRIMARY KEY (c_w_id, c_d_id, c_id);
--4
CREATE TABLE bmsql_history (
     hist_id  serial NOT NULL,
     h_c_id integer,
     h_c_d_id integer,
     h_c_w_id integer,
     h_d_id integer,
     h_w_id integer,
     h_date timestamp without time zone,
     h_amount numeric(6,2),
     h_data character varying(24),
     CONSTRAINT h_district_fkey FOREIGN KEY (h_w_id, h_d_id) REFERENCES bmsql_district(d_w_id, d_id),
     CONSTRAINT h_customer_fkey FOREIGN KEY (h_c_w_id, h_c_d_id, h_c_id) REFERENCES bmsql_customer(c_w_id, c_d_id, c_id)
);
ALTER TABLE bmsql_history ADD CONSTRAINT bmsql_history_pkey PRIMARY KEY (hist_id);
--5
CREATE TABLE bmsql_oorder (
     o_w_id integer NOT NULL,
     o_d_id integer NOT NULL,
     o_id integer NOT NULL,
     o_c_id integer,
     o_carrier_id integer,
     o_ol_cnt integer,
     o_all_local integer,
     o_entry_d timestamp without time zone,
     CONSTRAINT o_customer_fkey FOREIGN KEY (o_w_id, o_d_id, o_c_id) REFERENCES bmsql_customer(c_w_id, c_d_id, c_id)
 );
ALTER TABLE bmsql_oorder ADD CONSTRAINT bmsql_oorder_pkey PRIMARY KEY (o_w_id, o_d_id, o_id);
--6
CREATE TABLE bmsql_new_order (
     no_w_id integer NOT NULL,
     no_d_id integer NOT NULL,
     no_o_id integer NOT NULL,
     CONSTRAINT no_order_fkey FOREIGN KEY (no_w_id, no_d_id, no_o_id) REFERENCES bmsql_oorder(o_w_id, o_d_id, o_id)
 );
ALTER TABLE bmsql_new_order ADD CONSTRAINT bmsql_new_order_pkey PRIMARY KEY (no_w_id, no_d_id, no_o_id);
--7
CREATE TABLE bmsql_item (
     i_id integer NOT NULL,
     i_name character varying(24),
     i_price numeric(5,2),
     i_data character varying(50),
     i_im_id integer
);
ALTER TABLE bmsql_item ADD CONSTRAINT bmsql_item_pkey PRIMARY KEY (i_id);
--8
CREATE TABLE bmsql_stock (
     s_w_id integer NOT NULL,
     s_i_id integer NOT NULL,
     s_quantity integer,
     s_ytd integer,
     s_order_cnt integer,
     s_remote_cnt integer,
     s_data character varying(50),
     s_dist_01 character(24),
     s_dist_02 character(24),
     s_dist_03 character(24),
     s_dist_04 character(24),
     s_dist_05 character(24),
     s_dist_06 character(24),
     s_dist_07 character(24),
     s_dist_08 character(24),
     s_dist_09 character(24),
     s_dist_10 character(24),
     CONSTRAINT s_item_fkey FOREIGN KEY (s_i_id) REFERENCES bmsql_item(i_id),
     CONSTRAINT s_warehouse_fkey FOREIGN KEY (s_w_id) REFERENCES bmsql_warehouse(w_id)
);
ALTER TABLE bmsql_stock ADD CONSTRAINT bmsql_stock_pkey PRIMARY KEY (s_w_id, s_i_id);
--9
CREATE TABLE bmsql_order_line (
     ol_w_id integer NOT NULL,
     ol_d_id integer NOT NULL,
     ol_o_id integer NOT NULL,
     ol_number integer NOT NULL,
     ol_i_id integer NOT NULL,
     ol_delivery_d timestamp without time zone,
     ol_amount numeric(6,2),
     ol_supply_w_id integer,
     ol_quantity integer,
     ol_dist_info character(24),
     CONSTRAINT ol_stock_fkey FOREIGN KEY (ol_supply_w_id, ol_i_id) REFERENCES bmsql_stock(s_w_id, s_i_id),
     CONSTRAINT ol_order_fkey FOREIGN KEY (ol_w_id, ol_d_id, ol_o_id) REFERENCES bmsql_oorder(o_w_id, o_d_id, o_id)
);
ALTER TABLE bmsql_order_line ADD CONSTRAINT bmsql_order_line_pkey PRIMARY KEY (ol_w_id, ol_d_id, ol_o_id, ol_number);

使用以下命令查看创建的表
\d

三 上传对应数据文件至/root/tpcc/目录下
1 退出gsql
\q
2 上传对应数据文件至/root/tpcc/目录下
mkdir /root/tpcc/
cd /root/tpcc
wget https://sandbox-expriment-files.obs.cn-north-1.myhuaweicloud.com/gaussdb/tpcc.tar.gz
tar -zxvf tpcc.tar.gz
mv /root/tpcc/home/user/rar/tpcc/bmsql_*  .

3 进入gsql
cd /opt/
source gsql_env.sh
gsql -h 192.168.0.50  -d devdb -p 8000 -U hccdp -W NHY^7ujm -r

4 使用\copy命令导入数据
对于bmsql_customer、bmsql_history、bmsql_stock、bmsql_order_line等数据量大的表，数据导入耗时会长些，需耐心等待。
\copy  bmsql_warehouse from '/root/tpcc/bmsql_warehouse.csv' with ( FORMAT 'csv', DELIMITER  ',',  ENCODING 'utf8');
\copy  bmsql_district from '/root/tpcc/bmsql_district.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_customer from '/root/tpcc/bmsql_customer.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_history from '/root/tpcc/bmsql_history.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_oorder from '/root/tpcc/bmsql_oorder.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_item from '/root/tpcc/bmsql_item.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_new_order from '/root/tpcc/bmsql_new_order.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_stock from '/root/tpcc/bmsql_stock.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');
\copy  bmsql_order_line from '/root/tpcc/bmsql_order_line.csv' with ( FORMAT 'csv', DELIMITER ',',  ENCODING 'utf8');

analyze bmsql_stock;
analyze bmsql_order_line;
analyze bmsql_warehouse;
analyze bmsql_district;
analyze bmsql_customer;
analyze bmsql_history;
analyze bmsql_oorder;
analyze bmsql_new_order;
analyze bmsql_item;
所有命令执行失败，因为上一步的wget *并没有下载任何源文件
使用以下命令查看对应的表是否导入数据，其中bmsql_customer是当中某个表表名

SELECT count(*) FROM bmsql_customer;

四 添加约束以及索引
1 添加唯一约束
CREATE UNIQUE INDEX bmsql_oorder_idx1 ON bmsql_oorder USING btree (o_w_id, o_d_id, o_carrier_id, o_id);
GaussDB和MySQL系统表不同，无法通过以上SQL语句查看表结果，需要求助产品同事

2 添加索引
create index bmsql_customer_idx1 on bmsql_customer (c_w_id, c_d_id, c_last, c_first);
--通过以下命令查询创建的索引
\di bmsql_customer_idx1         --di 查看索引对象
GaussDB和MySQL系统表不同，无法通过以上SQL语句查看表结果，需要求助产品同事

五 SQL查询。
接下来的实验依托TPCC业务逻辑开展，相关SQL语句中的“？”可以替换为前面表中的数据。

1 新建订单
TPCC中，新建订单事务对应的内容为：对于任意一个客户端，从固定的仓库随机选取 5-15 件商品，创建新订单，其中 1%的订单要由假想的用户操作失败而回滚。
此类事务在整个TPCC测试用例中占比 : 45%。
以下是新建订单事务中的语句举例：
以仓库id关联客户表和仓库表，查询客户及仓库相关信息
SELECT c_discount, c_last, c_credit, w_tax FROM bmsql_customer JOIN bmsql_warehouse ON (w_id = c_w_id) WHERE c_w_id = 1 AND c_d_id = 1 AND c_id = 114;
更新地区表
SELECT d_tax, d_next_o_id FROM bmsql_district WHERE d_w_id = 1 AND d_id = 1 FOR UPDATE;
UPDATE bmsql_district SET d_next_o_id = d_next_o_id + 1 WHERE d_w_id = 1 AND d_id = 1;
在新订单表中插入数据（未发货）
INSERT INTO bmsql_oorder (o_id, o_d_id, o_w_id, o_c_id, o_entry_d,o_ol_cnt, o_all_local)VALUES (3001, 1, 1, 114,'2023-02-11 15:00' , 14, 1);
在订单总表中插入数据
INSERT INTO bmsql_new_order (no_o_id, no_d_id, no_w_id)VALUES (3001, 1, 1);
查看商品库存
SELECT s_quantity, s_data,s_dist_01, s_dist_02, s_dist_03, s_dist_04,s_dist_05, s_dist_06, s_dist_07, s_dist_08,s_dist_09, s_dist_10 FROM bmsql_stock WHERE s_w_id = 1 AND s_i_id = 1  FOR UPDATE;
更新商品库存信息
UPDATE bmsql_stock SET s_quantity = 90, s_ytd = s_ytd + 4,s_order_cnt = s_order_cnt + 1,s_remote_cnt = s_remote_cnt + 1 WHERE s_w_id = 1 AND s_i_id = 1;
插入订货线数据
INSERT INTO bmsql_order_line (ol_o_id, ol_d_id, ol_w_id, ol_number,ol_i_id, ol_supply_w_id, ol_quantity,ol_amount, ol_dist_info)VALUES (3001, 1, 1, 16, 1, 1, 4, 0, 'j6vO1P7KCKKdP73IcBHkkkRQ');

2 支付订单
TPCC中，支付订单事务对应的内容为：对于任意一个客户端，从固定的仓库随机选取一个辖区及其内用户，采用随机的金额支付一笔订单，并作相应历史纪录。
此类事务在整个TPCC测试用例中占比 : 43%
以下是支付订单事务中的语句举例：
选择一个仓库:
SELECT w_name, w_street_1, w_street_2, w_city,  w_state, w_zip FROM bmsql_warehouse WHERE w_id = 1;
选择一个辖区
SELECT d_name, d_street_1, d_street_2, d_city, d_state, d_zip FROM bmsql_district WHERE d_w_id = 1 AND d_id = 1;
根据仓库和辖区信息，选择一个客户
SELECT c_id FROM bmsql_customer WHERE c_w_id = 1 AND c_d_id = 1 AND c_last = 'BARBARPRI' ORDER BY c_first;
查看该客户信息
SELECT c_first, c_middle, c_last, c_street_1, c_street_2,c_city, c_state, c_zip, c_phone, c_since, c_credit, c_credit_lim, c_discount, c_balance FROM bmsql_customer WHERE c_w_id = 1 AND c_d_id = 1 AND c_id = 4 FOR UPDATE;
SELECT c_data FROM bmsql_customer WHERE c_w_id = 1 AND c_d_id = 1 AND c_id = 4;
采用随机的金额支付一笔订单，更新客户表、辖区表、仓库表数据
UPDATE bmsql_warehouse SET w_ytd = w_ytd + 3 WHERE w_id = 1;
UPDATE bmsql_district SET d_ytd = d_ytd + 3 WHERE d_w_id = 1 AND d_id = 1;
UPDATE bmsql_customer SET c_balance = c_balance - 50, c_ytd_payment = c_ytd_payment + 50 ,c_payment_cnt = c_payment_cnt + 1 WHERE c_w_id = 1 AND c_d_id = 1 AND c_id = 4;
记录该笔支付至历史表
INSERT INTO bmsql_history (h_id,h_c_id, h_c_d_id, h_c_w_id, h_d_id, h_w_id,h_date, h_amount, h_data)VALUES (300001,4, 1, 1, 1, 1, '2023-02-11', 50, 'succeed');

3 查询订单状态
TPCC中，查询订单状态事务对应的内容为：对于任意一个客户端，从固定的仓库随机选取一个辖区及其内用户，读取其最后一条订单，
显示订单内每件商品的状态，此类事务在整个TPCC测试用例中占比 : 4%。
以下是查询订单状态事务中的语句举例：
选择一个客户
SELECT c_id FROM bmsql_customer WHERE c_w_id = 1 AND c_d_id = 2 AND c_last = 'BAROUGHTPRES' ORDER BY c_first
查看该客户的相关信息
SELECT c_first, c_middle, c_last, c_balance FROM bmsql_customer WHERE c_w_id = 1 AND c_d_id = 2 AND c_id = 15;
查看该客户的最新一条订单信息
SELECT o_id, o_entry_d, o_carrier_id FROM bmsql_oorder WHERE o_w_id = 1 AND o_d_id = 2 AND o_c_id = 15 AND o_id = (SELECT max(o_id) FROM bmsql_oorder WHERE o_w_id = 1 AND o_d_id = 2 AND o_c_id = 15);
查看订货线中该客户的最新订单的商品状态
SELECT ol_i_id, ol_supply_w_id, ol_quantity,ol_amount, ol_delivery_d FROM bmsql_order_line WHERE ol_w_id = 1 AND ol_d_id = 2 AND ol_o_id = 1229 ORDER BY ol_w_id, ol_d_id, ol_o_id, ol_number;

4 发货
TPCC中，发货事务对应的内容为：对于任意一个客户端，随机选取一个发货包，更新被处理订单的用户余额，并把该订单从新订单中删除。此类事务在整个TPCC测试用例中占比 : 4%。
以下是发货事务中的语句举例：
选择一个发货包
SELECT min(no_o_id) FROM bmsql_new_order WHERE no_w_id = 2 AND no_d_id = 2 ;
在新订单中删除该发货包数据
DELETE FROM bmsql_new_order WHERE no_w_id = 2 AND no_d_id = 2 AND no_o_id = 2101;
获取该发货包的客户
SELECT o_c_id FROM bmsql_oorder WHERE o_w_id =2 AND o_d_id = 2 AND o_id = 2101;
更新订单总表中信息
SELECT sum(ol_amount) AS sum_ol_amount FROM bmsql_order_line WHERE ol_w_id = 2 AND ol_d_id = 2 AND ol_o_id = 2101;
计算该发货包的订单金额
SELECT sum(ol_amount) AS sum_ol_amount FROM bmsql_order_line WHERE ol_w_id = 2 AND ol_d_id = 2 AND ol_o_id = 2101;
更新订货线中发货状态
UPDATE bmsql_order_line SET ol_delivery_d = '2023-2-11' WHERE ol_w_id = 2 AND ol_d_id = 2 AND ol_o_id = 2101;
根据订单金额，更新用户余额
UPDATE bmsql_customer SET c_balance = c_balance + 31547.84, c_delivery_cnt = c_delivery_cnt + 1 WHERE c_w_id = 2 AND c_d_id = 2 AND c_id = 2855;

5 查询库存
TPCC中，查询库存事务对应的内容为：对于任意一个客户端，从固定的仓库和辖区随机选取最后 20 条订单，查看订单中所有的货物的库存，计算并显示所有库存低于随机生成域值的商品数量。
此类事务在整个TPCC测试用例中占比 : 4%。
以下是查询库存事务中的语句举例：
选择一个辖区和仓库，并定义一个阈值，按上述要求查看库存

SELECT count(*) AS low_stock FROM (	SELECT s_w_id, s_i_id, s_quantity  FROM bmsql_stock WHERE s_w_id = 1 AND s_quantity < 60 AND s_i_id IN ( SELECT ol_i_id FROM bmsql_district JOIN bmsql_order_line ON ol_w_id = d_w_id AND ol_d_id = d_id AND ol_o_id >= d_next_o_id - 20 AND ol_o_id < d_next_o_id WHERE d_w_id = 1 AND d_id = 1));
