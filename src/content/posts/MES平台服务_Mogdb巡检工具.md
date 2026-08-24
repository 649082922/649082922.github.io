---
title: MES平台服务_Mogdb巡检工具
published: 2024-10-12
description: "支持操作系统，centos，kylin"
tags: ["PostgreSQL", "实战笔记"]
category: 数据库
draft: false
---

介绍
支持mogdb版本3.x以上
支持操作系统，centos，kylin

mogdb巡检工具由两个脚本和一个配置文件组成：

1,h_check2.sh 是巡检执行脚本，用来采集操作系统和数据库巡检参数。如果数据库非单机而是主备架构，
脚本应在主库上执行，会自动采集所有主备库的主机信息和主库的mogdb数据集信息。

2，check_all_node.py 是跨库推送脚本，可根据配置文件 check_conf.json 的配置信息，
将h_check2.sh脚本推送到多套数据库上执行，实现一次性巡检多套数据库的功能。
注意：实现此功能需要提前配置好执行脚本的主机和其他数据库主库服务器的ssh互信，
脚本通过scp 命令将巡检执行脚本推送到目标服务器，并取回巡检结果。

3，check_conf.json 是多套库的配置信息，需提前配置好此文件，才能实现一次巡检多套库的功能。
参数说明：
script_path：执行check_all_node.py 的服务器上 h_check2.sh 的路径
repot_path：巡检报告回传的保存路径
host_list：巡检多套数据库的信息列表
host：主机ip
pguser：mogdb数据库初始用户名
port：mogdb数据库端口号
htmldir：巡检报告保存的本地地址，$表示 /home/$pguser/ 目录
scriptdir：巡检脚本保存的本地地址，$表示 /home/$pguser/ 目录

使用说明

1，巡检本机或本机所在的集群。

快速执行命令：
sh h_check2.sh

可指定参数：
-host :主机名，缺省值为当前主机名。
-u --pguser :mogdb 初始用户，缺省值为：omm"。
-p --port :mogdb 端口号，缺省值为 26000"  。
-f --htmlfile :巡检报告保存全路径名称，默认为 /home/${PGUSER}/${HostName}_mogdb_$(date '+%Y-%m-%d_%H_%M_%S').html。

全参数示例：
sh h_check2.sh -host myhost -u enmo -p 27000 -f /opt/mogdb/mydb_01.html

2，巡检多套库

首先配置check_conf.json文件，只用配置每个套集群的主库信息：

{
    "script_path": "/home/omm/script/h_check2.sh",
    "repot_path": "/home/omm/check_report",
    "host_list": [
        {
            "host": "mogdb01",
            "pguser": "omm",
            "port": "26000",
            "htmldir": "$/check_report",
            "scriptdir": "$/script/"
        },
        {
            "host": "enmodb01",
            "pguser": "omm",
            "port": "26000",
            "htmldir": "$/check_report",
            "scriptdir": "$/script/"
        }
    ]
}

然后执行
python check_all_node.py
