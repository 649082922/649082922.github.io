---
title: ora根据连接串_创建用户
published: 2026-06-02
description: "vi check_create_user.sh"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

vi check_create_user.sh

ip.txt 存放连接串
create_btmon.sql 存放创建用户脚本

报错TNS:listener 则排查数据库监听问题

hang住
报错TNS:connection timed out可能是端口未开通
没反应不报错:连接的数据库存在性能问题,SELECT COUNT(*) FROM dba_users执行不出来

#!/bin/bash

# 定义日志文件名，包含时间标识符
LOG_FILE="check_create_user_$(date +'%F_%H%M%S')".log

# 输出操作日志
date >> ${LOG_FILE}
echo "----------------------begin----------------------" >> ${LOG_FILE}

# 读取ip.txt中的数据库连接串并分行存储到一个数组中
DB_CONNECTIONS=$(cat ip.txt)

# 循环处理每个数据库连接串
for DB_CONNECTION in "${DB_CONNECTIONS[@]}"; do
    # 提取连接串地址
    IP_STR=$(echo ${DB_CONNECTION} | awk -F'@' '{print $NF}')
    echo ${IP_STR} >> ${LOG_FILE}

    # 登录到Oracle数据库并查询btmon用户是否存在
    USER_EXISTS=$(echo "SET PAGESIZE 0 FEEDBACK OFF VERIFY OFF HEADING OFF ECHO OFF;
                       SELECT COUNT(*) FROM dba_users WHERE username = 'BTMON';" | sqlplus -S ${DB_CONNECTION} | awk '{gsub(/[^0-9]/,"",$1); print $1}')

    # 执行查询结果的判断和相应的操作
    if [[ ${USER_EXISTS} -eq 0 ]]; then
        # 在数据库中执行 create_btmon.sql 脚本，前提是脚本已经存在于数据库服务器上
        echo "BTMON用户不存在，执行 create_btmon.sql 脚本" >> ${LOG_FILE}
        echo "@create_btmon.sql" | sqlplus -S ${DB_CONNECTION} >> ${LOG_FILE}
    else
        # 修改用户密码
        echo "BTMON用户存在，执行alter user命令" >> ${LOG_FILE}
        echo "ALTER USER BTMON IDENTIFIED BY btmon123 ACCOUNT UNLOCK;" | sqlplus -S ${DB_CONNECTION} >> ${LOG_FILE}
    fi

date >> ${LOG_FILE}

# 输出操作日志

done
date >> ${LOG_FILE}
echo "----------------------end----------------------" >> ${LOG_FILE}

#############################################################################
AIX

1.# 读取ip.txt中的数据库连接串并分行存储到一个数组中
DB_CONNECTIONS=$(cat ip.txt)
可以改成
DB_CONNECTIONS=/home/oracle/ora_sh/ip.txt

2.# 循环处理每个数据库连接串
for DB_CONNECTION in "${DB_CONNECTIONS[@]}"; do
可以改成
for DB_CONNECTION in `cat $DB_CONNECTIONS`
 do

3.需要执行的sql文件为匿名块,需要替换以下内容
        echo "@create_btmon.sql" | sqlplus -S ${DB_CONNECTION} >> ${LOG_FILE}
替换成
sqlplus -S ${DB_CONNECTION} << EOF >> ${LOG_FILE}
start create_btmon.sql
EOF

#最后一个EOF要顶格写,后面只能是回车
