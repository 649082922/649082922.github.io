---
title: Zabbix监控平台使用笔记
published: 2026-01-06
description: "一、对oracle数据库服务器进行监测配置"
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

########################################################数据库########################################################
一、对oracle数据库服务器进行监测配置
选择 "配置" → "主机" → "创建主机",显示配置选项

1.主机
主机名称(填写):            数据库服务名
可见的名称(填写):          excel表格中的系统名称,结构是 DB_数据库服务名_环境名_ip
群组(选择):                ORACLE数据库
Interfaces(默认):          默认不做修改,默认127.0.0.1:10050
描述(默认):                默认不做修改,默认不写
由agent代理程序检测(选择): 10.10.32.123
已启用(默认):              默认不做修改,默认勾选

2.模板
Link new templates(选择):  DGB DB Oracle

3.IPMI
不做修改

4.标记
名称(填写):                运维小组
值(填写):                  传统架构小组

5.宏
宏                         值
{$ADDRESS}                 IP:POST
{$DATABASE}                服务名
{$USERNAME}                btmon
{$PASSWORD}                btmon123

6.资产记录
不做修改

7.加密
不做修改

测试连接情况
点击该主机配置,选择"监控项" → "DA Status" → "数据库运行状态" → "测试" → "Get value and test"
测试结果有返回值即测试成功

二、修改检测模板
选择 "配置" → "模板",显示模板组
点击 "DGB DB Oracle" 模板里的监控项,可以修改全部建库模板

检测脚本路径
10.10.32.123:/opt/Pyora/pyora.py

########################################################服务器########################################################
########################################################AIX
1.root到相关目录
su - root
cd /opt/zabbix_agent/conf

2.查看zabbix agent ip和hostname
cat zabbix_agentd.conf | grep -v ^# |grep =

Service=10.10.32.122              #zabbix agent ip
ServiceActive=10.10.32.122        #zabbix agent ip
Hostname=10.2.4.247               #本机ip

3.修改参数
#Linux,-i修改
sed -i 's/Service=10.10.32.121/Service=10.10.32.122/g' /opt/zabbix_agent/conf/zabbix_agentd.conf
#AIX
sed 's/Service=192.168.1.10/Service=10.2.4.247/g' /opt/zabbix_agent/conf/zabbix_agentd.conf > temp && mv temp /opt/zabbix_agent/conf/zabbix_agentd.conf

4.修改完后重启
cd /opt/zabbix_agent/script
sh restart_zabbix.sh
tail -10f /tmp/zabbix_agentd.log

5.修改zabbix_agentd.conf文件里的Service=x.x.x.x,ServiceActive=x.x.x.x,Hostname=x.x.x.x,
其中Service,ServiceActive后面都改成10.10.32.122,Hostname改成本机ip
vi /tmp/zabbix_conf_replace.sh

#!/bin/ksh
# 获取本地ip地址
LOCAL_IP=$(ifconfig -a | grep 'inet ' | awk '{ print $2}'| head -n 1)

# 定义新的ip地址
NEW_SERVICE_IP=10.10.32.122

# 获取yyyy-mm-dd格式的日期
DATE=$(date +'%F_%H%M%S')

#查看修改前的配置
cat /opt/zabbix_agent/conf/zabbix_agentd.conf | grep -v ^# |grep =

# 备份配置文件
cp /opt/zabbix_agent/conf/zabbix_agentd.conf /opt/zabbix_agent/conf/zabbix_agentd.conf_bak_$DATE

# 修改配置文件
cp /opt/zabbix_agent/conf/zabbix_agentd.conf /opt/zabbix_agent/conf/zabbix_agentd.conf.bak
sed '/^[^#]*Service=/s/=.*/='$NEW_SERVICE_IP'/' /opt/zabbix_agent/conf/zabbix_agentd.conf.bak > /opt/zabbix_agent/conf/zabbix_agentd.conf
cp /opt/zabbix_agent/conf/zabbix_agentd.conf /opt/zabbix_agent/conf/zabbix_agentd.conf.bak
sed '/^[^#]*ServiceActive=/s/=.*/='$NEW_SERVICE_IP'/' /opt/zabbix_agent/conf/zabbix_agentd.conf.bak > /opt/zabbix_agent/conf/zabbix_agentd.conf
cp /opt/zabbix_agent/conf/zabbix_agentd.conf /opt/zabbix_agent/conf/zabbix_agentd.conf.bak
sed '/^[^#]*Hostname=/s/=.*/='$LOCAL_IP'/' /opt/zabbix_agent/conf/zabbix_agentd.conf.bak > /opt/zabbix_agent/conf/zabbix_agentd.conf

# 完成
echo "配置已更新"

#查看修改后的配置
cat /opt/zabbix_agent/conf/zabbix_agentd.conf | grep -v ^# |grep =

#重启zabbix
ps -ef | grep zabbix | grep -v grep |grep -v restart |awk '{print $2}' | xargs kill -9
/opt/zabbix_agent/sbin/zabbix_agentd -c /opt/zabbix_agent/conf/zabbix_agentd.conf

#查看zabbix日志
tail /tmp/zabbix_agentd.log
