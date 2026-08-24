---
title: yum配置
published: 2024-08-14
description: "基本使用https://www.cnblogs.com/kklinux/p/yum.html"
tags: ["Linux", "实战笔记"]
category: 运维
draft: false
---

基本使用https://www.cnblogs.com/kklinux/p/yum.html

1.进入到指定目录,删除其他配置文件
cd /etc/yum.repos.d
rm -rf *.repo

2.配置yum,两种只配一种
########配置本地yum仓库
vim local.repo

[local]
name=local
baseurl=file:///mnt
gpgcheck=0
enabled=1

mount /dev/cdrom /mnt

########配置网络yum仓库阿里云镜像
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

########配置网络yum仓库2,中国科学技术大学、中国科学技术大学网络信息中心支持
1.配置/etc/yum.repos.d/CentOS-Base.repo
cat > /etc/yum.repos.d/CentOS-Base.repo <<\EOF
[base]
name=CentOS-$releasever - Base
baseurl=http://mirrors.cernet.edu.cn/centos/$releasever/os/$basearch/
gpgcheck=0

[updates]
name=CentOS-$releasever - Updates
baseurl=http://mirrors.cernet.edu.cn/centos/$releasever/updates/$basearch/
gpgcheck=0

[extras]
name=CentOS-$releasever - Extras
baseurl=http://mirrors.cernet.edu.cn/centos/$releasever/extras/$basearch/
gpgcheck=0
EOF

2.配置/etc/yum.repos.d/epel.repo
cat > /etc/yum.repos.d/epel.repo <<\EOF
[epel]
name=Extra Packages for Enterprise Linux 7 - $basearch
baseurl=http://mirrors.cernet.edu.cn/epel/7/$basearch
gpgcheck=0
EOF

3.将$releasever变量改为操作系统版本
sed -i 's/\$releasever/7/' CentOS-Base.repo
