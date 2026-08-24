---
title: ADRCI操作命令
published: 2024-12-07
description: "ADR是Automatic Diagnostic Repository首字母缩写，它是一个数据库外的基于文件的、"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

ADR是Automatic Diagnostic Repository首字母缩写，它是一个数据库外的基于文件的、
并且可以通过事件编号检索和分析的存储库。
http://dba.qishuo.xin/?p=589
MOS文档：purgeLogs: Cleanup traces, logs in one command (Doc ID 2081655.1)

HELP                             查看帮助
HOST                             进入终端命令行,加引号将终端命令行命令打印
SHOW BASE                        查看ORACLE_BASE目录
SHOW ALERT                       查看ALERT日志,以文本编译器模式查看
SHOW INCDIR                      显示INCIDENT严重事件报错目录
SHOW INCIDENT                    显示严重事件报错ORA及时间
SHOW PROBLEM                     显示最近一次问题

清理10天前的incident问题文件（10天 × 24小时 × 60分钟 = 14400 分钟）
adrci> help purge
adrci> purge -age 14400 -type incident
adrci> purge -age 14400 -type trace
-type {ALERT|INCIDENT|TRACE|CDUMP|HM|UTSCDMP|LOG}

在adrci中设置trace文件保留的策略
adrci> show control  #查看可以设置的策略
adrci> help set control
set control (SHORTP_POLICY = 720) #720的单位是小时
