---
title: os_db_version_check
published: 2025-06-18
description: "IP_LIST=($(< /root/demo/ipfile.txt))"
tags: ["Docker", "实战笔记"]
category: 运维
draft: false
---

#!/bin/sh
#===============================================================================
# 文件名: os_db_version_check.sh
# 创建时间: 2025-05-22 12:00:00
# 修改时间: 2025-05-26 12:00:00
# 描述: 检查不同操作系统软件配置信息
# 路径: /root/demo/os_db_version_check.sh
# 版本: 1.0.0
# 作者: demo(user@example.com)
# 版权所有 (C) 2025-2099 Sihan Liu
#===============================================================================

# 定义需要修改的ip列表
IP_LIST=($(< /root/demo/ipfile.txt))

# 定义日志文件名，cvs文件名称，包含时间标识
LOG_FILE="OS_check_$(date +'%F_%H%M%S').log"
CSV_FILE="OS_check_$(date +'%F_%H%M%S').csv"
echo "check_type,IP,os,db_version" > "$CSV_FILE"

cat > "/root/demo/.OS_check" << 'EOF'
# 获取操作系统信息
if [ "$(uname -s)" = "AIX" ]; then
      # 获取 os 版本
      pretty_name="$(uname) $(oslevel)"

      # 获取 DB 环境变量
      profile_name=/home/oracle/.profile
      unset MAIL
      MAILCHECK=0
else
      libc_version=$(ldd --version | head -n 1 | awk '{print $NF}' | cut -d '.' -f 2)
      # 获取 cpu 类型
      cpu_type=$(uname -m)

      # 获取 os 类型
      if [[ -e /etc/os-release ]]; then
        os_type=$(grep -oP '^ID="?(\K[^"]+|[^"]+$)' /etc/os-release)
        pretty_name=$(grep '^PRETTY_NAME=' /etc/os-release | cut -d'"' -f2)
      else
        os_file=$(if [[ -f "/etc/system-release" ]]; then echo /etc/system-release; else echo /etc/redhat-release; fi)
        os_type=$(grep -oP '^[A-Za-z]+' "$os_file")
        pretty_name=$(cat /etc/system-release)
      fi

      # 获取 os 版本
      if ((libc_version >= 12 && libc_version <= 16)); then
        os_version=6
      elif ((libc_version >= 17 && libc_version <= 27)); then
        os_version=7
      elif ((libc_version >= 28 && libc_version <= 33)); then
        os_version=8
      elif ((libc_version >= 34 && libc_version <= 38)); then
        os_version=9
      elif ((libc_version >= 39)); then
        os_version=10
      else
        color_printf red "当前操作系统版本 [ $pretty_name ] 不在脚本支持列表中"
      fi

      # 获取 profile 名称
      case "$os_type" in
      sles|opensuse-leap|opensuse-tumbleweed|ubuntu|debian|Deepin)
          profile_name=/home/oracle/.profile
          ;;
      *)
          profile_name=/home/oracle/.bash_profile
          ;;
      esac
fi

# 判断是否存在oracle用户
if ! id oracle >/dev/null 2>&1; then
  printf '%s, ' "$pretty_name"; \
  echo "非标安装无法判断数据库版本"
else
  . $profile_name
  printf '%s, ' "$pretty_name"; \
  sqlplus -v 2>&1 | awk '/Release|Version/ {for(i=1;i<=NF;i++) if($i ~ /^[0-9.]+$/) print $i}'|tail -1
fi

EOF

# 读取IP
for IP_LINE in "${IP_LIST[@]}"; do
   IP="${IP_LINE}"

  {
    date
    echo "----------------------begin----------------------"
    echo "开始对$IP 进行操作"
scp /root/demo/.OS_check root@$IP:/tmp/.OS_check

    # 登录远程服务器并执行命令
	# Pseudo-terminal will not be allocated because stdin is not a terminal.为正常输出
    ssh -t "$IP" << EOF

echo OS_check,$IP, | tr -d '\n'

sh /tmp/.OS_check

EOF

    # 检查任务执行是否成功
    if [ $? -ne 0 ]; then
      echo "注意: IP $IP 任务执行失败"
      continue
    fi
    date
    echo "----------------------end----------------------"
  } >> "$LOG_FILE"

done

grep "OS_check" "$LOG_FILE"  >> "$CSV_FILE"
