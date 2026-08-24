---
title: GBase8a误删恢复实战记录
published: 2026-05-12
description: "GBase 8a MPP Cluster rm -rf 误删恢复实战记录"
tags: ["GBase", "实战笔记"]
category: 数据库
draft: false
---

GBase 8a MPP Cluster rm -rf 误删恢复实战记录
日期: 2026-04-28
环境: 单节点集群，IP 192.168.1.12
系统: CentOS/RHEL on VMWare

#########################################################################
一、事故背景
#########################################################################
#误操作
cd /gbase
rm -rf 192.168.1.12

#此时 GBase 所有进程仍在运行：
#PID 24343: gbased (gnode 数据节点)
#PID 24345: gcware (集群状态管理)
#PID 25383: gcware_monit
#PID 25386: gcware_mmonit
#PID 25394: gc_sync_server (数据同步)
#PID 25405: gcmonit
#PID 25407: gcmmonit
#PID 25424: gclusterd (gcluster 协调节点)
#PID 25951: gcrecover

#关键前提：
#- 进程还活着，持有被删文件的文件描述符（fd）
#- 没有备份

#########################################################################
二、恢复原理
#########################################################################
Linux 下 rm 删除文件只是删除了目录项（文件名），如果进程仍持有该文件的 fd，
文件的实际数据仍存在于磁盘上，可以通过 /proc/PID/fd/ 访问。

恢复思路：
1. 在另一台服务器上安装 GBase，scp 到本机作为文件骨架（二进制、配置等）
2. 暂停进程，将骨架文件拷贝到数据库目录，进程运行时会一直在原目录创建文件目录
3. 恢复进程，通过 /proc/PID/fd/ 将进程持有的最新数据文件写回原位
4. 骨架文件提供程序和配置，fd 恢复的数据文件提供最新业务数据
5. 修复权限，重启服务

#########################################################################
三、恢复步骤
#########################################################################

=== 步骤1：确认进程还活着，千万不能 kill ===
ps -ef | grep gbase | grep -v grep

#如果进程还在，说明 fd 还没释放，还有救
#绝对不能做的操作：
#- kill 进程
#- 重启服务器
#- systemctl restart gbase
#- gcware_services all stop / gcluster_services all stop（会释放 fd）

#########################################################################

=== 步骤2：查看所有进程持有的已删除文件 ===

#查看单个进程的已删除文件
ls -la /proc/PID/fd/ | grep deleted

#统计所有进程的已删除文件数量
for pid in $(ps -ef | grep gbase | grep -v grep | awk '{print $2}'); do
  n=$(ls -la /proc/$pid/fd/ 2>/dev/null | grep deleted | wc -l)
  echo "PID $pid: $n 个已删除文件"
done

#多个进程可能持有同一个文件的 fd，统计数量会偏多，这是正常的

#########################################################################

=== 步骤3：在另一台服务器上安装 GBase，提供文件骨架 ===

#fd 只能恢复进程持有的文件（数据文件、日志等），以下文件不在 fd 中：
#- 二进制程序（gbased, gclusterd, gcware 等）
#- 配置文件（.cnf, .conf 等）
#- 库文件（.so 等）
#- 初始化脚本
#这些文件需要从另一台服务器补齐

#3.1 在另一台同系统机器上安装 GBase
#  - installPrefix = /gbase
#  - 用新机器自己的 IP 正常安装，不要填原机器 IP（否则安装过程会去连原机器导致失败）
#  - 不能在原机上重装，因为 stop 服务会释放 fd，数据彻底丢失
#  - 安装完停掉服务
su - gbase -c "gcluster_services all stop; gcware_services all stop"

#3.2 把新装的完整目录 scp 到原机器的临时位置
#  假设新机器 IP 为 10.0.0.100，安装后目录为 /gbase/10.0.0.100
#  scp 过来时直接重命名
scp -r root@10.0.0.100:/gbase/10.0.0.100 /gbase/192.168.1.12_new

#3.3 查看哪些文件包含新机器 IP，确认 sed 替换范围：
grep -rl "10.0.0.100" /gbase/192.168.1.12_new/ | grep -v -E "\.MYD|\.MYI|\.frm|\.GED|\.csv|\.log|\.sock|\.pid|REDOLOG"

#3.4 替换配置文件中的 IP（将新机器 IP 替换为原机器 IP）
#  例如将 10.0.0.100 替换为 192.168.1.12
#  需要替换的文件：
#    gcluster/config/*.cnf     - gcluster 配置
#    gnode/config/*.cnf        - gnode 配置
#    gcware/config/*.conf      - gcware 配置
#    gbase_profile             - 环境变量
#    gcware_profile            - 环境变量
#    gcware/data/gcware/SNAPSHOT.*/** - gcware 集群状态数据（不在 fd 中，不会被覆盖）
#  注意：gcware/data/ 下的 REDOLOG 文件在 fd 中，fd 恢复时会覆盖，不需要改
sed -i 's/10.0.0.100/192.168.1.12/g' /gbase/192.168.1.12_new/gcluster/config/*
sed -i 's/10.0.0.100/192.168.1.12/g' /gbase/192.168.1.12_new/gnode/config/*
sed -i 's/10.0.0.100/192.168.1.12/g' /gbase/192.168.1.12_new/gcware/config/*
sed -i 's/10.0.0.100/192.168.1.12/g' /gbase/192.168.1.12_new/gbase_profile
sed -i 's/10.0.0.100/192.168.1.12/g' /gbase/192.168.1.12_new/gcware_profile
find /gbase/192.168.1.12_new/gcware/data/gcware/ -type f ! -name "REDOLOG*" \
-exec sed -i 's/10.0.0.100/192.168.1.12/g' {} +

#验证：替换后不应有残留的新机器 IP
grep -rl "10.0.0.100" /gbase/192.168.1.12_new/ | grep -v -E "\.MYD|\.MYI|\.frm|\.GED|\.csv|\.log|\.sock|\.pid|REDOLOG"

#########################################################################

=== 步骤4：暂停进程，拷贝骨架文件 ===

#4.1 暂停进程（冻结，不释放 fd，数据不丢失）
#  用步骤1中查到的 gbase 进程 PID，手动填写
kill -STOP 24343 24345 25383 25386 25394 25405 25407 25424 25951

#4.2 把新装的文件拷贝到数据库目录
#  注意不能用 mv 直接覆盖已存在的目录，会变成子目录
#  必须用 cp -rf
cp -rf /gbase/192.168.1.12_new/* /gbase/192.168.1.12/

#4.3 恢复进程
kill -CONT 24343 24345 25383 25386 25394 25405 25407 25424 25951

#注意：
#- kill -STOP 只是冻结进程，不释放 fd，数据不会丢
#- 必须先暂停再操作文件，否则进程持续写入会导致文件冲突
#- 暂停后要尽快完成文件拷贝，缩短暂停时间

#########################################################################

=== 步骤5：通过 fd 恢复最新数据文件 ===

#进程恢复运行后，fd 仍然有效
#现在把 fd 指向的最新数据文件写回原位，覆盖骨架中的旧数据

for pid in 24343 24345 25383 25386 25394 25405 25407 25424 25951; do
  echo "=== 恢复 PID $pid ==="
  for fd in /proc/$pid/fd/*; do
    link=$(readlink "$fd" 2>/dev/null)
    if echo "$link" | grep -q "deleted"; then
      real_path=$(echo "$link" | sed 's/ (deleted)$//')
      if [ -f "$fd" ]; then
        cat "$fd" > "$real_path" 2>/dev/null
        echo "OK: $real_path"
      fi
    fi
  done
done

#说明：
#- fd 的 link 指向如 /gbase/192.168.1.12/.../db.MYD (deleted)
#- 去掉 (deleted) 后缀就是原始路径，直接 cat 写回原位
#- 骨架文件中的系统表数据（db.MYD 等）会被 fd 中的最新数据覆盖
#- 多个进程持有同一文件的 fd 会被重复恢复，不影响结果

#########################################################################

=== 步骤6：修复权限 ===
chown -R gbase:gbase /gbase/192.168.1.12
chmod -R 755 /gbase/192.168.1.12

#########################################################################

=== 步骤7：重启服务 ===

#停服（按顺序）
gcware_services all stop
gcluster_services all stop

#启服（按顺序）
gcware_services all start
gcluster_services all start

#检查集群状态
gcadmin

#正常状态应该是：
#gcware:    OPEN
#gcluster:  OPEN
#gnode:     OPEN

#########################################################################

=== 步骤8：验证数据完整性 ===

#查看数据库列表
gccli -uroot -p'密码' -h192.195.159.91 -P5258 -e "SHOW DATABASES;"

#查看表
gccli -uroot -p'密码' -h192.195.159.91 -P5258 -e "USE 库名; SHOW TABLES;"

#查数据量
gccli -uroot -p'密码' -h192.195.159.91 -P5258 -e "SELECT COUNT(*) FROM 库名.表名;"

#########################################################################
四、完整流程概览
#########################################################################
1. 确认进程还活着（ps -ef | grep gbase）
2. 查看 fd 中有哪些已删除文件（ls -la /proc/PID/fd/ | grep deleted）
3. 另一台服务器安装 GBase，scp 到本机临时目录（IP 不要求一致）
4. kill -STOP 暂停进程
5. cp -rf 把骨架文件拷贝到数据库目录
6. kill -CONT 恢复进程
7. 从 fd 恢复最新数据文件到原位
8. 修复权限（chown -R gbase:gbase）
9. 重启服务（gcware_services + gcluster_services）
10. 验证数据完整性

#########################################################################
五、常见问题及解决
#########################################################################

问题1：mv 目录时目标已存在，变成子目录
--------------------------------------------------------------
现象：mv 192.168.1.12.bak 192.168.1.12
结果：192.168.1.12/192.168.1.12.bak/
解决：
  mv /gbase/192.168.1.12/192.168.1.12.bak/* /gbase/192.168.1.12/
  rmdir /gbase/192.168.1.12/192.168.1.12.bak
  或者直接用 cp -rf 替代 mv

问题2：进程还在写日志文件，删了又出来
--------------------------------------------------------------
现象：rm 删掉 gcluster/gnode 目录后又出现了新文件
原因：进程还在运行，持续写日志
解决：
  kill -STOP PID   #暂停进程（冻结，不释放fd）
  kill -CONT PID   #恢复进程
  #注意：CONT 后如果进程状态异常，可能需要 stop/start 重启服务

问题3：恢复文件数量统计偏多
--------------------------------------------------------------
原因：多个进程持有同一个文件的 fd，统计时重复计数
解决：只要关键数据文件都在就行，数量差异不影响

问题4：socket 文件被删，gccli 连不上
--------------------------------------------------------------
现象：ERROR 2002 (HY000): Can't connect through socket '...gcluster_5258.sock' (2)
原因：socket 文件被 rm 删了
解决：
  方式一：走 TCP 连接（推荐）
    gccli -uroot -p'密码' -h 127.0.0.1 -P5258
  方式二：重启 gclusterd 会自动重建 socket 文件

问题5：SHOW DATABASES 只有系统库，看不到业务库
--------------------------------------------------------------
现象：只显示 information_schema、performance_schema
原因：db.MYD（数据库注册表）恢复后为空或被骨架文件覆盖
解决：
  1. 确认数据目录实际存在：
     ls /gbase/192.168.1.12/gnode/userdata/gbase/
     ls /gbase/192.168.1.12/gcluster/userdata/gcluster/
  2. 重新从 fd 恢复 db.MYD 和 db.MYI：
     ls -la /proc/gclusterd的PID/fd/ | grep "db.MY" | grep deleted
     cp /proc/PID/fd/编号 /gbase/192.168.1.12/gcluster/userdata/gcluster/gbase/db.MYI
     cp /proc/PID/fd/编号 /gbase/192.168.1.12/gcluster/userdata/gcluster/gbase/db.MYD
  3. 重启服务后库可能自动恢复

问题6：gcluster/gnode 状态为 CLOSE
--------------------------------------------------------------
现象：gcadmin 显示 gcluster=CLOSE, gnode=CLOSE
原因：进程被 kill -STOP 暂停后未恢复正常，或文件缺失导致服务异常
解决：
  gcware_services all stop
  gcluster_services all stop
  gcware_services all start
  gcluster_services all start
  gcadmin  #确认全部 OPEN

问题7：CREATE DATABASE 报 "All gcluster nodes is unValid"
--------------------------------------------------------------
原因：gcluster 节点状态为 CLOSE，无法执行 DDL
解决：先修复集群状态（见问题6），再操作数据库

#########################################################################
六、恢复后必须做的事：逻辑备份
#########################################################################
#恢复后第一时间做逻辑备份，物理文件已经出过事了

#1.导出表结构
gcdump -uroot -p'密码' -hIP -P5258 --all-databases > /gbase/backup/all_schema.sql

#2.导出表数据
mkdir -p /gbase/backup/data
for db in 库名1 库名2 库名3; do
  gccli -uroot -p'密码' -hIP -P5258 -N -e "SHOW TABLES FROM $db;" | while read tbl; do
    gccli -uroot -p'密码' -hIP -P5258 -N -e "SELECT * INTO OUTFILE '/gbase/backup/data/${db}.${tbl}.csv' FIELDS TERMINATED BY '|' LINES TERMINATED BY '\n' FROM $db.$tbl;"
  done
done

#3.SELECT INTO OUTFILE 每个表会导出为一个目录（不是文件），这是正常的
#  目录内包含实际数据文件

#########################################################################
七、关键经验总结
#########################################################################
1. 进程还活着 = 还有救，千万不要 kill 进程或重启服务器
2. 不能在原机上 stop 服务或重装，会释放 fd，数据彻底丢失
3. fd 恢复只能恢复进程持有的文件（数据文件），二进制和配置文件需要从另一台服务器补齐
4. 正确流程：scp 骨架文件 → kill -STOP 暂停 → cp 骨架到数据库目录 → kill -CONT 恢复 → fd 恢复数据
5. kill -STOP 只冻结进程不释放 fd，数据不会丢
6. 必须先暂停进程再操作文件，否则进程持续写入会导致文件冲突
7. /gbase/192.168.1.12 目录名是安装时根据节点 IP 自动生成的，不能改
8. 另一台服务器 IP 不要求一致，scp 过来后重命名为原目录名即可
9. 恢复后第一时间做逻辑备份（gcdump + SELECT INTO OUTFILE）
10. 连不上 socket 时走 TCP 连接（gccli -h 127.0.0.1 -P5258）
11. 以后每次重大操作前先做逻辑备份，不要依赖物理文件
