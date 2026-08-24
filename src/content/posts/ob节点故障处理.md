---
title: ob节点故障处理
published: 2025-08-07
description: "1.修改故障节点租户的locality分布"
tags: ["OceanBase", "实战笔记"]
category: 数据库
draft: false
---

参考：
https://open.oceanbase.com/blog/22366495280

#######################################################黑屏操作

1.修改故障节点租户的locality分布
SELECT T3.TENANT_ID,T3.TENANT_NAME, T3.LOCALITY
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP = '192.168.1.15' -- 故障IP
  AND T3.tenant_type in ('USER','SYS')
  AND T3.STATUS = 'NORMAL';

+-----------+-------------+---------------------------------------------+
| TENANT_ID | TENANT_NAME | LOCALITY                                    |
+-----------+-------------+---------------------------------------------+
|         1 | sys         | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
|      1002 | o_user      | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
|      1004 | demo      | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
+-----------+-------------+---------------------------------------------+

alter tenant sys locality='FULL{1}@zone1, FULL{1}@zone2';
alter tenant o_user locality='FULL{1}@zone1, FULL{1}@zone2';

#拼接好的sql
SELECT CONCAT(CONCAT(CONCAT(CONCAT('ALTER TENANT ',tenant_name),' locality='''),
               CASE WHEN substr(locality,9,5) = T2.zone
                        THEN REPLACE(locality, CONCAT('FULL{1}@',CONCAT(T2.zone,', ')), '')
                    WHEN locality LIKE '%zone1, FULL{1}@zone2, FULL{1}@zone3%'
                        THEN REPLACE(locality, CONCAT(', FULL{1}@',T2.zone), '')
                    ELSE locality END), ''';') AS alter_sql
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP = '192.168.1.15'  -- 故障IP
  AND T3.tenant_type in ('USER','SYS')
  AND T3.STATUS = 'NORMAL';

#做完这一步，ocp上就看不到租户的故障节点的副本了

2.检查任务进度
SELECT START_TIME, TENANT_ID, JOB_ID, JOB_STATUS, PROGRESS
FROM oceanbase.DBA_OB_TENANT_JOBS
WHERE JOB_TYPE = 'ALTER_TENANT_LOCALITY'
  AND START_TIME >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
 -- AND JOB_STATUS <> 'SUCCESS'

+----------------------------+-----------+--------+------------+----------+
| START_TIME                 | TENANT_ID | JOB_ID | JOB_STATUS | PROGRESS |
+----------------------------+-----------+--------+------------+----------+
| 2025-12-30 09:57:42.067705 |         1 |     15 | SUCCESS    |      100 |
| 2025-12-30 09:57:42.137246 |      1002 |     16 | SUCCESS    |      100 |
| 2025-12-30 09:57:42.199549 |      1004 |     17 | SUCCESS    |      100 |
+----------------------------+-----------+--------+------------+----------+

3.查看资源池，分裂zone_list
SELECT T1.NAME, T1.TENANT_ID, T1.ZONE_LIST
FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
 JOIN OCEANBASE.__ALL_UNIT T2
  ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
WHERE SVR_IP = '192.168.1.15'; -- 故障IP

+--------------------------+-----------+-------------------+
| NAME                     | TENANT_ID | ZONE_LIST         |
+--------------------------+-----------+-------------------+
| pool_o_user_zone3_hnm    |      1002 | zone3             |
| pool_sys_zone3_ukc       |         1 | zone3             |
| demo    |      1004 | zone3             |
| pool_test_z123           |      NULL | zone1;zone2;zone3 |
+--------------------------+-----------+-------------------+

#黑屏创建的RESOURCE以及sys租户,需要对资源进行分裂
ALTER RESOURCE POOL pool_test_z123 SPLIT INTO ('pool_test_z1','pool_test_z2','pool_test_z3') ON ('zone1','zone2','zone3');

#拼接好的sql
SELECT DISTINCT
       CONCAT('ALTER RESOURCE POOL ',NAME,' SPLIT INTO (''',
        REPLACE(REPLACE(ZONE_LIST, 'zone',
		CONCAT(REPLACE(NAME, 'pool_test_', ''),
		'_zone')), ';', ''','''),''') ON (''',
        REPLACE(ZONE_LIST, ';', ''','''),''');') AS alter_sql
 FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
 JOIN OCEANBASE.__ALL_UNIT T2 ON T1.RESOURCE_POOL_ID = T2.RESOURCE_POOL_ID
WHERE ZONE_LIST LIKE '%;%'
  AND T2.SVR_IP = '192.168.1.15' -- 故障IP

4.修改租户资源池
SELECT T1.NAME, T1.TENANT_ID, T1.ZONE_LIST
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP <> '192.168.1.15'; -- 故障IP

+-------------+--------------------------+
| TENANT_NAME | NAME                     |
+-------------+--------------------------+
| o_user      | pool_o_user_zone1_wxt    |
| o_user      | pool_o_user_zone2_dmk    |
| demo      | demo    |
| demo      | demo    |
| sys         | pool_sys_zone1_lrc       |
| sys         | pool_sys_zone2_jzo       |
+-------------+--------------------------+

ALTER TENANT sys resource_pool_list=('pool_sys_zone1_lrc','pool_sys_zone2_jzo');
ALTER TENANT o_user resource_pool_list=('pool_o_user_zone1_wxt','pool_o_user_zone2_dmk');

#拼接好的sql
SELECT CONCAT('ALTER TENANT ',
              T3.TENANT_NAME,
              ' resource_pool_list=(',GROUP_CONCAT(CONCAT('\'', T1.NAME, '\'')
			                      ORDER BY T1.NAME SEPARATOR ','),');') AS alter_sql
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP <> '192.168.1.15' -- 故障IP
GROUP BY T3.TENANT_NAME;

5.删除故障节点上的资源池
DROP RESOURCE POOL IF EXISTS pool_sys_zone3_ukc;
DROP RESOURCE POOL IF EXISTS pool_o_user_zone3_hnm;

#拼接好的sql
SELECT CONCAT(CONCAT('DROP RESOURCE POOL IF EXISTS ',NAME),';')alter_sql
FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
 JOIN OCEANBASE.__ALL_UNIT T2
  ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
WHERE SVR_IP = '192.168.1.15'; -- 故障IP

#不修改租户资源池，这步会报错：
ERROR 4626 (HY000): resource pool 'pool_o_user_zone3_hnm' has already been granted to a tenant

6.删除需要维护的节点

6.1.记录
#黑屏删除observer节点后需要进行手工rm目录删除，这里先记录路径
SELECT SVR_IP,NAME,VALUE
FROM OCEANBASE.GV$OB_PARAMETERS
WHERE NAME = 'data_dir'
  AND SVR_IP='192.168.1.15'
+---------------+-----------------------+----------------------------------------------------------+
| SVR_IP        | NAME                  | VALUE                                                    |
+---------------+-----------------------+----------------------------------------------------------+
| 192.168.1.15 | data_dir              | /软件路径/oceanbase/store/集群名                         |
+---------------+-----------------------+----------------------------------------------------------+

ll /软件路径/oceanbase/store/集群名
total 0
lrwxrwxrwx 1 root root 27 Dec  6 11:38 clog -> /clog路径/集群名/clog
lrwxrwxrwx 1 root root 28 Dec  6 11:38 slog -> /数据盘路径/集群名/slog
lrwxrwxrwx 1 root root 31 Dec  6 11:38 sstable -> /数据盘路径/集群名/sstable

6.2.删除故障节点
ALTER SYSTEM DELETE SERVER '192.168.1.15:2882' ZONE 'zone3';
# 这步建议还是ocp去做，否则后面需要手工删除目录

#如果租户副本locality分布没改，会报错：
ERROR 4734 (HY000): can not migrate out unit '1002', no other available servers on zone 'zone3', delete server not allowed
#如果没删租户的资源池，会报错：
ERROR 1210 (HY000): Invalid argument

6.3.删除目录
rm -rf /clog路径/集群名
rm -rf /数据盘路径/集群名
rm -rf /软件路径/oceanbase

7.验证删除节点
SELECT * FROM OCEANBASE.__ALL_ROOTSERVICE_JOB WHERE JOB_TYPE = 'DELETE_SERVER';
SELECT * FROM OCEANBASE.DBA_OB_SERVERS;
SELECT * FROM OCEANBASE.__ALL_SERVER;

8.OCP添加节点前操作

8.1.OCP检查
点击集群→集群名→拓扑图

#检查集群是否已经删除，涉及的zone是否正常，如果ocp上zone卡死，备用启停方案
ALTER SYSTEM START ZONE zone3;
ALTER SYSTEM STOP ZONE zone3;

#黑屏验证
SELECT * FROM oceanbase.DBA_OB_ZONES;

8.1.2.OCP上删除故障节点
点击集群→集群名→概览→OBServer列表→释放机器

报错：
OceanBase集群xxxxx:1764985486当前状态[OPERATING]不支持此操作

#如果集群状态一直为"运维中",验证删除节点DBA_OB_SERVERS、__ALL_SERVER表确定没有故障机器
#修改ocp的meta租户的ocp库的ob_cluster表的状态
SELECT NAME,STATUS
FROM OCP.OB_CLUSTER;
+-----------------+-----------+
| name            | status    |
+-----------------+-----------+
| OCP集群         | RUNNING   |
| 其他集群        | RUNNING   |
| 故障集群        | OPERATING |
+-----------------+-----------+

#修改集群状态
UPDATE OCP.OB_CLUSTER SET STATUS='RUNNING' WHERE NAME='故障集群';

9.使用OCP部署新节点
点击集群→集群名→拓扑图→添加 OBServer
#验证
SELECT '新节点添加成功'
  FROM OCEANBASE.DBA_OB_SERVERS
 WHERE STATUS='ACTIVE'
GROUP BY STATUS
HAVING MAX(CREATE_TIME)>(SELECT MAX(gmt_create)
                           FROM OCEANBASE.__ALL_ROOTSERVICE_JOB T1
                          WHERE JOB_TYPE = 'DELETE_SERVER'
                            AND progress=100
                            AND job_status='SUCCESS');

10.查询需要补副本的租户
#需要补副本的租户
SELECT DISTINCT unit_tenant_name
FROM (SELECT SUBSTRING(REPLACE(T1.NAME, 'pool_', ''), 1, LOCATE('_zone', REPLACE(T1.NAME, 'pool_', '')) - 1)unit_tenant_name,
             T1.TENANT_ID, T1.ZONE_LIST
        FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
        JOIN OCEANBASE.__ALL_UNIT T2
         ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
       WHERE TENANT_ID IS NOT NULL
       GROUP BY T1.TENANT_ID, T1.ZONE_LIST
      HAVING MOD(COUNT(*),2)<= (SELECT MOD(COUNT(*),2) FROM OCEANBASE.DBA_OB_SERVERS));

+------------------+
| unit_tenant_name |
+------------------+
| o_user           |
| demo           |
| sys              |
+------------------+

11.创建RESOURCE_POOL
#unit使用之前ocp创建的unit，不需要额外创建unit
create resource pool pool_o_user_zone3_hnm unit=config_o_user_zone3_S1C_8G_hnm,unit_num=1,zone_list=('zone3');
create resource pool pool_sys_zone3_ukc unit=config_sys_zone3_S1C_8G_ukc,unit_num=1,zone_list=('zone3');
create resource pool demo unit=demo,unit_num=1,zone_list=('zone3');

#拼接好的sql
SELECT CONCAT('create resource pool ',
       REPLACE(CONCAT(SUBSTRING_INDEX(T2.NAME, '_zone', 1),'_zone',
	                  SUBSTRING_INDEX(SUBSTRING_INDEX(T2.NAME, '_zone', -1), '_', 1),'_',
	                  SUBSTRING_INDEX(T2.NAME, '_', -1) ),'config_', 'pool_'),
	   ' unit=',T2.NAME,',unit_num=1,zone_list=(''',REGEXP_SUBSTR(T2.NAME, 'zone[0-9]+'),''');')alter_sql
 FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
RIGHT JOIN OCEANBASE.DBA_OB_UNIT_CONFIGS T2
  ON SUBSTRING(REPLACE(T1.NAME, 'pool_', ''), 1, LOCATE('_zone', REPLACE(T1.NAME, 'pool_', '')) - 1)
   = SUBSTRING(REPLACE(T2.NAME, 'config_', ''), 1, LOCATE('_zone', REPLACE(T2.NAME, 'config_', '')) - 1)
  AND T2.NAME LIKE CONCAT('%', T1.ZONE_LIST, '%')
WHERE LENGTH(SUBSTRING(REPLACE(T2.NAME, 'config_', ''), 1, LOCATE('_zone', REPLACE(T2.NAME, 'config_', '')) - 1))>=1
  AND T1.NAME IS NULL;

12.修改租户资源池
ALTER TENANT demo resource_pool_list=('demo','demo','demo');
ALTER TENANT sys resource_pool_list=('pool_sys_zone1_lrc','pool_sys_zone2_jzo','pool_sys_zone3_ukc');
ALTER TENANT o_user resource_pool_list=('pool_o_user_zone1_wxt','pool_o_user_zone2_dmk','pool_o_user_zone3_hnm');

#拼接好的sql
SELECT CONCAT('ALTER TENANT ',
               SUBSTRING(REPLACE(T1.NAME, 'pool_', ''), 1, LOCATE('_zone', REPLACE(T1.NAME, 'pool_', '')) - 1),
              ' resource_pool_list=(''',GROUP_CONCAT(NAME ORDER BY T1.ZONE_LIST SEPARATOR ''','''),''');') AS alter_sql
FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
 JOIN OCEANBASE.__ALL_UNIT T2
  ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
WHERE LENGTH(SUBSTRING(REPLACE(T1.NAME, 'pool_', ''), 1, LOCATE('_zone', REPLACE(T1.NAME, 'pool_', '')) - 1))>=1
GROUP BY SUBSTRING(REPLACE(T1.NAME, 'pool_', ''), 1, LOCATE('_zone', REPLACE(T1.NAME, 'pool_', '')) - 1);

13.修改租户的locality分布
SELECT T3.TENANT_ID,T3.TENANT_NAME, T3.LOCALITY,T1.ZONE_LIST
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP = '192.168.1.15' -- 故障IP
  AND T3.tenant_type in ('USER','SYS')
  AND T3.STATUS = 'NORMAL';

+-----------+-------------+---------------------------------------------+
| TENANT_ID | TENANT_NAME | LOCALITY                                    |
+-----------+-------------+---------------------------------------------+
|         1 | sys         | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
|      1002 | o_user      | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
|      1004 | demo      | FULL{1}@zone1, FULL{1}@zone2, FULL{1}@zone3 |
+-----------+-------------+---------------------------------------------+

alter tenant sys locality='FULL{1}@zone1, FULL{1}@zone2';
alter tenant o_user locality='FULL{1}@zone1, FULL{1}@zone2';

#拼接好的sql
SELECT CONCAT(CONCAT('alter tenant ',T3.TENANT_NAME,' locality='''),
               CONCAT(T3.LOCALITY,', FULL{1}@',T1.ZONE_LIST),''';') alter_sql
  FROM OCEANBASE.DBA_OB_RESOURCE_POOLS T1
  JOIN OCEANBASE.__ALL_UNIT T2
    ON T1.RESOURCE_POOL_ID=T2.RESOURCE_POOL_ID
  JOIN OCEANBASE.DBA_OB_TENANTS T3
    ON T1.TENANT_ID=T3.TENANT_ID
WHERE T2.SVR_IP = '192.168.1.15' -- 故障IP
  AND T3.tenant_type in ('USER','SYS')
  AND T3.STATUS = 'NORMAL';

14.检查任务进度
SELECT START_TIME, TENANT_ID, JOB_ID, JOB_STATUS, PROGRESS
FROM oceanbase.DBA_OB_TENANT_JOBS
WHERE JOB_TYPE = 'ALTER_TENANT_LOCALITY'
  AND START_TIME >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
 -- AND JOB_STATUS <> 'SUCCESS'

+----------------------------+-----------+--------+------------+----------+
| START_TIME                 | TENANT_ID | JOB_ID | JOB_STATUS | PROGRESS |
+----------------------------+-----------+--------+------------+----------+
| 2025-12-31 12:16:42.018482 |      1002 |     26 | SUCCESS    |      100 |
| 2025-12-31 12:16:42.101309 |         1 |     27 | SUCCESS    |      100 |
| 2025-12-31 12:16:42.179878 |      1004 |     28 | SUCCESS    |      100 |
+----------------------------+-----------+--------+------------+----------+
