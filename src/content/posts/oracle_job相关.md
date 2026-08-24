---
title: oracle_job相关
published: 2025-01-06
description: "DBMS_SCHEDULER.CREATE_JOB ("
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

BEGIN
  DBMS_SCHEDULER.CREATE_JOB (
    job_name             => 'job_name',
    job_type             => 'job_type',
    job_action           => 'job_action',
    start_date           => 'start_date',
    repeat_interval      => 'repeat_interval',
    end_date             => 'end_date',
    enabled              => TRUE | FALSE,
    comments             => 'comments'
  );
END;

1. 首先确定要停止的JOB号
在10g中可通过Dba_Jobs_Running进行确认。

查找正在运行的JOB:
select sid from dba_jobs_running;

查找到正在运行的JOB的spid:
select a.spid
from v$process a ,v$session b
where a.addr=b.paddr and b.sid in (select sid from dba_jobs_running);

查看所有job
select
from dba_jobs

2. Broken你确认的JOB
注意使用DBMS_JOB包来标识你的JOB为BROKEN。

```
SQL> EXEC DBMS_JOB.BROKEN(job#,TRUE);
```

注意：当执行完该命令你选择的这个JOB还是在运行着的。

回到顶部

3. Kill 对应的Oracle Session
应为BROKEN后该JOB还在运行，如果要求该JOB立刻停止，就需要找到该job的对应SESSION(SID,SERIAL#)，然后执行以下命令：

ALTER SYSTEM KILL SESSION 'sid,serial#';

或者直接KILL对应的操作系统的SESSION，如果使用ALTER SYSTEM KILL SESSION执行很长时间，其实可以使用OS的命令来快速KILL掉SESSION.

For Windows, at the DOS Prompt: orakill sid spid

For UNIX at the command line> kill –9 spid

注意：ALTER SYSTEM KILL SESSION 'sid,serial#'; 有时候是关闭不掉了，杀掉只有又会自动执行，因此建议直接啥系统线程

回到顶部
4. 检查你的JOB是否还在运行
检查你要停止的JOB是否还在运行，其实多数情况下，应该都已经停止了。尤其执行的第三步的“杀手”命令。如果真的还是没有停止，只好从第一道第三步重新做一下了。

回到顶部

5. 将Job Queue Processes的数目修改为0
首先确认当前的Job Queue Processes的数目

```
SQL> col value for a10
```

```
SQL> select name,value from v$parameter where name ='job_queue_processes';
```

然后将Job Queue Processes的数目修改为0

```
SQL> ALTER SYSTEM SET job_queue_processes = 0;
```

保证所有的JOB都会停止。

回到顶部

6. 修改你要修改的任何东西，甚至是JOB内的内容。
回到顶部

7. 修改完成后，将job的BROKEN状态停止。
```
SQL>EXEC DBMS_JOB.BROKEN(job#,FALSE):
```

回到顶部

8. 恢复job_queue_processes的原始值
ALTER SYSTEM SET job_queue_processes = original_value;

至此整个停止并修改JOB完成.

但是需要另外注意一下的是，在MARK一个BROKEN状态的时候，因为JOB内部执行SQL的原因，所以执行时或许要“煎熬”一段时间。所以在建立JOB时一定要仔细考虑，同时如果可能可以在你设计的PL/SQL代码中，增加一些判断“停止信号”的部分。来避免费力执行上面的步骤。

毕竟，ORACLE在执行JOB时，还是很“倔强”的 -:)

4 附件：ORAKILL用法
很多时候遇到某个session一直处于active，使得CPU一直处于搞使用状态，虽然kill 了，但是却不能够使得使得线程结束。 kill session只是kill这个进程，但是线程一直处于活动状态。需要真正的kill线程才能够解决cpu使用率高的问题。
