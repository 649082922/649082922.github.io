---
title: PostgreSQL安装
published: 2023-12-18
description: "echo 'DEVICE=ens33"
tags: ["PostgreSQL", "实战笔记"]
category: 数据库
draft: false
---

官网
https://www.postgresql.org/ftp/source/

查看ip修改ip
ifconfig -a

echo 'DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.81.150
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens33

service network restart

###############################################################################################

1、环境准备
2、软件包下载
3、创建用户
4、创建相关目录
5、配置用户环境变量
6、源码安装
7、初始化数据库
8、配置参数
9、启动数据库
10、维护操作
1、环境准备
操作系统配置参照 linux系统安装

1、环境准备
1.编辑/etc/hosts
192.168.81.150 PostgreSQL

2.设置字符集
echo "export LANG=en_US.UTF8" >> ~/.bash_profile
cat ~/.bash_profile
source ~/.bash_profile

3.挂盘,装依赖
mount /dev/cdrom /mnt

配置yum文件参数
cd /etc/yum.repos.d
mkdir bk
mv *.repo bk/

yum list

echo "[EL7]" >> itpux.repo
echo "name = linux 7.6 dvd" >> itpux.repo
echo "baseurl=file:///mnt" >> itpux.repo
echo "gpgcheck=0" >> itpux.repo
echo "enabled=1" >> itpux.repo

安装PostgreSQL依赖包
yum install -y cmake make gcc zlib gcc-c++ perl readline readline-devel zlib zlib-devel perl python36 tcl openssl ncurses-devel openldap pam \
numactl

4.修改系统参数
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "fs.aio-max-nr = 1048576" >> /etc/sysctl.conf
echo "fs.file-max = 6815744" >> /etc/sysctl.conf
echo "net.ipv4.ip_local_port_range = 9000 65500" >> /etc/sysctl.conf
echo "net.core.rmem_default = 262144" >> /etc/sysctl.conf
echo "net.core.rmem_max = 4194304" >> /etc/sysctl.conf
echo "net.core.wmem_default = 262144" >> /etc/sysctl.conf
echo "net.core.wmem_max = 1048586" >> /etc/sysctl.conf
echo "kernel.shmmax = 1288490188" >> /etc/sysctl.conf
echo "kernel.shmall = 314572" >> /etc/sysctl.conf
echo "kernel.shmmni = 4096" >> /etc/sysctl.conf
echo "kernel.sem = 4096 2147483647 2147483646 512000" >> /etc/sysctl.conf

sysctl -p

kernel.shmmax = 1288490188 --1.2g的意思

echo "* - nproc unlimited" > /etc/security/limits.d/90-nproc.conf
echo "session required pam_limits.so" >> /etc/pam.d/login
cat /etc/pam.d/login

5.配置用户限制
echo "* soft nproc unlimited" >> /etc/security/limits.conf
echo "* hard nproc unlimited" >>/etc/security/limits.conf
echo "* soft nofile 16384" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
echo "* soft stack unlimited" >> /etc/security/limits.conf
echo "* hard stack unlimited" >> /etc/security/limits.conf

6.关闭透明大页，numa
vi /etc/default/grub
GRUB_CMDLINE_LINUX="crashkernel=auto rhgb quiet numa=off transparent_hugepage=never"

--原来是这样的
GRUB_CMDLINE_LINUX="crashkernel=auto rd.lvm.lv=centos/root rd.lvm.lv=centos/swap rhgb quiet"

然后执行:
grub2-mkconfig -o /etc/grub2.cfg
numastat                                ###yum没有这个包
numactl --show
numactl --hardware

systemctl set-default multi-user.target
systemctl get-default

关闭SELINUEX
vi /etc/selinux/config
SELINUX=disabled
执行
setenforce 0

7.关防火墙
systemctl status firewalld.service
systemctl stop firewalld.service
systemctl disable firewalld.service

rm -rf /etc/security/limits.d/20-nproc.conf

8.创建用户
groupadd -g 60000 pgsql
useradd -u 60000 -g pgsql pgsql
echo "pgsql"|passwd --stdin pgsql

9.创建相关目录
mkdir  -p /postgresql/{pgdata,archive,scripts,backup,pg15,soft}
chown -R pgsql:pgsql   /postgresql
chmod -R 775  /postgresql

10.配置用户环境变量
export LANG=en_US.UTF8
export PS1="[`whoami`@`hostname`:"'$PWD]$'
export PGPORT=5432
export PGDATA=/postgresql/pgdata
export PGHOME=/postgresql/pg15
export LD_LIBRARY_PATH=$PGHOME/lib:/lib64:/usr/lib64:/usr/local/lib64:/lib:/usr/lib:/usr/local/lib:$LD_LIBRARY_PATH
export PATH=$PGHOME/bin:$PATH:.
export DATE=`date +"%Y%m%d%H%M"`
export MANPATH=$PGHOME/share/man:$MANPATH
export PGHOST=$PGDATA
export PGUSER=postgres
export PGDATABASE=postgres

11.软件包下载
选择源码安装   postgresql-15.4.tar.gz
https://www.postgresql.org/ftp/source/

将软件传到
/postgresql/soft
chmod -R 775  /postgresql/soft

6、源码安装
cd /postgresql/soft/
 tar -zxvf postgresql-15.4.tar.gz
 cd postgresql-15.4
 ./configure --prefix=/postgresql/pg15 --without-readline
 make
 make install

or

gmake world
gmake install-world  一次性将文档及附加模块全部进行编译和安装，推荐

#--without-redline 不支持上下翻页，查看历史命令

7、初始化数据库
su - pgsql
/postgresql/pg15/bin/initdb -D /postgresql/pgdata -E UTF8 --locale=en_US.utf8 -U postgres

打印结果如下
The files belonging to this database system will be owned by user "pgsql".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.utf8".
The default text search configuration will be set to "english".

Data page checksums are disabled.

fixing permissions on existing directory /postgresql/pgdata ... ok
creating subdirectories ... ok
selecting dynamic shared memory implementation ... posix
selecting default max_connections ... 100
selecting default shared_buffers ... 128MB
selecting default time zone ... Asia/Shanghai
creating configuration files ... ok
running bootstrap script ... ok
performing post-bootstrap initialization ... ok
syncing data to disk ... ok

initdb: warning: enabling "trust" authentication for local connections
initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.

Success. You can now start the database server using:

    /postgresql/pg15/bin/pg_ctl -D /postgresql/pgdata -l logfile start

8、配置参数

vi  /postgresql/pgdata/postgresql.conf
listen_addresses = '*'                                       ##监听ip地址,默认是localhost,'*'为对所有人
port = 5432                                                  ##端口号
max_connections = 1000                                       ##最大连接数
logging_collector = on                                       ##开启日志收集功能
log_directory = 'pg_log'                                     ##日志会放在/postgresql/pgdata/pg_log
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log               ##日志格式
log_truncate_on_rotation = on                                ##相同的文件名截断掉
shared_buffers = 1024MB                                      ##共享缓冲区

vi  /postgresql/pgdata/pg_hba.conf
host all all 0.0.0.0/0 md5

从上倒下依次匹配，匹配到就不继续向下读取了
如果拒绝某一ip，要先写这个ip，然后下一行写这个网段（先匹配到了拒绝，就不会向下了）

9、启动数据库

pg_ctl start
pg_ctl stop

如果没有环境变量需要写绝对路径
/postgresql/pg15/bin/pg_ctl -D /postgresql/pgdata/ -l logfile start
-l日志写道文件中，不打屏幕

关闭可以 加参数
pg_ctl stop -ms
-ms  等待会话主动断开
-mf  相当于oracle shu immediate  默认
-mi   相当于断电

设置开机启动
/etc/systemd/system/postgresql.service
[Unit]
Description=PostgreSQL database server
Documentation=man:postgres(1)

[Service]
Type=notify
User=pgsql
ExecStart= /postgresql/pg15/bin/postgres -D /postgresql/pgdata
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutSec=0

[Install]
WantedBy=multi-user.target

然后执行命令
chmod 644 /etc/systemd/system/postgresql.service
systemctl enable postgresql
systemctl    start  postgresql
systemctl  status postgresql

or
https://www.cnblogs.com/guoxiangyue/p/10956600.html
PostgreSQL的开机自启动脚本位于PostgreSQL源码目录的contrib/start-scripts路径下
Linux下设置postgresql数据库开机启动 - Aiden郭祥跃 - 博客园 (cnblogs.com)

10、维护操作
修改postgres 密码
防火墙配置了任何地址连接都要密码，除了127
psql -h 127.0.0.1 -p 5432

postgres=# \password postgres

Enter new password=****** it again:

or
alter user postgres  with password 'xxxx'
