---
title: ob_docker命令
published: 2026-03-14
description: "docker inspect <container_id_or_name>"
tags: ["Docker", "实战笔记"]
category: 运维
draft: false
---

##############################################################################一、Docker 基础命令
##########################1. 容器管理

# 查看所有容器（-a 包括停止的容器）
docker ps -a

# 查看特定容器的详细信息
docker inspect <container_id_or_name>

# 启动/停止/重启容器
docker start <container_id_or_name>
docker stop <container_id_or_name>
docker restart <container_id_or_name>

# 强制终止容器（当 stop 无响应时）
docker kill <container_id_or_name>

##########################2. 资源配置与查看

# 查看分配的资源限制（内存、CPU）
docker inspect ocp | grep Mem
# Memory:21474836480 (20GB)
docker inspect ocp | grep Cpu
# CpuQuota:800000 / CpuPeriod:100000 = 8核

# 查看实时资源使用情况
docker stats
docker stats ocp  # 查看单个容器

# 更新容器资源限制
docker update --cpus 2 --memory 1g my_container
docker update --cpu-shares 1024 my_container

# CPU shares 说明：
# - CPU 空闲时，容器可自由使用，不受限制
# - CPU 争用时，按权重比例分配时间

##########################3. 日志查看

# 查看最后 N 行
docker logs --tail 100 <container_id_or_name>

# 实时跟踪日志
docker logs -f <container_id_or_name>

# 查看最近 1 小时的日志
docker logs --since 1h <container_id_or_name>

# 查看指定时间范围
docker logs --since "2026-02-02T10:00:00" --until "2026-02-02T11:00:00" <container_id_or_name>

# 显示时间戳
docker logs --timestamps <container_id_or_name>

# 查看容器内应用日志
docker logs metadb 2>&1 | grep -i error

##########################4. 进入容器

# 进入容器（推荐）
docker exec -it <container_id_or_name> /bin/bash  #最优
docker exec -it <container_id_or_name> /bin/sh

# 在容器内执行单条命令
docker exec <container_id_or_name> ps aux
docker exec <container_id_or_name> cat /proc/loadavg

# 从容器复制文件到宿主机
docker cp <container_id_or_name>:/path/to/file /local/path

# 从宿主机复制文件到容器
docker cp /local/path <container_id_or_name>:/container/path

##########################5. 磁盘清理

# 清理未使用的镜像、容器、网络
docker system prune

# 清理所有未使用的资源（包括未使用的镜像）
docker system prune -a

# 查看磁盘使用情况
docker system df

##############################################################################二、OCP/metadb 特定命令
1. supervisord 管理

# 进入容器查看服务状态
docker exec -it metadb /bin/bash
supervisorctl status

# 重启所有组件
supervisorctl restart all

# 重启单个服务
supervisorctl restart observer
supervisorctl restart obproxy

# metadb 正常状态下，以下两个进程是 EXITED：
# - change_password
# - ocpagent
2. OceanBase 状态检查

# 查看 observer 进程
docker exec metadb ps aux | grep observer

# 查看 observer 主日志（搜索错误）
docker exec metadb tail -100 /home/admin/oceanbase/log/observer.log | grep -E "ERROR|WARN"

# 查看 GTS/RS 相关错误
docker exec metadb grep -E "gts failed|not master|rootserver" /home/admin/oceanbase/log/observer.log | tail -20

# 查看启动日志
docker exec metadb cat /home/admin/oceanbase/log/start_ob.log | grep "WDIAG\|WARN\|ERROR"
[2023-08-29 10:43:03.427364] WARN [env METADB_CLUSTER_NAME not set]  #可以通过这个看历史启动时间

# 查看配置
docker exec metadb strings /home/admin/oceanbase/etc/observer.config.bin

# 查看环境变量
docker exec metadb env | grep -E "CLUSTER|ZONE|PORT|ROOTSERVICE"
