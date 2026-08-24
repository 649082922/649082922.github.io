---
title: redo被删
published: 2025-02-21
description: "scn推进方法:https://blog.csdn.net/u014596132/article/details/135824919"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

scn推进方法:https://blog.csdn.net/u014596132/article/details/135824919

查看文件scn确定数据库一致性
select checkpoint_change# from v$database;               --控制文件检查点SCN号
select file#,checkpoint_change# from v$datafile_header; --数据文件检查点SCN号

####################################redo被删####################################

场景1：redo被删,数据库mount到open报错,shutdown immediate一致性关闭数据库
ORA-03113:end-of-file on communication channel
Process ID:52978
Session ID:lSerial number:5

重建控制文件即可，仅支持一致性关闭数据库
--alter database backup controlfile to '/home/oracle/control12.trc';  --备份一下以防万一
alter database backup controlfile to trace as '/home/oracle/control12.sql';

场景2：redo被删,数据库mount到open报错，shutdown abort非一致性关闭数据库
ORA-00313: open failed for members of log group 3 of thread 1
ORA-00312: online log 3 thread 1:"/oradata/orcl/redo03.log
ORA-27037: lunable to obtain file status

1.修改参数
alter system set "_allow_resetlogs_corruption"=TRUE scope=spfile;
show parameter _allow_resetlogs_corruption
--alter system set "_allow_resetlogs_corruption"=false scope=spfile;

2.使用event参数推进scn（19c）
alter system set event="21307096 trace name context forever,level 3" scope=spfile;
show parameter event
--alter system set event='' scope=spfile;

#21307096为特殊事件编号，专门用于推进SCN

#重启生效（控制文件里需要删除被删的redo的内容）
shutdown immediate
startup mount

######11g使用debug方式推scn,19c是event
判断大小端：https://mp.weixin.qq.com/s?__biz=MzI3MzE5Mjg1Mg==&mid=2247484299&idx=1&sn=ad52dcecd634aa68c7d5e4c8cd6d6bfd&chksm=ea81ec73423c501b2f8c291ba5e01cadc112843943b4b966fc99bafe9d1dc344472c1cca86ff#rd
命令参数介绍：https://mp.weixin.qq.com/s?__biz=MzYzNDE5MzE4Nw==&mid=2247483667&idx=1&sn=c3680c238f94325f2a1eba1d642fe2a3&chksm=f1dc4ef3d731cfdf68ae2c869c07efcc824cfa54409832b6a575d56106bb0adc28aa43347ac6#rd
推进scn方法：https://blog.csdn.net/u014596132/article/details/135824919
3.判断大小端
echo -n I | od -o | head -n1 | cut -f2 -d" " | cut -c6
echo -n I | od -o | head -n1 | awk '{print $2}'| cut -c6
输出：1为小端模式，0为大端模式
内存存储顺序​
HP-UX (大端模式/Big Endian)：       SCN_WRAP（高位）在前，SCN_BASE（低位）在后
Linux x86 (小端模式/Little Endian)：SCN_BASE（低位）在前，SCN_WRAP（高位）在后

ora-600 [2662]参数说明：
ORA-00600: internal error code, arguments: [2662], [a], [b], [c], [d], [e], [], []
a–CRUUENT SCN WRAP
b–CURRENT SCN BASE
c–DEPENDENT SCN WRAP
d–DEPENDENT SCN BASE
e–where present this is the dba where the dependent scn came from.

Linux端（推8位）：
ORA-00600: internal error code, arguments: [2662], [0], [13413310], [0], [13413467], [29360288], [], [], [], [], [], []
操作如下:
```
SQL> oradebug setmypid
```
Statement processed.

```
SQL> oradebug dumpvar sga kcsgscn_
```
kcslf kcsgscn_ [06001AE70, 06001AEA0) = 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 6001AB50 00000000

```
SQL> select 2*power(2,32)+13413467 from dual;
```
2*POWER(2,32)+13413467
----------------------
	    8603348059

```
SQL> oradebug poke 0x06001AE70 8 8603348059
```
BEFORE: [06001AE70, 06001AE78) = 00000000 00000000
AFTER:	[06001AE70, 06001AE78) = 00CCAC5B 00000002

#oradebug poke 内存地址、修改长度和要写入的值
内存地址：oradebug dumpvar sga kcsgscn_查出
修改长度：LINUX是 8 字节
要写入的值：ORA-00600报错的 2*power(2,32)+SCN BASE

#再检查一遍（无所谓了）
```
SQL> oradebug dumpvar sga kcsgscn_
```
kcslf kcsgscn_ [06001AE70, 06001AEA0) = 00CCAC5B 00000002 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 6001AB50 00000000

UNIX端（推4位）：
ORA-00600: internal error code, arguments: [2662], [4045], [1528369959],[4045], [1528646410], [4194545], [], [], [], [], [], []
操作如下:
```
SQL> oradebug setmypid
```
Statement processed.

```
SQL> oradebug DUMPvar SGA kcsgscn_
```
kcslf kcsgscn_ [C00000006FDF9670, C00000006FDF96A0) = 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 C0000000 ...

```
SQL> SELECT TO_CHAR(4045+1, '0XXXXXXX') FROM DUAL; --一般就8位，X占位，0填充
```
TO_CHAR(4
---------
 00000FCE

```
SQL> oradebug poke 0xC00000006FDF9670 4 0x00000fce
```
BEFORE: [C00000006FDF9670, C00000006FDF9674) = 00000000
AFTER:  [C00000006FDF9670, C00000006FDF9674) = 00000FCE

如果不知道当前scn直接写 0x00000001
```
SQL> oradebug poke 0xC00000006FDF9670 4 0x00000001
```
BEFORE: [C00000006FDF9670, C00000006FDF9674) = 00000000
AFTER:  [C00000006FDF9670, C00000006FDF9674) = 00000001

4.尝试open，或执行recover,选择cancel
alter database open;

recover database until cancel;
cancel

5.打开数据库
alter database open;
alter database open resetlogs;

6.拉起来
sqlplus / as sysdba
startup

7.恢复后可能有坏块,尽快数据泵导出新库

####################################recover还原报错####################################

1.SQL> alter database open;
ORA-01194: file 1 needs more recovery to be consistent
ORA-01110: data file 1: '/u01/app/oracle/oradata/ogg/system01.dbf'
或者

ERROR at line 1:
ORA-01172: recovery of thread 1 stuck at block 72804 of file 59
ORA-01151: use media recovery to recover block, restore backup if needed

需要恢复数据库使控制文件和数据文件scn追平
recover database;                                   --直到数据库恢复到最新状态
recover database until cancel;                      --直到你手动输入 CANCEL
recover database until time '2025-01-01 10:00:00';  --直到它恢复到这个时间点,或者CANCEL

2.SQL> RECOVER DATABASE;
ORA-00283: recovery session canceled due to errors
ORA-01610: recovery using the BACKUP CONTROLFILE option must be done

控制文件的scn小于数据文件，需要使用备份集控制文件恢复(用于控制文件被重建过)
set lines 200 pages 200
set num 50
select checkpoint_change# from v$database;
select file#,checkpoint_change# from v$datafile_header;

recover database using backup controlfile;
recover database using backup controlfile until cancel;
recover database using backup controlfile until time '2025-01-01 10:00:00';

Specify log: {<RET>=suggested | filename | AUTO | CANCEL}
suggested  按回车键（即选择默认选项）将使用 Oracle 推荐的下一个日志文件。
filename   手动输入一个具体的日志文件名（如 log_file.arc）
AUTO       自动选择下一个需要应用的日志文件并继续恢复过程,与suggested相似
CANCEL     将终止当前的恢复操作

3.SQL>recover database using backup controlfile;
ORA-00289:suggestion :/home/oracle/orcl_arch/118_1027712840.dbf
ORA-00280:change 1272135 for thread lis in sequence #18

找不到#18号归档日志，日志可能还在redo log中没有被归档，recover时，输入filename路径
recover database using backup controlfile;
/oradata/orcl/redo01.log

ORA-00310:archived log contains sequence 16;sequence 18 required
ORA-00334:archived log:'/oradata/orcl/redo01.log'
#报错，则说明redo01.log是16号归档文件，需要使用18-16=2，redo01.log切2次后的redo日志文件

####################################句柄恢复####################################
1.寻找句柄
#数据文件句柄
ps -ef |grep dbw0 |grep -v grep

#日志文件句柄
ps -ef |grep lgwr |grep -v grep

2.进到pid的fd目录
cd /proc/$PID/fd

3.通过符号链接恢复文件(deleted文件)
cp 4 /xxx/xxx/xxx

####################################其他redo异常场景####################################
###black块只是涉及活动事物才需要改 只是块清除的话 推scn即可

场景一：alert报错
Incomplete read from log member '/ora_data/batch/redo05.log'. Trying next member.
Aborting crash recovery due to error 333
Errors in file /oracle/diag/rdbms/batch/batch/trace/batch_ora_18337.trc:
ORA-00333: redo log read error block 425008 count 8063

1.mount状态recover
recover database until cancel;
cancel
alter database open resetlogs; --失败后准备强开

2.open打开
alter system set "_allow_resetlogs_corruption"=TRUE scope=spfile;
shutdown immediate
startup

3.发现报错
ORA-00600: internal error code, arguments: [2662]

4.重推完scn直接open，不需要resetlogs
alter database open;

场景二：open报错
ORA-00742: Log read detects lost write in thread 1 sequence 1009881 block 195724
ORA-00312: online log 3 thread 1: '/ora_data/idcssrv0101/redo03.log'

1.mount状态recover
recover database until cancel;
cancel
alter database open resetlogs; --失败后准备强开

2.open打开
alter system set "_allow_resetlogs_corruption"=TRUE scope=spfile;
shutdown immediate
startup

3.发现报错
ORA-01092: ORACLE instance terminated. Disconnection forced
ORA-00704: bootstrap process failure
ORA-00704: bootstrap process failure
ORA-00604: error occurred at recursive SQL level 1
ORA-01555: snapshot too old: rollback segment number 9 with name "_SYSSMU9_3739287458$" too small
Process ID: 32560
Session ID: 387 Serial number: 31586

4.重推完scn直接open，发现12.1.0.2不支持oradebug
http://www.minniebaby.tech/2021/10/28/%e6%a1%88%e4%be%8b%ef%bc%9aoracle-12-1%e7%9a%84%e6%95%b0%e6%8d%ae%e5%ba%93%e5%a6%82%e4%bd%95%e6%8e%a8%e8%bf%9bscn/
```
SQL> oradebug setmypid
```
Statement processed.

```
SQL> oradebug dumpvar sga kcsgscn_
```
kcslf kcsgscn_ [06001FBB0, 06001FBE0) = 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 6001F6B0 00000000

```
SQL> oradebug poke 0x06001FBB0 8 0x00000001
```
ORA-32521: error parsing ORADEBUG command:

5.找额外一台机器B
sqlplus / as sysdba
oradebug setmypid

ps -ef|grep -i local=yes

6.使用gdb
gdb $ORACLE_HOME/bin/oracle 10210
(gdb) set *((int *) 0x06001FBB0) = 0xffffffff  --推 base
(gdb) set *((int *) 0x06001FBB4) = 0x000a      --推 wrap（base+4）
(gdb) q

Quit anyway? (y or n) y

7.机器B验证重推结果
```
SQL> oradebug DUMPvar SGA kcsgscn_
```
kcslf kcsgscn_ [06001FBB0, 06001FBE0) = FFFFFFFF 0000000A 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 6001F6B0 00000000

8.起库
alter database open;

剩下undo段报错：修undo的方法解决
ORA-00600: internal error code, arguments: [4194], [5], [8], [], [], [], [],[], [], [], [], []
