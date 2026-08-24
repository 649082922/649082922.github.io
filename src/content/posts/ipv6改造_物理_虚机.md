---
title: ipv6改造_物理_虚机
published: 2026-02-20
description: "IPV6_HEAD=fd00:0:4000:6000:"
tags: ["Linux", "实战笔记"]
category: 运维
draft: false
---

#!/bin/bash
#修改IPV6_HEAD，修改网卡名
IPV6_HEAD=fd00:0:4000:6000:
IPV4_ADDR=`ifconfig | grep -A 5 p5p1 | egrep -o "[0-9.]+{7,15}" | awk -F. '{print $1"."$2"."$3"."$4}' | head -1`
IPV4_GATEWAY=`ifconfig | grep -A 5 p5p1 | egrep -o "[0-9.]+{7,15}" | awk -F. '{print $1"."$2"."$3"."}' | head -1`254
IPV6_ADDR=`ifconfig | grep -A 5 p5p1 | egrep -o "[0-9.]+{7,15}" | awk -F. '{print $1"."$2"."$3"."$4}' | head -1`
IPV6_ADDR=$(echo $IPV6_ADDR| sed 's/\./:/g')
IPV6_GATEWAY=`ifconfig | grep -A 5 p5p1 | egrep -o "[0-9.]+{7,15}" | awk -F. '{print $1"."$2"."$3"."}' | head -1`254
IPV6_GATEWAY=`echo $IPV6_GATEWAY| sed 's/\./:/g'`

ip a > /root/ip.baktxt && route -n >>  /root/ip.baktxt
nmcli connection modify p5p1 ipv4.method manual ipv4.addresses ${IPV4_ADDR}/24 ipv4.gateway ${IPV4_GATEWAY};
nmcli connection up p5p1;
systemctl stop network;
systemctl disable network;
sleep 2;
systemctl restart NetworkManager;
systemctl status network;
nmcli connection modify p5p1 ipv6.method manual ipv6.addresses ${IPV6_HEAD}${IPV6_ADDR}/64;
nmcli connection modify p5p1 ipv6.gateway "${IPV6_HEAD}${IPV6_GATEWAY}";
nmcli connection up p5p1;
