---
title: asm磁盘学习笔记
published: 2024-04-11
description: "cmd下cd到VMware软件路径"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

windows
1.使用vm虚拟机创建共享存储
cmd下cd到VMware软件路径
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\disk\share-11Gdata001.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\disk\share-11Gdata002.vmdk"

2.添加至虚拟机.vmx文件
scsi1:15.mode = "independent-p******"
scsi1:15.deviceType = "disk"
scsi1:15.present = "TRUE"
scsi1:15.fileName = "F:\VM\RACdisk\disk\share-11Gdata001.vmdk"
scsi1:15.redo = ""

scsi1:16.mode = "independent-p******"
scsi1:16.deviceType = "disk"
scsi1:16.present = "TRUE"
scsi1:16.fileName = "F:\VM\RACdisk\disk\share-11Gdata002.vmdk"
scsi1:16.redo = ""

linux
1.fdisk -l | grep dev/sd*检查添加磁盘的情况
因不知名原因发现只添加了一块磁盘,浪费大量时间重做,发现可能是scsi1:nn序号关系,做多写到15

2.检查是否安装multipath软件,配置多路径,已安装不做检查

3.查看新增共享盘的scsi_id
/sbin/scsi_id -g -u /dev/sdp

4.写入multipath,激活多路径
vim /etc/multipath.conf
multipaths {
  multipath {
  wwid "36000c29236e0a5484b831362e0064ed8"
  alias asm_cc
  }

multipath -F

multipath -v2

multipath -ll

5.UDEV绑盘
echo 'KERNEL=="dm-*",ENV{DM_UUID}=="mpath-36000c29236e0a5484b831362e0064ed8",SYMLINK+="asm_ss",OWNER="grid",GROUP="asmadmin",MODE="0660"' >> /etc/udev/rules.d/99-oracle-asmdevices.rules

6.重载udev
udevadm control --reload-rules

udevadm trigger --type=devices

7.检查新加磁盘组情况
ll /dev/asm*
lsblk

8.下列磁盘组随意踢出一个(相同组每次踢出一个都要再执行一次看哪个能删)

SELECT 'ALTER DISKGROUP ' || NAME || ' DROP DISK ' || FAILGROUP || ';' 踢出磁盘,
       'ALTER DISKGROUP ' || NAME || ' rebalance power 5 ;' "设置rebalance power"
  FROM (SELECT t2.name,
               t1.FAILGROUP,
               row_NUMBER() OVER(PARTITION BY t1.group_number ORDER BY t1.free_mb DESC) rn
          FROM v$asm_disk t1
          JOIN v$asm_diskgroup t2
            ON t1.GROUP_NUMBER = t2.GROUP_NUMBER
         WHERE TYPE = 'EXTERN' --外部冗余
           AND t2.total_mb * 0.8 - t2.free_mb < 0 --去掉任意一块磁盘,剩余磁盘绝对成立满足剩余空间大于80%
           AND t1.group_number IN (SELECT group_number
                                     FROM v$asm_disk
                                    GROUP BY group_number
                                   HAVING COUNT(1) >= 2))--排除只有一块盘的组
 WHERE rn = 1

上面的语句得出来的结果是
ALTER DISKGROUP {NAME} DROP DISK {FAILGROUP}
ALTER DISKGROUP {NAME} rebalance power 5 ;

#设置rebalance重定向也可以一起操作;
ALTER DISKGROUP NAME DROP DISK FAILGROUP rebalance power 11;
磁盘组名NAME,FAILGROUP盘名

查看加盘状态,剩余时间
!ASMCMD lsop
Group_Name  Dsk_Num  State  Power  EST_WORK  EST_RATE  EST_TIME

#查看重平衡
select * from V$asm_operation;
 GROUP_NUMBER            磁盘组号
 OPERATION	             重平衡状态,REBAL为正在重平衡
 STATE		             状态,run为运行
 POWER		             并行数
 ACTUAL 	             分配并行数
 SOFAR		             到目前为止已处理数量
 EST_WORK	             需要处理的数量
 EST_RATE	             剩余要处理的数量xxxx
 EST_MINUTES             预计需要时间
 ERROR_CODE	             异常错误,没有就是没错

9.查看删除状态
set lines200 pages 200
col PATH for a30
SELECT GROUP_NUMBER, FAILGROUP, PATH, MOUNT_STATUS, STATE FROM v$asm_disk WHERE state='DROPPING';
alter diskgroup datadg rebalance power 1;

10.删除完成后dd
select GROUP_NUMBER,FAILGROUP,path from v$asm_disk where group_number=0;

dd if=/dev/zero of=/dev/asm_ocr03 bs=1M count=1000
dd if=/dev/zero of=/dev/asm_ocr02 bs=1M count=1000
dd if=/dev/zero of=/dev/asm_data03 bs=1M count=1000
dd if=/dev/zero of=/dev/asm_ss bs=1M count=1000

select 'dd if=/dev/zero of='||path||' bs=1M count=1000' from v$asm_disk where group_number=0;

11.添加磁盘

alter diskgroup DATADB add disk '/dev/asm_data03' rebalance power 1 ;

12.测试创normal磁盘组,对磁盘组加磁盘,failgroup使用已有名
create diskgroup cc normal redundancy failgroup oggdg1_0001 disk '/dev/asm_ocr03' failgroup oggdg2_0002 disk '/dev/asm_data03';

alter diskgroup cc add
failgroup DATADG_001 disk '/dev/asm_ocr02'
failgroup DATADG_002 disk '/dev/asm_ss';

发现没有磁盘组没有文件组oggdg_001,oggdg_002也能使用alter命令,磁盘组,文件组是树形结构重名不会报错

删除磁盘组
alter diskgroup cc dismount;
drop diskgroup cc force including contents;

create diskgroup cc normal redundancy failgroup DATADG_001 disk '/dev/asm_ocr03' failgroup DATADG_002 disk '/dev/asm_data03';

alter diskgroup cc add
failgroup DATADG_001 disk '/dev/asm_ocr02'
failgroup DATADG_002 disk '/dev/asm_ss';

13.尝试将/dev/asm_ss修改磁盘名/dev/asm_si
vim /etc/multipath.conf
/dev/asm_ss修改磁盘名/dev/asm_si
multipath -F

multipath -v2

multipath -ll
发现修改失败,撤退

###########################################命令###########################################
删除磁盘组中的磁盘
ALTER DISKGROUP {NAME} DROP DISK {FAILGROUP} [rebalance power 11]
[rebalance power 11]:重平衡，并行11
[force]：多冗余才能加force

查看重平衡进度策略
select * from V$asm_operation;

删除磁盘组
alter diskgroup cc dismount;
drop diskgroup cc force including contents;

修改磁盘组，重平衡策略
ALTER DISKGROUP {NAME} rebalance power 5 ;

对DATADB磁盘组，添加磁盘/dev/asm_data03
alter diskgroup DATADB add disk '/dev/asm_data03' rebalance power 1 ;

卸载磁盘组
ALTER DISKGROUP data DISMOUNT;

挂载磁盘组
ALTER DISKGROUP data  MOUNT;

挂载所有磁盘组
ALTER DISKGROUP ALL MOUNT;
