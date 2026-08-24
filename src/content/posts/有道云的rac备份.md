---
title: 有道云的rac备份
published: 2025-01-10
description: "19c主节点内存8G,次节点4G"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

19c主节点内存8G,次节点4G
1.配置ip
#节点1
echo 'DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.81.191
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens33

echo 'DEVICE=ens34
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.19.191
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens34

#节点2
echo 'DEVICE=ens33
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.81.192
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens33

echo 'DEVICE=ens34
TYPE=Ethernet
ONBOOT=yes
BOOTPROTO=none
IPADDR=192.168.19.192
NETMASK=255.255.255.0
PREFIX=24'> /etc/sysconfig/network-scripts/ifcfg-ens34

# 调整network(两个节点执行)
service network restart

# 调整network(两个节点执行)
echo "NOZEROCONF=yes"  >>/etc/sysconfig/network && cat /etc/sysconfig/network
删除virbr0
#手动关闭virbr0网卡
ifconfig virbr0 down
#将libvirtd服务开机自启动关闭
systemctl disable libvirtd.service
#重启
reboot
虚拟机网卡名称混乱修改
vim /etc/udev/rules.d/70-p******-net.rules网卡和网络接口的映射关系
start_udev重新扫描设备并产生对应关系

2.双节点修改主机名
#节点1
hostnamectl --static set-hostname rac19c1
#节点2
hostnamectl --static set-hostname rac19c2
3.调整hosts文件
echo '#public ip
192.168.81.191  rac19c1
192.168.81.192  rac19c2
#private ip
192.168.19.191  rac19c1-priv
192.168.19.192  rac19c2-priv
#vip
192.168.81.91  rac19c1-vip
192.168.81.92  rac19c2-vip
#scanip
192.168.81.19   rac19c-cluster-scan1'>> /etc/hosts
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
5.配置软件yum源
cd /etc/yum.repos.d/
rm -rf  *
cat <<EOF>>/etc/yum.repos.d/rhel-source.repo
[local]
name=local
baseurl=file:///mnt
gpgcheck=0
enabled=1
EOF
6.挂盘,安装软件包
mount /dev/cdrom /mnt
yum groupinstall -y "Server with GUI"
yum install -y bc gcc gcc-c++  binutils  make gdb cmake  glibc ksh \
elfutils-libelf elfutils-libelf-devel fontconfig-devel glibc-devel  \
libaio libaio-devel libXrender libXrender-devel libX11 libXau sysstat \
libXi libXtst libgcc librdmacm-devel libstdc++ libstdc++-devel libxcb \
net-tools nfs-utils compat-libcap1 compat-libstdc++  smartmontools  \
targetcli python python-configshell python-rtslib python-six \
unixODBC unixODBC-devel e2fsprogs e2fsprogs-libs expect \
openssh-clients readline* tigervnc* psmisc --skip-broken

由于RHEL7 缺失compat-libstdc+±33包，需要单独下载安装
下载链接
http://www.rpmfind.net/linux/rpm2html/search.php?query=Compat-libstdc&submit=Search+...&system=&arch=
rpm -ivh compat-libstdc++-33-3.2.3-72.el7.x86_64.rpm

scp /tmp/compat-libstdc++-33-3.2.3-72.el7.x86_64.rpm  root@192.168.81.192:/tmp

rpm -ivh /tmp/compat-libstdc++-33-3.2.3-72.el7.x86_64.rpm
#检查依赖包
rpm -q bc binutils compat-libcap1 compat-libstdc++-33 gcc gcc-c++ elfutils-libelf elfutils-libelf-devel glibc glibc-devel ksh libaio libaio-devel libgcc libstdc++ libstdc++-devel libxcb libX11 libXau libXi libXtst libXrender libXrender-devel make net-tools nfs-utils smartmontools sysstat e2fsprogs e2fsprogs-libs fontconfig-devel expect unzip openssh-clients readline | grep "not installed"
7.增加组、用户、目录
groupadd -g 54321 oinstall
groupadd -g 54322 dba
groupadd -g 54323 oper
groupadd -g 54324 backupdba
groupadd -g 54325 dgdba
groupadd -g 54326 kmdba
groupadd -g 54327 asmdba
groupadd -g 54328 asmoper
groupadd -g 54329 asmadmin
groupadd -g 54330 racdba

useradd -g oinstall -G dba,oper,backupdba,dgdba,kmdba,asmdba,racdba -u 10000 oracle
useradd -g oinstall -G dba,asmdba,asmoper,asmadmin,racdba -u 10001 grid

echo "oracle" | passwd --stdin oracle
echo "grid" | passwd --stdin grid

mkdir -p /u01/app/19.3.0/grid
mkdir -p /u01/app/grid
mkdir -p /u01/app/oracle/product/19.3.0/dbhome_1
chown -R grid:oinstall /u01
chown -R oracle:oinstall /u01/app/oracle
chmod -R 775 /u01/
8.修改环境变量
#节点1
cat >> /home/grid/.bash_profile << "EOF"
################add#########################
umask 022
export DISPLAY=192.168.81.1:0.0
export TMP=/tmp
export TMPDIR=$TMP
export ORACLE_BASE=/u01/app/grid
export ORACLE_HOME=/u01/app/19.3.0/grid
export TNS_ADMIN=$ORACLE_HOME/network/admin
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export ORACLE_SID=+ASM1
export PATH=/usr/sbin:$PATH
export PATH=$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$PATH
alias sas='sqlplus / as sysasm'
export PS1="[\`whoami\`@\`hostname\`:"'$PWD]\$ '
EOF

cat >> /home/oracle/.bash_profile << "EOF"
################ add#########################
umask 022
export DISPLAY=192.168.81.1:0.0
export TMP=/tmp
export TMPDIR=$TMP
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19.3.0/dbhome_1
export ORACLE_HOSTNAME=oracle19c-rac1
export TNS_ADMIN=\$ORACLE_HOME/network/admin
export LD_LIBRARY_PATH=\$ORACLE_HOME/lib:/lib:/usr/lib
export ORACLE_SID=orcl1
export PATH=/usr/sbin:$PATH
export PATH=$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$PATH
alias sas='sqlplus / as sysdba'
export PS1="[\`whoami\`@\`hostname\`:"'$PWD]\$ '
EOF

#节点2
cat >> /home/grid/.bash_profile << "EOF"
################ enmo add#########################
umask 022
export DISPLAY=192.168.81.1:0.0
export TMP=/tmp
export TMPDIR=$TMP
export ORACLE_BASE=/u01/app/grid
export ORACLE_HOME=/u01/app/19.3.0/grid
export TNS_ADMIN=$ORACLE_HOME/network/admin
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export ORACLE_SID=+ASM2
export PATH=/usr/sbin:$PATH
export PATH=$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$PATH
alias sas='sqlplus / as sysasm'
export PS1="[\`whoami\`@\`hostname\`:"'$PWD]\$ '
EOF

cat >> /home/oracle/.bash_profile << "EOF"
################ add#########################
umask 022
export DISPLAY=192.168.81.1:0.0
export TMP=/tmp
export TMPDIR=$TMP
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19.3.0/dbhome_1
export ORACLE_HOSTNAME=oracle19c-rac2
export TNS_ADMIN=\$ORACLE_HOME/network/admin
export LD_LIBRARY_PATH=\$ORACLE_HOME/lib:/lib:/usr/lib
export ORACLE_SID=orcl2
export PATH=/usr/sbin:$PATH
export PATH=$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$PATH
alias sas='sqlplus / as sysdba'
export PS1="[\`whoami\`@\`hostname\`:"'$PWD]\$ '
EOF
9、修改系统参数
#安装 Oracle 数据库需要配置系统参数
##配置参数文件
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
net.core.rmem_default = 16777216
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.wmem_default = 16777216
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
net.ipv4.ipfrag_low_thresh=6291456
net.ipv4.ipfrag_high_thresh = 8388608
EOF

##生效
sysctl -p

#系统资源限制配置
# 修改login配置
cat >> /etc/pam.d/login <<EOF
session required pam_limits.so
EOF

# 配置用户限制
cat >> /etc/security/limits.conf <<EOF
grid  soft  nproc  2047
grid  hard  nproc  16384
grid  soft   nofile  1024
grid  hard  nofile  65536
grid  soft   stack  10240
grid  hard  stack  32768

oracle  soft  nproc  2047
oracle  hard  nproc  16384
oracle  soft  nofile  1024
oracle  hard  nofile  65536
oracle  soft  stack  10240
oracle  hard  stack  32768
oracle soft memlock 3145728
oracle hard memlock 3145728
EOF
10.上传grid软件在/tmp，解压缩，配置互信
# 解压缩grid 软件(节点一grid用户)
su - grid
cd /tmp
unzip LINUX.X64_193000_grid_home.zip -d $ORACLE_HOME
exit

root用户执行
/u01/app/19.3.0/grid/oui/prov/resources/scripts/sshUserSetup.sh -user grid  -hosts "rac19C1 rac19C2"  -advanced -exverify –confirm
/u01/app/19.3.0/grid/oui/prov/resources/scripts/sshUserSetup.sh -user oracle  -hosts "rac19C1 rac19C2"  -advanced -exverify –confirm

#互信检查
ssh rac19c1       date
ssh rac19c2       date
ssh rac19c1-priv  date
ssh rac19c2-priv  date
11.检验时间和时区确认正确
date
timedatectl set-timezone Asia/Shanghai
timedatectl status|grep Local
12.chrony服务，移除chrony配置文件（后续使用ctss）
systemctl list-unit-files|grep chronyd
systemctl status chronyd
systemctl disable chronyd
systemctl stop chronyd
mv /etc/chrony.conf /etc/chrony.conf_bak
mv /etc/ntp.conf /etc/ntp.conf_bak
systemctl list-unit-files|grep -E 'ntp|chrony'
13.修改其他参数
# 调整/dev/shm,需要把/dev/shm调整到4G
cp /etc/fstab /etc/fstab_`date +"%Y%m%d_%H%M%S"`
echo "tmpfs    /dev/shm    tmpfs    rw,exec,size=4G    0 0">>/etc/fstab
mount -o remount /dev/shm
df -h

# 关闭THP和numa
# 检查：
cat /sys/kernel/mm/transparent_hugepage/enabled
cat /sys/kernel/mm/transparent_hugepage/defrag

# 修改
sed -i 's/quiet/quiet transparent_hugepage=never numa=off/' /etc/default/grub
grep quiet  /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg

# 不重启生效
echo never > /sys/kernel/mm/transparent_hugepage/enabled
cat /sys/kernel/mm/transparent_hugepage/enabled
14.关闭服务
#关闭avahi服务
systemctl stop    avahi-daemon
systemctl disable avahi-daemon
#关闭其他服务
#禁用开机启动
systemctl disable accounts-daemon.service
systemctl disable atd.service
systemctl disable avahi-daemon.service
systemctl disable avahi-daemon.socket
systemctl disable bluetooth.service
systemctl disable brltty.service
--systemctl disable chronyd.service
systemctl disable colord.service
systemctl disable cups.service
systemctl disable debug-shell.service
systemctl disable firewalld.service
systemctl disable gdm.service
systemctl disable ksmtuned.service
systemctl disable ktune.service
systemctl disable libstoragemgmt.service
systemctl disable mcelog.service
systemctl disable ModemManager.service
--systemctl disable ntpd.service
systemctl disable postfix.service
systemctl disable postfix.service
systemctl disable rhsmcertd.service
systemctl disable rngd.service
systemctl disable rpcbind.service
systemctl disable rtkit-daemon.service
systemctl disable tuned.service
systemctl disable upower.service
systemctl disable wpa_supplicant.service
# 停止服务
systemctl stop accounts-daemon.service
systemctl stop atd.service
systemctl stop avahi-daemon.service
systemctl stop avahi-daemon.socket
systemctl stop bluetooth.service
systemctl stop brltty.service
--systemctl stop chronyd.service
systemctl stop colord.service
systemctl stop cups.service
systemctl stop debug-shell.service
systemctl stop firewalld.service
systemctl stop gdm.service
systemctl stop ksmtuned.service
systemctl stop ktune.service
systemctl stop libstoragemgmt.service
systemctl stop mcelog.service
systemctl stop ModemManager.service
--systemctl stop ntpd.service
systemctl stop postfix.service
systemctl stop postfix.service
systemctl stop rhsmcertd.service
systemctl stop rngd.service
systemctl stop rpcbind.service
systemctl stop rtkit-daemon.service
systemctl stop tuned.service
systemctl stop upower.service
systemctl stop wpa_supplicant.service
15.配置ssh服务

# 配置LoginGraceTime参数为0, 将timeout wait设置为无限制
cp /etc/ssh/sshd_config /etc/ssh/sshd_config_`date +"%Y%m%d_%H%M%S"` && sed -i '/#LoginGraceTime 2m/ s/#LoginGraceTime 2m/LoginGraceTime 0/' /etc/ssh/sshd_config && grep LoginGraceTime /etc/ssh/sshd_config
#加快SSH登陆速度，禁用DNS
cp /etc/ssh/sshd_config /etc/ssh/sshd_config_`date +"%Y%m%d_%H%M%S"` && sed -i '/#UseDNS yes/ s/#UseDNS yes/UseDNS no/' /etc/ssh/sshd_config && grep UseDNS /etc/ssh/sshd_config

16.安装cvuqdisk软件

# 安装cvuqdisk软件(root用户)
cd /u01/app/19.3.0/grid/cv/rpm
export CVUQDISK_GRP=oinstall
rpm -ivh cvuqdisk-1.0.10-1.rpm

# 传输到第 2 个节点上和安装
scp cvuqdisk-1.0.10-1.rpm root@192.168.81.192:/tmp

cd /tmp
export CVUQDISK_GRP=oinstall
rpm -ivh /tmp/cvuqdisk-1.0.10-1.rpm
17.安装前检查
su - grid
cd $ORACLE_HOME
export CVUQDISK_GRP=oinstall
/u01/app/19.3.0/grid/runcluvfy.sh stage -post hwos -n rac19c1,rac19c2 -verbose

18.静默解压补丁安装包：
cd /soft
##解压RU补丁包
chown -R grid:oinstall /soft
su - grid -c "unzip -q -o /soft/p6880880_190000_Linux-x86-64.zip -d /u01/app/19.3.0/grid"
##解压OPatch补丁包
su - grid -c "unzip -q /soft/p32545008_190000_Linux-x86-64.zip -d /soft"
chown -R oracle:oinstall /soft
su - oracle -c "unzip -q -o /soft/p6880880_190000_Linux-x86-64.zip -d /u01/app/oracle/product/19.3.0/db"
