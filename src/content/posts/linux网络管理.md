---
title: linux网络管理
published: 2025-06-26
description: "/etc/sysconfig/network		RHEL6修改主机名"
tags: ["Linux", "实战笔记"]
category: 运维
draft: false
---

网络管理
/etc/sysconfig/network		RHEL6修改主机名
hostnamectl set-hosename oracle	RHEL7修改主机名
本地主机名映射
```
[root_@oracle ~]# vim /etc/hosts
```

service 软件名 restart	RHEL6重启指定服务
systemctl restart  软件名	RHEL7重启指定服务
chkconfig 软件名 off	设置指定服务开机关闭
systemctl disable 软件名 	设置指定服务开机关闭

NetworkManager		图形页面网络
iptables,ip6tables		RHEL6防火墙
firewalld			RHEL7防火墙
关闭RHEL安全机制(防火墙策略)
getenforce	查看selinux状态
setenfoce	 0/1	临时设置selinux状态
/etc/selinux/config	持久设置selinux状态

ifconfig if_name up(down) 				临时激活(关闭)网络接口
ifconfig if_name ip地址 /网络前缀(netmask 子网掩码)	临时设置ip
who		查看连接终端的ip

```
[root@oracle ~]# vim  /etc/sysconfig/network-scripts/ifcfg-eth0	配置网卡
```
DEVICE=eth0			配置文件的设备名称
TYPE=Ethernet			网卡类型
ONBOOT=yes			是否启动服务激活网卡
BOOTPROTO=none			ip主机配置协议(dhcp动态,none不使用协议,static使用静态)
IPADDR=192.168.81.2		ip地址
NETMASK=255.255.255.0		定义子网掩码
PREFIX=24			定义网络前缀（网络位数量）

```
[root@oracle ~]# vim /etc/udev/rules.d/70-p******-net.rules		网卡和网络接口的映射关系
```
start_udev	重新扫描设备并产生对应关系
单网卡配置多ip ：0

双网卡
MASTER=虚拟网卡名	归属
SLAVE=yes		确认归属
虚拟网卡正常配置
```
[root@oracle ~]# vim /etc/modprobe.d/dist.conf
```
alias 虚拟网卡名 bonding
options bonding miimon=100 mode=1 fail_over_mac=1
使用bonding模块生成虚拟网卡，options定义bonding选项，miimon检测间隔100ms,mode0负载均衡1自动主备模式
fail_over_mac=1虚拟机用
