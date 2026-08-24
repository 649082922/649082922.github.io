---
title: g参数优化
published: 2025-02-12
description: "AMM (Automatic Memory Management)自动内存管理；(11G才有的特性）"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

所有参数查看方法:
https://blog.csdn.net/tianlesoftware/article/details/5583655

amm使用
https://www.modb.pro/db/612130
https://www.modb.pro/db/397229

AMM (Automatic Memory Management)自动内存管理；(11G才有的特性）
ASMM(Automatic shared Memory Management）自动共享内存管理；（10G有的特性）
AMM不支持HugePage，而ASMM支持HugePage；
AMM让数据库完全管理SGA、PGA的大小；
ASMM只能管理SGA的大小。

启用AMM：
将 MEMORY_TARGET 设为非0值，则启用。会自动调整SGA、PGA。
注：如果手动也设置了SGA、PGA，则表示自动调整时不小于手动设定的值。

启用ASMM:
将MEMORY_TARGET设为0，SGA_TARGET设为非0，STATISTICS_LEVEL参数设置为TYPICAL（默认值）或者ALL才能启用ASMM功能。

A、内存都是以页的形式划分的，默认情况下每页是4K，如果物理内存很大，则映射表的条目将会非常多，会影响CPU查询映射表效率;
B、系统中使用了大页（huge page），则内存页的数量会减少，映射表的条目少，会提升CPU的查询映射表的效率
###当SGA大于32G时，可以启用大页，以便减少Oracle SGA的页交换次数;

有关大页  use_large_pages参数
TRUE表示如果系统配置好了HugePage，则会使用，如果没有，SGA也可以使用通常页大小的内存，也就是说SGA可以运行在混合模式下。
FALSE表示，实例不会使用HugePage。
ONLY表示只使用Huge。
https://blog.csdn.net/qq_24353335/article/details/76255058
http://blog.itpub.net/17203031/viewspace-775004/

ALTER SYSTEM SET SHARED_POOL_SIZE = 0;
ALTER SYSTEM SET LARGE_POOL_SIZE = 0;
ALTER SYSTEM SET JAVA_POOL_SIZE = 0;
ALTER SYSTEM SET STREAMS_POOL_SIZE = 0;
ALTER SYSTEM SET DB_CACHE_SIZE = 0;

--SGA调整
alter system set memory_target=0 scope=spfile;
alter system set sga_max_size=12G scope=spfile;
alter system set sga_target=12G scope=spfile;
alter system set pga_aggregate_target=8G scope=spfile;
alter system set processes=1000 scope=spfile;

--512G
--oracle_instance
alter system set memory_target=0 scope=spfile ;
alter system set pga_aggregate_target=45G scope=spfile;
alter system set sga_max_size=252G scope=spfile;
alter system set sga_target=252G scope=spfile;
alter system set processes=3000 scope=spfile;
--查看物理内存
--禁用自适应游标共享，关闭11g新特性adaptive cursor sharing，避免Oracle根据绑定变量的值改变执行计划，从而造成性能的波动
alter system set "_optimizer_extended_cursor_sharing"='NONE';
--关闭直接路径读
alter system set "_serial_direct_read"=never;
--关闭自适应log file sync
alter system set "_use_adaptive_log_file_sync"=false;
--禁用自适应游标共享，避免出现cursor sharing导致的子游标过多的问题
alter system set "_optimizer_adaptive_cursor_sharing"=FALSE;
alter system set "_optimizer_extended_cursor_sharing_rel"='NONE';
--关闭优化器反馈（Feedback），避免根据返回结果确定cardinality，该功能在11g中不稳定易导致性能问题。
alter system set "_optimizer_use_feedback"=FALSE;
--关闭错误输入密码时的密码延迟验证特性，避免用户持续输入错误密码时产生大量的library cache lock等待，严重时使数据库完全不能登录
alter system set event='28401 trace name context forever,level 1','10949 trace name context forever,level 1' scope=spfile;
--关闭RAC的DRM（dynamic remastering）特性，避免频繁的DRM使系统性能不稳定、严重的时候使数据库挂起。同时也关闭Read-mostly Locking新特性，这个特性目前会触发大量的BUG，严重时使数据库实例宕掉
alter system set "_gc_policy_time"=0 scope=spfile;
alter system set "_gc_undo_affinity"=FALSE scope=spfile;
--建议关闭回滚段（Undo）的自动优化功能，避免出现UNDO表空间利用率过高或者UNDO段争用的问题。
alter system set "_undo_autotune"=FALSE;
--关闭优化器对反连接（Anti-Join）中的空值(Null)探测，避免相关的BUG。
alter system set "_optimizer_null_aware_antijoin"=FALSE;
--11g中引入的行级逻辑读优化功能会破坏READ COMMIT隔离制度的读一致性问题，建议金融相关客户关闭此功能
alter system set "_row_cr"=FALSE;
--在11G版本中，建议关闭延迟段创建的特性。
alter system set deferred_segment_creation=false sid='*' scope=spfile;
--在11G版本中，建议关闭优化器对反连接（Anti-Join）中的空值(Null)探测，避免相关的BUG。
alter system set "_optimizer_null_aware_antijoin"=FALSE;
--在11G版本中，建议关闭回滚段（Undo）的自动优化。
alter system set "_undo_autotune"=FALSE;
--在11G版本中，为了降低集群间的数据交互，建议并行进程强制在本地实例分配。
alter system set parallel_force_local=TRUE;
--在11G版本中，建议启用大池（Large Pool）分配并行进程内存，减少对共享池（Shared Pool）的争用。
alter system set "_PX_use_large_pool"=TRUE scope=spfile;
--在11G版本中，若无特殊的安全需求，建议关闭密码大小写敏感策略。
alter system set sec_case_sensitive_logon=FALSE;
--在11G版本中，建议关闭分区使用大的初始化区（Extent）。
alter system set "_partition_large_extents"=FALSE;
--在11G版本中，建议关闭审计选项。
alter system set audit_trail='none' scope=spfile;
--修改11g Default Profile中的默认选项
alter profile "DEFAULT" limit PASSWORD_GRACE_TIME UNLIMITED;
alter profile "DEFAULT" limit PASSWORD_LIFE_TIME UNLIMITED;
alter profile "DEFAULT" limit PASSWORD_LOCK_TIME UNLIMITED;
alter profile "DEFAULT" limit FAILED_LOGIN_ATTEMPTS UNLIMITED;
--禁用sql tuning advisor

BEGIN
  DBMS_AUTO_TASK_ADMIN.disable(
    client_name => 'sql tuning advisor',
    operation   => NULL,
    window_name => NULL);
END;
/
commit;

--禁用auto space advisor

BEGIN
  DBMS_AUTO_TASK_ADMIN.disable(
    client_name => 'auto space advisor',
    operation   => NULL,
    window_name => NULL);
END;
/
commit;

select client_name,status from dba_autotask_client;
