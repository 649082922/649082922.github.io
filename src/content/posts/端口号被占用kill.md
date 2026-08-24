---
title: 端口号被占用kill
published: 2024-01-21
description: "netstat -ano|grep 8899|wc -l"
tags: ["Linux", "实战笔记"]
category: 运维
draft: false
---

netstat -ano|grep 8899|wc -l
netstat -tunlp|grep 3100
netstat -tunlp|grep 服务pid

netstat -nltp 列所有

查看 Linux 系统上的端口是否在使用中，可以使用以下命令：
1.使用 netstat 命令：netstat -tuln。这会显示所有当前监听的 TCP 和 UDP 端口。您可以查找特定的端口号是否在列表中。
2.使用 ss 命令：ss -tuln。ss 命令是一个功能更强大的替代品，可以显示更详细的端口信息。
3.使用 lsof 命令：lsof -i :<端口号>。这会显示占用特定端口的进程和应用程序。
4.使用 nmap 命令：nmap -p <端口号> <IP地址>。nmap 是一个网络扫描工具，可以用来检测特定 IP 地址上的端口状态。

请注意，上述命令可能需要以超级用户或管理员权限运行，例如使用 sudo 前缀。此外，对于某些命令，您可能需要先安装相应的软件包，如 nmap。

要终止 Linux 系统上的端口连接，您可以使用以下方法：
1.使用 lsof 命令结合 kill 命令：首先使用 lsof -i :<端口号> 命令查找占用该端口的进程的 PID（进程 ID），
然后使用 kill <PID> 命令终止该进程。例如，要终止占用端口 8080 的进程，
可以执行以下命令：lsof -i :8080 查找 PID，然后 kill <PID> 终止该进程。
2.使用 fuser 命令结合 kill 命令：类似于 lsof，可以使用 fuser <端口号>/tcp 命令查找占用端口的进程，
并使用 kill 命令终止进程。例如，fuser 8080/tcp 查找并终止占用端口 8080 的进程。
3.使用 netstat 命令结合 kill 命令：可以使用 netstat -tuln 命令查看所有监听的端口和与之关联的进程的 PID。然后，使用 kill <PID> 命令终止进程。

请注意，在执行这些命令时，可能需要以超级用户或管理员权限运行，例如使用 sudo 前缀。确保正确识别并终止特定端口的进程，以免对系统造成不良影响。
lsof -i :8899
kill -9 pid

###查看Windows端口占用
1.下面命令可以查到ID(PID)
netstat -ano | findstr 7890

2.输入Win + R，输入“resmon.exe” 通过资源监视器可以查看具体是哪个进程

3.tasklist |findstr "进程名称"查找该进程的PID号
tasklist |findstr java

4.杀进程
taskkill /f /t /pid "进程PID"
taskkill /f /t /pid 12260
