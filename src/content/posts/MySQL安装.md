---
title: MySQL安装
published: 2024-06-09
description: "通过MySQL release notes 查看每个小版本的bug"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

官网下载路径
https://dev.mysql.com/downloads/mysql
https://downloads.mysql.com/archives/community/
通过MySQL release notes 查看每个小版本的bug

MySQLadmin介绍
https://www.cnblogs.com/dadonggg/p/8625500.html

安装参考
https://cloud.tencent.com/developer/article/1863236

1.源码包(选Red Hat Enterprise Linux /Oracle Linux)
源代码,编译,链接,二进制可执行文件

2.二进制安装包(选Linux -Generic)
直接解压使用

######################################安装准备######################################

1.关闭SELinux和防火墙
setenforce Permissive
setenforce 0
sed -i "/^SELINUX=/s#enforcing#disabled#" /etc/selinux/config
cat /etc/selinux/config

chkconfig NetworkManager off
#linux6
service iptables stop
service ip6tables stop
chkconfig iptables off
chkconfig ip6tables off

#linux7
systemctl list-unit-files|grep firewalld
systemctl status firewalld
systemctl disable firewalld
systemctl stop firewalld

2.修改hosts
vi /etc/hosts

3.卸载自带mariadb和mysql
检查系统是否安装mysql：rpm -qa | grep mysql
如果有则强制卸载：rpm -e --nodeps $(rpm -qa | grep mysql)

检查系统是否安装mariadb：rpm -qa | grep mariadb
如果有则强制卸载：rpm -e --nodeps $(rpm -qa | grep mariadb)

4.安装依赖包
##挂载镜像源
mount /dev/cdrom /mnt
##配置yum源
cat <<EOF>>/etc/yum.repos.d/local.repo
[local]
name=local
baseurl=file:///mnt
gpgcheck=0
enabled=1
EOF
##安装依赖包
yum -y groupinstall "Development tools"
yum -y install ncurses ncurses-devel openssl-devel bison gcc gcc-c++ make libaio wget
手动安装
yum install ncurses-compat-libs

5.创建组,用户
groupadd mysql
useradd -r -g mysql
#部分系统
useradd -g mysql mysql

6.创建目录,解压MySQL的tar包,授权
mkdir /soft
tar -zxvf mysql-5.7.35-linux-glibc2.12-x86_64.tar.gz -C /soft
##mv /soft/mysql-5.7.35-linux-glibc2.12-x86_64 mysql  #做不做都行
###mysql8.0.30是tar -xvf解压,结尾是.tar.xz

chown -R mysql:mysql /soft

######################################环境初始化######################################
初始化为平行初始化标准

1.创建mysql数据目录
#停止mysql服务
service mysqld stop
#创建目录
mkdir -p /mysql/mysqldata/
cd /mysql/mysqldata/
ls -lrt
#删除旧目录
rm -rf /mysql/mysqldata/*
#创建新目录
mkdir binlog
mkdir innodb_log
mkdir innodb_ts
mkdir innodb_undo
mkdir log
mkdir mydata
mkdir redolog_arch
mkdir relaylog
mkdir sock
mkdir tmpdir
chown -R mysql:mysql /mysql/mysqldata
ls -lrt

2.配置my.cnf文件
vi /etc/my.cnf
直接用写好的

3.配置软连接,环境变量
#查看当前my.cnf文件中数据库软件路径地址
cat /etc/my.cnf|grep basedir
#修改软链接地址
unlink /usr/local/mysql
ln -s /soft/mysql-8.0.33-linux-glibc2.12-x86_64 /usr/local/mysql
#新环境添加环境变量
vim ~/.bash_profile
export PATH=$PATH:/usr/local/mysql/bin
source ~/.bash_profile

4.初始化mysql数据库
/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf --initialize-insecure --user=mysql
#查看初始化过程中有误error报错
tail -100f /mysql/mysqldata/log/error.log
-initialize:初始化实例
-insecure:密码不会保存存在error.log,需要手动设置

5.尝试登陆数据库
#使用mysql守护进程脚本mysqld_safe,指定my.cnf参数启动服务
sh /usr/local/mysql/bin/mysqld_safe --defaults-file=/etc/my.cnf > /tmp/mysql_start.log &
#关库(回退)
$MYSQL_HOME/bin/mysqladmin -uroot -p'xxxx' -S /app/mysql/data/3306/mysqld.sock   shutdown

#通过socket套接字mysql.sock登陆数据库
/usr/local/mysql/bin/mysql -S /mysql/mysqldata/sock/mysql.sock

6.修改密码授权
###MySQL5.7###
set password=******"123123");
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;

###MySQL8.0###
alter user user() identified by "123123";
-- 以下命令安装单机版本的MYSQL数据库，如果要安装MGR的话，则不要执行下面命令
#这里创建的root不是mysql的root,是可以对外连接的root
CREATE USER 'root'@'%' IDENTIFIED BY 'root';
grant all privileges on *.* to 'root'@'%' WITH GRANT OPTION;

-- 命令刷新权限
flush privileges;
-- 查看权限
show grants for 'root'@'%';

7.设置免密
#通过socket套接字mysql.sock设置MySQL免密登陆
mysql_config_editor set --login-path=dba --user=root --socket=/mysql/mysqldata/sock/mysql.sock --port=3306 --password
mysql --login-path=dba -A

8.设置mysql服务
#手动启动mysql服务(一般通过mysqld_safe守护进程启动)
/soft/mysql/support-files/mysql.server start
#设置为开机自启动linux6&7通用
cp -af /soft/mysql/support-files/mysql.server /etc/init.d/mysqld

9.修改mysqld配置
vi /etc/init.d/mysqld

basedir=/soft/mysql                                     #which mysql查看软件路径
datadir=/mysql/mysqldata/mydata                         #my.conf中的datadir

###控制文件路径默认路径：/etc/my.cnf，因此，如果不使用/etc/my.cnf还需要改其他位置（没改成功。。。）
conf=/data/mysql/conf/my.cnf                            #控制文件不是/etc/my.conf改成实际路径
mysqld_pid_file_path=/mysql/mysqldata/sock/mysql.pid    #my.conf中的pid-file路径

#将mysqld_safe启动参数替换
$bindir/mysqld_safe --datadir="$datadir --pid-file="$mysqld_pid_file_path" $other_args > /dev/null &
替换如下(\太长了，实际不换行)：
/usr/local/mysql/bin/mysqld_safe --defaults-file=/etc/my.cnf \
--basedir=/usr/local/mysql --datadir=/mysql/mysqldata/mydata --user=mysql > /tmp/mysql_start.log &

#配置完之后就可以用 server mysqld start 启动mysql服务
/etc/init.d/mysqld start

######################################报错处理######################################
[ERROR] [MY-010326] [Server] Fatal error: Can't open and lock privilege tables: Table 'mysql.user' doesn't exist
删除目录,重建目录,重新初始化解决

[ERROR] [MY-000067] [Server] unknown variable 'innocb_monitor_enable=module_log'.
my.cnf变量错误
