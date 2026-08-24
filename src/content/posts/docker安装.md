---
title: docker安装
published: 2024-08-25
description: "docker安装(sp:008开始)"
tags: ["Docker", "实战笔记"]
category: 运维
draft: false
---

docker安装(sp:008开始)

官方下载地址
https://docs.docker.com/engine/install/

阿里云镜像站
https://developer.aliyun.com/mirror/
容器:
kubernetes         k8s
docker-toolbox     docker工具箱(在Windows,Macintosh上安装docker需要)
docker-ce          Linux、Ubuntu 上安装使用

##########################################################################
1.配置yum源，挂载mount(操作系统为Linux7)
cd /etc/yum.repos.d/
rm -rf  *

cat >  /etc/yum.repos.d/CentOS.repo <<\EOF
# CentOS-Base.repo
[base]
name=CentOS-$releasever - Base - mirrors.aliyun.com
baseurl=http://mirrors.aliyun.com/centos/7/os/$basearch/
gpgcheck=0

[updates]
name=CentOS-$releasever - Updates - mirrors.aliyun.com
baseurl=http://mirrors.aliyun.com/centos/7/updates/$basearch/
gpgcheck=0

[extras]
name=CentOS-$releasever - Extras - mirrors.aliyun.com
baseurl=http://mirrors.aliyun.com/centos/7/extras/$basearch/
gpgcheck=0

# epel.repo
[epel]
name=Extra Packages for Enterprise Linux 7 - $basearch
baseurl=http://mirrors.aliyun.com/epel/7/$basearch
gpgcheck=0
EOF

3.使yum生效
yum clean all # 清除系统所有的yum缓存
yum makeacache # 生成新的yum缓存
yum repolist   #列出yum所有仓库

mount /dev/cdrom /mnt

2.根据阿里云镜像站文档安装
# step 1: 安装必要的一些系统工具
sudo yum install -y yum-utils device-mapper-p******-data lvm2
# Step 2: 添加软件源信息
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
# Step 3
sudo sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
# Step 4: 更新并安装Docker-CE
sudo yum makecache fast
sudo yum -y install docker-ce
# Step 4: 开启Docker服务
sudo service docker start

# 注意：
# 官方软件源默认启用了最新的软件，您可以通过编辑软件源的方式获取各个版本的软件包。
# 例如官方并没有将测试版本的软件源置为可用，您可以通过以下方式开启。同理可以开启各种测试版本等。
# vim /etc/yum.repos.d/docker-ce.repo
#   将[docker-ce-test]下方的enabled=0修改为enabled=1
#
# 安装指定版本的Docker-CE:
# Step 1: 查找Docker-CE的版本:
# yum list docker-ce.x86_64 --showduplicates | sort -r
#   Loading mirror speeds from cached hostfile
#   Loaded plugins: branch, fastestmirror, langpacks
#   docker-ce.x86_64            17.03.1.ce-1.el7.centos            docker-ce-stable
#   docker-ce.x86_64            17.03.1.ce-1.el7.centos            @docker-ce-stable
#   docker-ce.x86_64            17.03.0.ce-1.el7.centos            docker-ce-stable
#   Available Packages
# Step2: 安装指定版本的Docker-CE: (VERSION例如上面的17.03.0.ce.1-1.el7.centos)
# sudo yum -y install docker-ce-[VERSION]
# 如牛哥安装命令:
#  yum install docker-ce-20.10.6 -y

安装校验：

```
[root@ob01 yum.repos.d]# sudo service docker start
```
Redirecting to /bin/systemctl start docker.service
```
[root@ob01 yum.repos.d]# docker version
```
Client: Docker Engine - Community
 Version:           25.0.0
 API version:       1.44
 Go version:        go1.21.6
 Git commit:        e758fe5
 Built:             Thu Jan 18 17:13:17 2024
 OS/Arch:           linux/amd64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          25.0.0
  API version:      1.44 (minimum version 1.24)
  Go version:       go1.21.6
  Git commit:       615dfdf
  Built:            Thu Jan 18 17:12:10 2024
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.6.27
  GitCommit:        a1496014c916f9e62104b33d1bb5bd03b0858e59
 runc:
  Version:          1.1.11
  GitCommit:        v1.1.11-0-g4bccb38
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0

官方文档验证方法:
失败的话使用配置镜像加速器
```
[root@ob01 yum.repos.d]# docker run hello-world
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete
Digest: sha256:4bd78111b6914a99dbc560e6a20eab57ff6655aea4a80c50b0c5491968cbc2e6
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/

##########################################################################
配置镜像加速器
参考:
https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors

sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://ns5o0gq1.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

##########################################################################
提前下载好依赖包

1.修改yum配置文件
vi /etc/yum.conf

cachedir=/var/cache/yum/$basearch/$releasever
keepcache=0

将keepcache改为1
cachedir地址为软件包存放地址

2.使用yum下载依赖包
yum install 依赖包
选择d仅下载
Is this ok [y/d/N]: d

3.docker可以选择wget下载
wget https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-25.0.0-1.el7.x86_64.rpm
