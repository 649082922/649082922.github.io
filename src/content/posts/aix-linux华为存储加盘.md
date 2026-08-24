---
title: aix&linux华为存储加盘
published: 2024-04-25
description: "​​字段​​	​​            解释​​"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

​​字段​​	​​            解释​​
​​State​​	            磁盘组挂载状态（MOUNTED 表示已挂载，UNMOUNTED 表示未挂载）
​​Type​​	            冗余级别：<br> - EXTERNAL（依赖外部存储冗余）<br> - NORMAL（双副本镜像）<br> - HIGH（三副本镜像）
​​Rebal​​	            是否正在重平衡（Y/N）
​​Sector​​	            物理磁盘扇区大小（单位：字节）
​​Logical_Sector​​	    逻辑扇区大小（单位：字节）
​​Block​​	            ASM 元数据块大小（单位：字节）
​​AU​​	                分配单元大小（单位：字节）
​​Total_MB​​	        磁盘组总容量（单位：MB）
​​Free_MB​​	        ​​    当前物理空闲空间​​（单位：MB）
​​Req_mir_free_MB​​	    因冗余策略需预留的保护空间（单位：MB）
​​Usable_file_MB​​	​​    考虑冗余后实际可用空间​​（单位：MB）
​​Offline_disks​​	    离线磁盘数量
​​Voting_files​​	    是否包含集群投票文件（Y/N）
​​Name​​	            磁盘组名称
#######################################################aix加盘#######################################################

#查看磁盘情况（两个节点）
lspv -u

#扫盘（两个节点）
cfgmgr

#比对两个节点磁盘是否一致（两个节点）
lspv -u

#针对新加的盘，检查同一个uuid对应的磁盘名称是否一致，如果不一致使用rendev调整磁盘号（禁用修改系统盘/正在使用中的asm磁盘）
rendev -l hdiskxx -n hdiskxx

#检查各系统盘（系统盘），有没有被配置到另一个节点（如果另一个节点可见，是错误的，有加错盘的风险）

#修改磁盘权限、参数（两个节点）
chmod 660 /dev/rhdisk6
chown grid:asmadmin /dev/rhdisk6
chdev  -a reserve_policy=no_reserve -l hdisk6

#查看磁盘大小(aix系统,不要带r把后面文件名写齐)
bootinfo -s hdiskxx
查看磁盘大小(link)
lsblk

#磁盘组磁盘大小和header状态
kfod disks=all st=t

#查看磁盘分区
lspv

#检查共享磁盘两边节点是否同时可见，添加到磁盘组
su - grid
export ORACLE_SID=+ASM1
sqlplus / as sysasm

set linesize 300
col path for a30
select GROUP_NUMBER,FAILGROUP,PATH,MOUNT_STATUS,state,TOTAL_MB,create_data from v$asm_disk order by 1,2,3;
select GROUP_NUMBER,FAILGROUP,count(1) from v$asm_disk group by GROUP_NUMBER,FAILGROUP;
select NAME,TOTAL_MB/1024,FREE_MB/1024 from v$asm_diskgroup order by 1,2,3;
select NAME,TOTAL_MB/1024,FREE_MB/1024 from v$asm_disk order by 1,2,3;

#加盘
alter diskgroup datadg add disk '/dev/rhdisk6' rebalance power 1 ;

报错:
ERROR at line 1:
ORA-15032: not all alterations performed
ORA-15260: permission denied on ASM disk group

sqlplus / as sysdba 没得权限操作asm

#######################################################linux加盘#######################################################

linux加盘
1.查看集群节点及个数
su - grid -c "olsnodes -n"

2.查看现有磁盘及数量(华为存储)
upadmin show vlun

3.刷盘
upRescan

4.查看刷盘后现有磁盘及数量(华为存储)
upadmin show vlun

5.执行脚本,打印需要执行的命令
sh /tmp/asm_admin.sh -option add -diskgrep YZ_76_45DG(磁盘名) -type datadg -dgtype DATADG

生成唯一标识：
/usr/lib/udev/scsi_id --whitelisted --replace-whitespace --device=/dev/sdb

6.编辑oracle磁盘映射文件
vim /etc/udev/rules.d/99-oracle-asmdevices.rules

7.检查现有映射磁盘映射情况
ls -l /dev/asm-datadg*

8.重新映射asm磁盘
udevadm control --reload-rules
/sbin/udevadm trigger
ll /dev/asm*

9.进到数据库
su - oracle
export ORACLE_SID=+ASM1
sqlplus / as sysdba

10.添加磁盘
alter diskgroup DATADG add failgroup DATADG_001 disk '/dev/asm-datadg1-10','/dev/asm-datadg1-11' failgroup DATADG_002 disk '/dev/asm-datadg2-10','/dev/asm-datadg2-11' rebalance power 1;

ORA-15041 While Adding Disk With Same Sized Disks in ASM Diskgroup (Doc ID 1551316.1)

每个ASM磁盘至少要有50M,Then validate if all disk have atleast 50M free space is there or not.

11.查看重新平衡磁盘进度
!asmcmd lsop

12.根据进度调整并行
alter diskgroup datadg rebalance power 30;

13.查看加盘情况
set linesize 300
col path for a30
select GROUP_NUMBER,FAILGROUP,PATH,MOUNT_STATUS,state,TOTAL_MB,create_datas from v$asm_disk order by 1,2,3;
select GROUP_NUMBER,FAILGROUP,count(1) from v$asm_disk group by GROUP_NUMBER,FAILGROUP;
select NAME,TOTAL_MB/1024,FREE_MB/1024 from v$asm_diskgroup order by 1,2,3;
select NAME,TOTAL_MB/1024,FREE_MB/1024 from v$asm_disk order by 1,2,3;
