---
title: WebSphere常用操作
published: 2025-08-25
description: "1>创建profile需要先配置/etc/hosts文件，解析本主机主机名"
tags: ["云平台", "实战笔记"]
category: 运维
draft: false
---

https://www.modb.pro/db/506870

1.创建profile
1>创建profile需要先配置/etc/hosts文件，解析本主机主机名
略
2>命令创建
创建普通的 AppSrv01
cd /was/IBM/WebSphere/AppServer/bin
./manageprofiles.sh -create -templatePath /was/IBM/WebSphere/AppServer/profileTemplates/default \
profileName AppSrv01 -p****** ../profiles/AppSrv01 -nodeName docker-node-01 \
-cellName docker-node-01Cell -hostname docker

2.启动was
把/was目录属主权限授予给was用户
su - was
cd /was/IBM/WebSphere/AppServer/profiles/AppSrv01/bin
./startServer.sh server1

#停止
./stopServer.sh server1
密码:admin/P@ssw0rd

3.配置server.xml文件(看需要做)
cd /was/IBM/WebSphere/AppServer/profiles/AppSrv01/config/cells/xxxxxx/nodes/xxxxx/server/server1/server.xml
目前JVM参数配置如下:
initialHeapSize="1024" maximumHeapSize="2048"
初始堆内存设置为1024MB，最大堆内存设置为2048MB
可以根据实际进行修改,生产环境是1546,3069

4.登陆控制台
http:/xx.xx.xx.xx:9060/ibm/console
密码:admin/P@ssw0rd
