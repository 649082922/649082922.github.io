---
title: redis安装文档
published: 2024-01-22
description: "参考https://blog.csdn.net/2301_77783312/article/details/131159444"
tags: ["Redis", "实战笔记"]
category: 数据库
draft: false
---

软件下载
http://download.redis.io/releases/

##################################Linux##################################

参考https://blog.csdn.net/2301_77783312/article/details/131159444
参考https://blog.csdn.net/xiaoai5324/article/details/118314581

可直接下载软件,或将压缩包上传
# wget http://download.redis.io/releases/redis-5.0.8.tar.gz

1.在/usr/local/目录下创建文件夹redis
cd /usr/local/
mkdir redis

###安装6.0以上版本需要升级gcc到5.3及以上,如下：升级到gcc 9.3：                  #############6.0以上版本!!!!!!!!!!
yum -y install centos-release-scl
yum -y install devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils
scl enable devtoolset-9 bash
需要注意的是scl命令启用只是临时的，退出shell或重启就会恢复原系统gcc版本。
如果要长期使用gcc 9.3的话：
echo "source /opt/rh/devtoolset-9/enable" >>/etc/profile
这样退出shell重新打开就是新版的gcc了

2.上传安装文件redis-5.0.3.tar.gz 到 文件夹 redis下
解压,进入目录成功后make编译
tar -zxvf /tmp/redis-5.0.8.tar.gz
mv /tmp/redis-5.0.8 /usr/local/redis/
cd /usr/local/redis/redis-5.0.8 && make

3.安装Redis软件
编译完成后，就可以进行安装了，安装时可以指定安装的目录，命令如下：
make PREFIX=/usr/local/redis/redis-5.0.8 install

#############功能介绍#############
在编译安装后，/usr/local/redis/redis-5.0.8/bin 目录下有 6 个文件，分别进行一个介绍：
redis-benchmark：Redis 测试工具
redis-check-aof：Redis 的 aof 文件检查工具
redis-check-rdb：Redis 的 rdb 文件检查工具
redis-cli：Redis 的客户端工具
redis-sentinel：Redis 的一个监控工具
redis-server：Redis 的服务端工具

4.安装 Redis 服务配置
/usr/local/redis/redis-5.0.8/utils/install_server.sh
执行后打印以下内容

Welcome to the redis service installer
This script will help you easily set up a running redis server

Please select the redis port for this instance: [6379] ##选择端口号，选择默认，回车继续
一个物理机上面可以启动多个redis，根据端口号区分
Selecting default: 6379
Please select the redis config file name [/etc/redis/6379.conf] ##选择配置文件地址，选择默认，回车继续，配置文件根据端口号区分
Selected default - /etc/redis/6379.conf
Please select the redis log file name [/var/log/redis_6379.log] ##选择日志文件路径，选择默认，回车继续，日志也根据端口号区分
Selected default - /var/log/redis_6379.log
Please select the data directory for this instance [/var/lib/redis/6379] ##选择数据目录，也选择默认，回车继续，
数据目录页是根据端口号区分，虽然redis是内存数据库，但是redis需要持久化，数据就必须要保存到磁盘上面
Selected default - /var/lib/redis/6379
Please select the redis executable path [] /usr/local/redis/redis-5.0.8/bin/redis-server ##选择执行文件，回车继续
这里的执行文件是/usr/local/redis/redis-5.0.8/bin/redis-server

Selected config:
Port           : 6379
Config file    : /etc/redis/6379.conf
Log file       : /var/log/redis_6379.log
Data dir       : /var/lib/redis/6379
Executable     : /usr/local/redis/redis-5.0.8/bin/redis-server
Cli Executable : /usr/local/redis/redis-5.0.8/bin/redis-cli
Is this ok? Then press ENTER to go on or Ctrl-C to abort.
Copied /tmp/6379.conf => /etc/init.d/redis_6379
Installing service...
Successfully added to chkconfig!
Successfully added to runlevels 345!
Starting Redis server...
Installation successful!

5.修改环境变量
# vim /etc/profile
export REDIS_HOME=/usr/local/redis/redis-5.0.8
export PATH=$PATH:$REDIS_HOME/bin
重置生效
source /etc/profile

6.检查运行
通过进程方式查看
ps -fe | grep redis
root       6952      1  0 16:47 ?        00:00:00 /usr/local/redis/redis-5.0.8/bin/redis-server 127.0.0.1:6379

通过服务的方式来进行查看
systemctl status redis_6379
● redis_6379.service - LSB: start and stop redis_6379
   Loaded: loaded (/etc/rc.d/init.d/redis_6379; bad; vendor preset: disabled)
   Active: inactive (dead)
     Docs: man:systemd-sysv-generator(8)

查看服务状态
service redis_6379 status
Redis is running (6952)

7.启停命令
service redis_6379 start                              ##启动redis，端口6379
service redis_6379 stop                               ##停止端口号为6379 的redis
/usr/local/redis/redis-5.0.8/utils/install_server.sh  ##启动多个redis

登陆redis
./redis-cli

#########################另一种方法#########################
1.使用后台进程运行需要修改配置文件redis.conf中的daemonize配置项，将其改为yes
vim /usr/local/redis/redis-5.0.8/redis.conf

2.在src目录下执行redis-server,前台进程启动redis
/usr/local/redis/redis-5.0.8/src/redis-server

7571:C 24 Aug 2023 17:42:16.345 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
7571:C 24 Aug 2023 17:42:16.345 # Redis version=5.0.8, bits=64, commit=00000000, modified=0, pid=7571, just started
7571:C 24 Aug 2023 17:42:16.345 # Warning: no config file specified, using the default config. In order to specify a config file use /usr/local/redis/redis-5.0.8/src/redis-server /path/to/redis.conf
7571:M 24 Aug 2023 17:42:16.345 * Increased maximum number of open files to 10032 (it was originally set to 1024).
                _._
           _.-``__ ''-._
      _.-``    `.  `_.  ''-._           Redis 5.0.8 (00000000/0) 64 bit
  .-`` .-```.  ```\/    _.,_ ''-._
 (    '      ,       .-`  | `,    )     Running in standalone mode
 |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
 |    `-._   `._    /     _.-'    |     PID: 7571
  `-._    `-._  `-./  _.-'    _.-'
 |`-._`-._    `-.__.-'    _.-'_.-'|
 |    `-._`-._        _.-'_.-'    |           http://redis.io
  `-._    `-._`-.__.-'_.-'    _.-'
 |`-._`-._    `-.__.-'    _.-'_.-'|
 |    `-._`-._        _.-'_.-'    |
  `-._    `-._`-.__.-'_.-'    _.-'
      `-._    `-.__.-'    _.-'
          `-._        _.-'
              `-.__.-'

7571:M 24 Aug 2023 17:42:16.345 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
7571:M 24 Aug 2023 17:42:16.345 # Server initialized
7571:M 24 Aug 2023 17:42:16.345 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
7571:M 24 Aug 2023 17:42:16.345 # WARNING you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.
7571:M 24 Aug 2023 17:42:16.345 * Ready to accept connections

##使用后台进程运行需要修改配置文件redis.conf中的 daemonize 配置项，将其改为yes
vim /usr/local/redis/redis-5.0.8/redis.conf

配置项	                    含义
port	                    redis开启的端口
daemonize	                是否以后台方式运行redis
protected-mode	            是否开启保护模式
bind	                    redis绑定的ip
dir	                        redis持久化文件保存的路径，必须是目录
pidfile	                    后台方式运行redis的时候，会产生一个pid文件
appendonly	                是否打开aof持久化
cluster-enabled	            是否开启集群
cluster-config-file	        集群配置文件，此文件在redis启动时生成，由集群自动维护
cluster-node-timeout	    集群节点超时时间
databases                   默认有16个数据库,0-16,默认使用0号数据库

关闭redis命令,仅限于使用redis-server启动进行关闭
pkill -9 redis

######################################启动指定端口######################################
假设现在要搭建1个redis节点，以192.168.64.136为例搭建
1.在/usr/local/redis/目录下创建文件夹7001
cd /usr/local/redis/
mkdir 7001

2.将redis.conf复制到7001目录下
cp /usr/local/redis/redis-5.0.3/redis.conf /usr/local/redis/7001/

3.进入/usr/local/redis/7001/，修改redis.conf配置文件的相关配置项
vim /usr/local/redis/7001/redis.conf

# 修改为后台进程运行
daemonize yes

# 修改redis监听端口
port 7001

# 注释掉bind，这样外部机器可以访问
# bind 127.0.0.1

# 开启持久化
appendonly yes

# 修改持久化地址文件保存目录
dir /usr/local/redis/7001/

# 修改redis客户端登录密码，必须配置密码
requirepass 123123

开放端口 7001, 17001

4.17001是redis集群总线端口。
redis集群总线端口为：客户端端口+10000

# 开放7001端口
firewall-cmd --zone=public --add-port=7001/tcp --permanent
# 开放17001端口
firewall-cmd --zone=public --add-port=17001/tcp --permanent
# 重新加载防火墙规则
firewall-cmd --reload
