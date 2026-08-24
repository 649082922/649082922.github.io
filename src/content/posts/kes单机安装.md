---
title: kes单机安装
published: 2026-08-19
description: "软件下载:https://www.kingbase.com.cn/download.html"
tags: ["KingbaseES", "实战笔记"]
category: 数据库
draft: false
---

软件下载:https://www.kingbase.com.cn/download.html
安装文档:https://help.kingbase.com.cn/v9/install-updata/install-linux/preface.html
ksql使用:https://help.kingbase.com.cn/v9/admin/reference/ref-ksql/index.html

参考:https://www.modb.pro/doc/124944

一.配置环境
二.预安装工作
三.安装KingbaseES(命令行安装/静默安装)
四.安装后检查
五.卸载KingbaseES

############################################################配置环境############################################################

1.修改内核参数
memTotal=$(grep MemTotal /proc/meminfo | awk '{print $2}')
totalMemory=$((memTotal / 2048))
shmall=$((memTotal / 4))
if [ $shmall -lt 2097152 ]; then
	shmall=2097152
fi
shmmax=$((memTotal * 1024 - 1))
if [ "$shmmax" -lt 4294967295 ]; then
	shmmax=4294967295
fi
cat <<EOF>>/etc/sysctl.conf
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = $shmall
kernel.shmmax = $shmmax
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_max = 1048576
net.core.wmem_default = 262144
fs.aio-max-nr = 6194304
vm.dirty_ratio=20
vm.dirty_background_ratio=3
vm.dirty_writeback_centisecs=100
vm.dirty_expire_centisecs=500
vm.swappiness=10
vm.min_free_kbytes=524288
net.core.netdev_max_backlog = 30000
net.core.netdev_budget = 600
#vm.nr_hugepages =
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
net.ipv4.ipfrag_time = 60
net.ipv4.ipfrag_high_thresh = 8388608
EOF

##生效
sysctl -p

2.修改系统资源限制配置
# 修改login配置
cat >> /etc/pam.d/login <<EOF
session required pam_limits.so
EOF

# 配置用户限制
cat >> /etc/security/limits.conf <<EOF
# *表示所有用户，可只设置root和kingbase用户
* soft nofile 65536
# 注意：设置 nofile 的 hard limit不能大于/proc/sys/fs/nr_open，否则注销后将无法正常登陆
* hard nofile 65535
* soft nproc 65536
* hard nproc 65535
# unlimited表示无限制
* soft core unlimited
* hard core unlimited
EOF

3.RemoveIPC参数修改(官档只提了这一种,还有很多服务根据实际情况关吧~)
systemd-logind服务中引入的一个特性，是当一个用户退出系统后，会删除所有有关的IPC对象。
该特性由 /etc/systemd/logind.conf 文件中的 RemoveIPC 参数控制。某些操作系统会默认打开，
会造成程序信号丢失等问题（只有redhat7及以上和一些特殊的国产Linux的版本需要修改，改之前可先查看此项是否为默认yes)。
设置RemoveIPC=no。 设置后重启服务：
systemctl status systemd-logind.service
systemctl daemon-reload
systemctl restart systemd-logind.service

4.关闭防火墙和SELinux
chkconfig NetworkManager off
systemctl list-unit-files|grep firewalld
systemctl status firewalld
systemctl disable firewalld
systemctl stop firewalld

setenforce Permissive
setenforce 0
sed -i "/^SELINUX=/s#enforcing#disabled#" /etc/selinux/config
cat /etc/selinux/config

5.修改主机名
hostnamectl --static set-hostname kes_V9R2C13

echo '192.168.81.108  kes_V9R2C13'>> /etc/hosts

echo 'DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.81.108
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens33

############################################################预安装工作############################################################
1.建安装用户(这里用的麒麟os,\是转义符号)
useradd -m kingbase
newgrp kingbase
echo "kes#1111" | passwd --stdin kingbase

2.磁盘挂载,创建目录
1>查看挂载磁盘
df -hT
lsblk
fdisk -l

2>创建磁盘
#建物理卷
pvcreate /dev/vdc
pvcreate /dev/vdd
#建卷组
vgcreate king_datavg  /dev/vdc
#扩展物理卷
vgextend king_datavg  /dev/vdd
#创建逻辑卷
lvcreate -L（指定大小）number（M,G） -n king_softlv king_datavg --stripes=1 --stripesize=128
lvcreate -L（指定大小）number（M,G） -n king_datalv king_datavg --stripes=1 --stripesize=128

4>格式化磁盘
mkfs.xfs /dev/king_datavg/king_softlv
mkfs.xfs /dev/king_datavg/king_datalv

5>挂载目录
mkdir -p /KingbaseES /king_data /king_archive /backup
mount /dev/king_datavg/king_softlv /KingbaseES
mount /dev/king_datavg/king_datalv /king_data
mkdir -p /KingbaseES/V9

echo "mount /dev/king_datavg/king_softlv /KingbaseES" >>/etc/rc.local
echo "mount /dev/king_datavg/king_datalv /king_data" >>/etc/rc.local

6>授权
chown -R kingbase:kingbase /KingbaseES
chown -R kingbase:kingbase /king_data
chown -R kingbase:kingbase /king_archive
chown -R kingbase:kingbase /backup
chmod -R 775 /KingbaseES
chmod -R 775 /king_archive
chmod -R 775 /backup
chmod -R 700 /king_data
ls -l /| grep kingbase

3.安装包的挂载
#软件上传到/KingbaseES
mkdir /KingbaseES_V9
mount /KingbaseES/KingbaseES_V009R002C013B0005_Lin64_install.iso /KingbaseES_V9

#解压许可证
unzip /KingbaseES/license_企业版.zip
https://www.kingbase.com.cn/download.html#authorization?authorcurrV=V9R1C10

4.环境变量
cat >> /home/kingbase/.bash_profile << "EOF"
################add#########################
umask 022
export LANG=zh_CN.UTF-8
export KING_BASE=/KingbaseES/V9
export KING_HOME=$KING_BASE/kingbase/Server
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
export LD_LIBRARY_PATH=$KING_HOME/lib:/lib:/usr/lib
export PATH=/usr/sbin:$PATH
export PATH=$KING_HOME/bin:$LD_LIBRARY_PATH:$PATH
EOF

############################################################安装KingbaseES############################################################
安装方法有: 图形化安装 、 命令行安装 和 静默安装 方式在Linux系统中安装KingbaseES

############################################################命令行安装##########################################################

1.切换用户执行安装脚本
su - kingbase
cd /KingbaseES_V9

#图形页面安装
export DISPLAY=192.168.81.1:0.0
sh setup.sh -i swing      #图形化安装,不加参数默认图形化安装,无法使用图形化会直接退回到命令行安装
sh setup.sh -i console    #命令行安装

2.选择
如果要回到前一屏幕进行更改，可输入“back”。
如果要取消本次安装，可随时输入“quit”。

--完全安装(与定制安装配置全选一样)
--定制安装后直接回车下一步

--许可证路径:/KingbaseES/license_41248/license_41248_0.dat
--软件安装路径:/KingbaseES/V9/kingbase

3.确认信息
在继续执行前请检查以下信息：

产品名：
    KingbaseES V9

安装文件夹：
    /KingbaseES/V9/kingbase

产品功能部件：
    数据库服务器,
    接口,
    数据库部署工具,
    高可用组件,
    数据库开发管理工具,
    数据迁移工具

安装空间磁盘信息
    所需磁盘空间： 5378 MB(v8只有820M)           空闲磁盘空间： 33243 MB

4.数据目录
/king_data

5.设置如下初始化数据库参数：
--默认端口为:54321（可自定义）
--默认账户为:system（可自定义）
--密码（自定义）                           #这里密码是system和账户一样，必须手输，不能复制粘贴
--默认字符集编码为：UTF8（可选 default、GBK、GB2312、GB18030）
--区域，可选值将随字符集编码选项发生变动。
    当字符集编码为 default 时，默认区域值为：default（可选 C）
    当字符集编码为 UTF8 时，默认区域值为：zh_CN.UTF-8（可选 en_US.UTF-8、C）
    当字符集编码为 GBK 时，默认区域值为：zh_CN.GBK（可选 C）
    当字符集编码为 GB2312 时，默认区域值为：zh_CN.GB2312（可选 C）
    当字符集编码为 GB18030 时，默认区域值为：zh_CN.GB18030（可选 C）
--默认数据库兼容模式为：ORACLE（可选 PG、MySQL）V8没有mysql
--默认大小写敏感为：是（可选否）
--默认数据块大小为：8k（可选16k、32k）
--默认身份认证方法为scram-sha-256（可选 scram-sm3，sm4，sm3）

有关数据库初始化参数，详情可见《KingbaseES服务器应用参考手册》第2章:
https://help.kingbase.com.cn/v9/admin/reference/ref-server/preface.html#id2

6.执行root.sh注册服务
切换到root用户
#运行${安装目录}/install/script/root.sh
/KingbaseES/V9/kingbase/install/script/root.sh

7.启停数据库
如果想启动或停止数据库服务，进入${安装目录}/Server/bin目录执行如下命令：
cd /KingbaseES/V9/kingbase/Server/bin
#启动服务
#./sys_ctl -w start -D ${Data文件目录} -l "${Data文件目录}/sys_log/startup.log"
./sys_ctl -w start -D /king_data -l "/king_data/sys_log/startup.log"
#停止服务
#./sys_ctl stop -m fast -w -D ${Data文件目录}
./sys_ctl stop -m fast -w -D /king_data

-m选项
smart        等待会话关机,相当于 normal
fast         强制中断会话回滚事物关机,相当于 immediate（默认）
immediate    强制关机,相当于 abort

############################################################静默安装############################################################
静默安装模式下，安装程序通过读取配置文件来安装数据库。安装包iso文件挂载后，setup目录下已存在silent.cfg模板文件，
您需要根据实际安装机器的情况修改参数值。因为Linux挂载iso目录为只读，需要拷贝setup/silent.cfg文件到另外的目录进行修改。

1.cp配置文件
cp /KingbaseES_V9/setup/silent.cfg /KingbaseES/V9/silent.cfg

2.修改配置文件的参数
序号  参数名                    默认值                说明
1     CHOSEN_INSTALL _SET       Full                  选择安装集，可选值包括：
                                                      1）Full，完全安装
                                                      2）Client，客户端安装
                                                      3）Custom，定制安装

2     CHOSEN_FEATURE _LIST      SERVER,               选择安装特性，CHOSEN_INSTALL_SET=Custom起作用。可选值：
                                MANAGER,              1）SERVER，服务器
                                KDTS,                 2）KSTUDIO，数据库开发管理工具
                                DEPLOY,               3）KDTS，数据库迁移工具
                                INTERFACE,            4）DEPLOY，数据库部署工具
                                KINGBASEHA            5）INTERFACE，接口
                                                      6）KINGBASEHA，高可用组件 多值用逗号分隔。大小写不敏感。如果是错误的组件名称则忽略。

3     KB_LICENSE_PATH                                 授权文件的绝对路径，如果指定该参数，就会选择用户指定的 license文件；
                                                      如果未指定，则会使用软件自带试用版授权， 请在有效期内及时更换正式授权文件。

4     USER_INSTALL_DIR          /opt/KingbaseES/V9   安装目录绝对路径，必须指定，否则报错退出安装过程。 路径分隔符使用'/'。

5     USER_SELECTED _DATA_FOLDER                      数据目录绝对路径，必须为空目录，否则报错退出安装过程。
                                                      如果不指定数据目录，默认为安装路径下data目录。

6     DB_PORT                   54321                 数据库服务端口，必填，端口取值范围为1-65535。 否则报错退出安装过程。

7     DB_USER                   system                数据库默认用户名，必填，长度不超过63字符。 否则报错退出安装过程。

8     DB_PASS                                         数据库初始密码，必填，否则报错退出安装过程。无长度限制。

9     DB_PASS2                                        确认数据库初始密码，需要和DB_PASS一致，否则报错退出安装过程。

10    ENCODING_PARAM            UTF8                  数据库字符集，必填，大小写敏感，否则报错退出安装过程。可选值
                                                      1) default 2）UTF8 3）GBK 4）GB2312 5）GB18030

11    DATABASE_MODE _PARAM      ORACLE                数据库兼容模式，必填，大小写敏感，否则报错退出安装过程。 可选值
                                                      1）ORACLE 2）PG 3) MySQL

12    LOCALE_PARAM                                    当字符集编码为 default 时，默认区域值为：default（可选 C）
                                                      当字符集编码为 UTF8 时，默认区域值为：zh_CN.UTF-8 （可选 en_US.UTF-8、C）
													  当字符集编码为GBK 时，默认区域值为：zh_CN.GBK（可选 C）
													  当字符集编码为GB2312时，默认区域值为：zh_CN.GB2312（可选 C）
													  当字符集编码为GB18030时，默认区域值为：zh_CN.GB18030（可选 C）

13    CASE_SENSITIVE _PARAM     YES                   数据库是否区分大小写，必填，大小写敏感，否则报错退出安装过 程。可选值
                                                      1）YES 2）NO

14    BLOCK_SIZE _PARAM         8k                    存储块大小，必填，大小写敏感，否则报错退出安装过程。可选值
                                                      1）8k 2）16k 3）32k

15    AUTHENTICATION_ METHOD_PARAM  scram-sha-256     默认身份认证方法为scram-sha-256（可选 scram-sm3，sm4，sm3）

16    INITCUSTOM                                      自定义参数，作为初始化数据库的参数，选填
                                                      注意：输入的参数值不能包含-W，--pwprompt，%和$。
													  如果输入的参数值包含-c，则启动数据库将使用默认端口值54321。

3.启动安装
修改完配置文件后，进入安装程序所在目录，以kingbase用户执行如下命令：
#./setup.sh -i silent -f ${配置文件路径}
cd /KingbaseES_V9
./setup.sh -i silent -f /KingbaseES/V9/silent.cfg

4.查看安装结果
安装程序退出之后，如果没有正确安装，
在${安装目录}/install/Logs下打开文件名如KingbaseES_V9_安装_*.log的日志文件排查错误原因。
如果有如下信息，则silent.cfg文件中参数取值有错误，未完成安装过程。需要修改后重新执行。
ERROR:XXXXX
ERROR:XXXXX
The install process will be cancelled. Please modify the params and retry.

############################################################安装后检查############################################################

1.检查日志
${安装目录}/Logs目录下
cd /KingbaseES/V9/kingbase/install/Logs
```
[kingbase@bogon Logs]$ ll
```
总用量 3300
-rwxr-xr-x 1 kingbase kingbase 2976665 10月 24 20:20 KingbaseES_V9_安装_10_24_2024_20_02_06.log
-rw-rw-r-- 1 kingbase kingbase   11346 10月 24 20:02 ln.log
-rw-rw-r-- 1 kingbase kingbase  191978 10月 24 20:20 postinstaller_debug.txt
-rw-rw-r-- 1 kingbase kingbase  195149 10月 24 20:02 preinstaller_debug.txt

应该是这个:KingbaseES_V9_安装_10_24_2024_20_02_06.log
官档的"install.log"没找到

2.验证工具是否能连接数据库
ksql -p 54321 -U system test

3.检查数据库版本
kingbase -V

4.解决缺库问题
如果安装机器操作系统缺少必要的so库文件，您可通过如下命令查看到有缺少so库文件的情况。在${安装目录}/Server/bin目录下执行：
cd /KingbaseES/V9/kingbase/Server/bin
ldd * | grep "not found"
在${安装目录}/Server/lib下,执行如下命令检查是否存在缺少的so库文件：
cd /KingbaseES/V9/kingbase/Server/lib
ls
若检查到${安装目录}/Server/lib下存在缺少的so库文件，则在${安装目录}/Server/lib下,执行
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:`pwd`

############################################################卸载KingbaseES############################################################

1.删除数据库服务
运行${安装目录}/install/script/rootuninstall.sh
/KingbaseES/V9/kingbase/install/script/rootuninstall.sh

2.卸载软件
#执行了就只有删除成功和删除失败两种情况,没有确认键,慎用
su - kingbase
cd /KingbaseES/V9/kingbase/Uninstall
sh Uninstaller -i swing      #图形化卸载,不加参数默认图形化卸载,无法使用图形化会直接退回到命令行安装
sh Uninstaller -i console    #命令行卸载

3.根本删除
对于初始化生成的文件或程序运行中生成的文件，卸载过程当中无法自动删除
rm -rf /KingbaseES/V9/kingbase
rm -rf /king_data
