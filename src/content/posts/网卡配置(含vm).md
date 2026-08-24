---
title: 网卡配置(含vm)
published: 2025-12-24
description: "1.排查Windows上的NAT服务有没有启动,使用DHCP排查DHCP服务有没有启动"
tags: ["Linux", "实战笔记"]
category: 运维
draft: false
---

#######################################问题排查#######################################
1.排查Windows上的NAT服务有没有启动,使用DHCP排查DHCP服务有没有启动
CMD输入services.msc

2.排查Windows生成的虚拟网卡
打开“网络和 Internet”设置
更改适配器选项
找到对应的网卡,右键属性
选择Internet 协议版本 4(TCP/IPv4)
检查配置(一般自动获取ip即可)

3.排查vm网络配置
选择编辑→虚拟网络编辑器
使用DHCP排查DHCP 设置(P):是否是从3到254(1是虚拟网卡,2是网关)
使用NAT排查NAT 设置(S):网关是否是2
检查:子网 IP (I):192.168.56 .0    子网掩码(M):255.255.255.0

以上排查都无问题后,在虚拟机中配置网卡

############################NetworkManager生成网卡
输入 nmtui
如果报错NetworkManager is not running.
systemctl start NetworkManager 启动
继续输入 nmtui
Edit a connection
ADD > Ethernet
名称:ens33

根据下面这个模板修改重新生成的网卡
vim /etc/sysconfig/network-scripts/ifcfg-ens33

DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes                                  ##改
BOOTPROTO=static                            ##dhcp是自动分配ip,static是手动分配ip
IPADDR=192.168.161.20                       ##最后三位随便写
GATEWAY=192.168.161.225                     ##跟Windows的网关保持一致,ipconfig /all,在虚拟网络编辑器的NAT设置修改,没网关连不上网
DNS1=192.168.161.225                        ##跟Windows的网关保持一致
NETMASK=255.255.255.0
PREFIX=24
PROXY_METHOD=none
BROWSER_ONLY=no
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=no
NAME="System ens33"
UUID=fc703702-4ab1-4c0e-a883-8016dbc7669b

dhcp类型无ip输入下命令获得ip
dhclient

############################nmcli命令详解
https://blog.csdn.net/m0_46829545/article/details/129431657

nmcli device按两下Tab键，会出现备选项：

connect     delete      disconnect  help        lldp        modify
monitor     reapply     set         show        status      wifi
nmcli device connect ens4f0 连接，激活当前这个网卡
nmcli device disconnect ens4f0 断开这个网卡的连接
nmcli device reapply ens4f0 重新启动网卡加载配置

#######################################新虚拟机配置网卡#######################################
ens33配置net网卡,ens36配置仅主机网卡

echo 'DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=static
IPADDR=192.168.126.196
GATEWAY=192.168.126.2
DNS1=192.168.126.2
NETMASK=255.255.255.0
PREFIX=24
PROXY_METHOD=none
BROWSER_ONLY=no
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=no
NAME="System ens33"'> /etc/sysconfig/network-scripts/ifcfg-ens33

echo 'DEVICE=ens36
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.62.196
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens36

service network restart

#######################################学习参考#######################################

1.显示所有网络接口的信息
ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:a3:a5:1d brd ff:ff:ff:ff:ff:ff
    inet 192.168.81.221/24 brd 192.168.81.255 scope global ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::20c:29ff:fea3:a51d/64 scope link
       valid_lft forever preferred_lft forever
3: ens36: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:a3:a5:27 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.137/24 brd 192.168.56.255 scope global dynamic ens36
       valid_lft 1766sec preferred_lft 1766sec
    inet6 fe80::20c:29ff:fea3:a527/64 scope link
       valid_lft forever preferred_lft forever

#显示所有网络接口的状态，ifconfig -a还会显示未激活的接口
ifconfig -a
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.81.221  netmask 255.255.255.0  broadcast 192.168.81.255
        inet6 fe80::20c:29ff:fea3:a51d  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:a3:a5:1d  txqueuelen 1000  (Ethernet)
        RX packets 622  bytes 55611 (54.3 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 562  bytes 570382 (557.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

ens36: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.56.137  netmask 255.255.255.0  broadcast 192.168.56.255
        inet6 fe80::20c:29ff:fea3:a527  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:a3:a5:27  txqueuelen 1000  (Ethernet)
        RX packets 186  bytes 19809 (19.3 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 35  bytes 4250 (4.1 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

2.显示当前操作系统的版本信息
cat /etc/os-release

3.使用vim编辑器编辑网络接口ens33,ens36的配置文件
vim /etc/sysconfig/network-scripts/ifcfg-ens33
vim /etc/sysconfig/network-scripts/ifcfg-ens36

4.显示ens33,ens36的配置信息
#切换到存放网络配置文件的目录
cd /etc/sysconfig/network-scripts/

cat ifcfg-ens33

TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static                            ##dhcp是自动分配ip,static是手动分配ip
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-p******
NAME=ens33
UUID=e33444e5-f021-4d14-8f5b-7df5d31ce990
ONBOOT=yes                                  ##改
HWADDR=00:0c:29:a3:a5:1d                    ## MAC地址必须与实际一致（通过ip addr查看）
IPADDR=192.168.81.221                       ##最后三位随便写
PREFIX=24
GATEWAY=192.168.81.2                        ##跟Windows的网关保持一致,ipconfig /all,在虚拟网络编辑器的NAT设置修改,没网关连不上网
DNS1=192.168.81.2                           ##跟Windows的网关保持一致

cat ifcfg-ens36

TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-p******
NAME=ens36
UUID=653367d5-364a-4456-9901-d0ef2115382d
ONBOOT=yes
HWADDR=00:0c:29:a3:a5:27
IPADDR=192.168.56.221
PREFIX=24
GATEWAY=192.168.56.2
DNS1=192.168.56.2

5.立即停止并禁用NetworkManager服务
systemctl disable --now NetworkManager

6.重启网络服务
systemctl restart network

7.显示网络服务的状态
systemctl status network

8.查看系统日志或网络服务的日志
ll /var/log/messages       #确认文件在
journalctl -xe -u network

9.查找进程列表中所有与dhcp相关的进程(systemctl restart network失败检查杀会话)
配置这个的时候用 BOOTPROTO=dhcp

ps -ef | grep dhc

a.确定DHCP服务是否正在运行：如果找到了与dhcp相关的进程，那就说明DHCP服务正在运行。
b.确定有多少个DHCP服务正在运行：有时候，可能会有多个DHCP服务同时运行，这对网络配置来说可能会产生问题。
  通过查看进程列表，可以确定有多少个DHCP服务正在运行。
c.查找对系统性能产生影响的DHCP进程：如果DHCP进程占用的系统资源过多，可能会影响到系统性能。通过查看进程列表，可以找到这些进程，并采取相应的措施。

#杀会话
kill 2826 3298

10.测试与baidu.com的网络连通性
ping baidu.com

##################
  566  ip a
  567  vim /etc/sysconfig/network-scripts/ifcfg-ens33
  568  cat /etc/os-release
  569  vim /etc/sysconfig/network-scripts/ifcfg-ens33
  570  systemctl disable --now NetworkManager
  571  systemctl restart network
  572  systemctl status network
  573  cd /etc/sysconfig/network-scripts/
  574  systemctl status network
  575  ll
  576  ls
  577  cat ifcfg-ens33
  578  cat ifcfg-ens34
  579  systemctl status network
  580  ll /var/log/messages
  581  systemctl status network
  582  journalctl -xe -u network
  583  ps -ef | grep dhc
  584  cat ifcfg-ens33
  585  cat ifcfg-ens34
  586  ip a
  587  history
  588  ifconfig -a
  589  ifconfig
  590  ifconfig -a
  591  cat ifcfg-ens33
  592  vim ifcfg-ens33
  593  systemctl restart network
  594  journalctl -xe -u network
  595  ip a
  596  ifconfig -a
  597  vim ifcfg-ens36
  598  ifconfig -a
  599  mv ifcfg-ens34 ifcfg-ens36
  600  vim ifcfg-ens36
  601  systemctl restart network
  602  journalctl -xe -u network
  603  ps -ef | grep dhc
  604  kill 2826 3298
  605  ps -ef | grep dhc
  606  systemctl restart network
  607  ip a
  608  vim ifcfg-ens33
  609  ip a
  610  vim ifcfg-ens33
  611  systemctl restart network
  612  vim ifcfg-ens33
  613  systemctl restart network
  614  ifconfig -a
  615  pwd
  616  history
  617  shutdown -now -h
  618  ping baidu.com

ip a: 显示所有网络接口的信息。
vim /etc/sysconfig/network-scripts/ifcfg-ens33: 使用vim编辑器编辑网络接口ens33的配置文件。
cat /etc/os-release:显示当前操作系统的版本信息。
systemctl disable --now NetworkManager: 立即停止并禁用NetworkManager服务。
systemctl restart network: 重启网络服务。
systemctl status network: 显示网络服务的状态。
cd /etc/sysconfig/network-scripts/： 切换到存放网络配置文件的目录。
ll，ls： 列出当前目录下的所有文件和目录。
cat ifcfg-ens33： 显示ens33的配置信息。
cat ifcfg-ens34： 显示ens34的配置信息。
ll /var/log/messages，journalctl -xe -u network：查看系统日志或网络服务的日志。
ps -ef | grep dhc： 查找进程列表中所有与dhcp相关的进程。
ifconfig -a，ifconfig： 显示所有网络接口的状态，ifconfig -a还会显示未激活的接口。
vim ifcfg-ens33，vim ifcfg-ens36： 编辑ens33或ens36的网络配置。
mv ifcfg-ens34 ifcfg-ens36：把ens34的配置文件重命名为ens36的配置文件。
kill 2826 3298：结束进程号为2826和3298的进程。
pwd： 显示当前工作目录的完整路径。
shutdown -now -h：立即关机。
ping baidu.com： 测试与baidu.com的网络连通性。
