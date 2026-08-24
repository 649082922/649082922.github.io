---
title: vm共享磁盘创建
published: 2026-03-08
description: ".vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 F:VMRACdisk11"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

1.共享磁盘
#cmd创建共享磁盘
D:
dir
cd 虚拟机目录
.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gdata01.vmdk"
.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gdata02.vmdk"
.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gdata03.vmdk"

.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gocr01.vmdk"
.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gocr02.vmdk"
.\vmware-vdiskmanager.exe -c -s 5GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Gocr03.vmdk"

.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg01.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg02.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg03.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg04.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg11.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg12.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg13.vmdk"
.\vmware-vdiskmanager.exe -c -s 10GB -a lsilogic -t 2 "F:\VM\RACdisk\11g\share-11Goggdg14.vmdk"

#写入虚拟机的vmx文件中
#shared disks configure 11g
diskLib.dataCacheMaxSize=0
diskLib.dataCacheMaxReadAheadSize=0
diskLib.dataCacheMinReadAheadSize=0
diskLib.dataCachePageSize=4096
diskLib.maxUnsyncedWrites = "0"
disk.locking = "FALSE"
scsi1.sharedBus = "virtual"
scsi1.present = "TRUE"
scsi1.virtualDev = "lsilogic"
scsi1:0.mode = "independent-p******"
scsi1:0.deviceType = "disk"
scsi1:0.present = "TRUE"
scsi1:0.fileName = "F:\VM\RACdisk\11g\share-11Gdata01.vmdk"
scsi1:0.redo = ""
scsi1:1.mode = "independent-p******"
scsi1:1.deviceType = "disk"
scsi1:1.present = "TRUE"
scsi1:1.fileName = "F:\VM\RACdisk\11g\share-11Gdata02.vmdk"
scsi1:1.redo = ""
scsi1:2.mode = "independent-p******"
scsi1:2.deviceType = "disk"
scsi1:2.present = "TRUE"
scsi1:2.fileName = "F:\VM\RACdisk\11g\share-11Gdata03.vmdk"
scsi1:2.redo = ""
scsi1:3.mode = "independent-p******"
scsi1:3.deviceType = "disk"
scsi1:3.present = "TRUE"
scsi1:3.fileName = "F:\VM\RACdisk\11g\share-11Gocr01.vmdk"
scsi1:3.redo = ""
scsi1:4.mode = "independent-p******"
scsi1:4.deviceType = "disk"
scsi1:4.present = "TRUE"
scsi1:4.fileName = "F:\VM\RACdisk\11g\share-11Gocr02.vmdk"
scsi1:4.redo = ""
scsi1:5.mode = "independent-p******"
scsi1:5.deviceType = "disk"
scsi1:5.present = "TRUE"
scsi1:5.fileName = "F:\VM\RACdisk\11g\share-11Gocr03.vmdk"
scsi1:5.redo = ""
scsi1:6.mode = "independent-p******"
scsi1:6.deviceType = "disk"
scsi1:6.present = "TRUE"
scsi1:6.fileName = "F:\VM\RACdisk\11g\share-11Goggdg01.vmdk"
scsi1:6.redo = ""
scsi1:8.mode = "independent-p******"
scsi1:8.deviceType = "disk"
scsi1:8.present = "TRUE"
scsi1:8.fileName = "F:\VM\RACdisk\11g\share-11Goggdg02.vmdk"
scsi1:8.redo = ""
scsi1:9.mode = "independent-p******"
scsi1:9.deviceType = "disk"
scsi1:9.present = "TRUE"
scsi1:9.fileName = "F:\VM\RACdisk\11g\share-11Goggdg03.vmdk"
scsi1:9.redo = ""
scsi1:10.mode = "independent-p******"
scsi1:10.deviceType = "disk"
scsi1:10.present = "TRUE"
scsi1:10.fileName = "F:\VM\RACdisk\11g\share-11Goggdg04.vmdk"
scsi1:10.redo = ""
scsi1:11.mode = "independent-p******"
scsi1:11.deviceType = "disk"
scsi1:11.present = "TRUE"
scsi1:11.fileName = "F:\VM\RACdisk\11g\share-11Goggdg11.vmdk"
scsi1:11.redo = ""
scsi1:12.mode = "independent-p******"
scsi1:12.deviceType = "disk"
scsi1:12.present = "TRUE"
scsi1:12.fileName = "F:\VM\RACdisk\11g\share-11Goggdg12.vmdk"
scsi1:12.redo = ""
scsi1:13.mode = "independent-p******"
scsi1:13.deviceType = "disk"
scsi1:13.present = "TRUE"
scsi1:13.fileName = "F:\VM\RACdisk\11g\share-11Goggdg13.vmdk"
scsi1:13.redo = ""
scsi1:14.mode = "independent-p******"
scsi1:14.deviceType = "disk"
scsi1:14.present = "TRUE"
scsi1:14.fileName = "F:\VM\RACdisk\11g\share-11Goggdg14.vmdk"
scsi1:14.redo = ""
2.udev绑盘
#查看全部的磁盘
fdisk -l | grep dev/sd*
#安装multipath
mount /dev/sr0 /mnt

yum install -y device-mapper*
mpathconf --enable --with_multipathd y

#查看共享盘的scsi_id,若没有显示结果输出,关闭虚拟机添加文件中添加参数disk.EnableUUID = "TRUE"
/sbin/scsi_id -g -u /dev/sdb
/sbin/scsi_id -g -u /dev/sdc
/sbin/scsi_id -g -u /dev/sdd
/sbin/scsi_id -g -u /dev/sde
/sbin/scsi_id -g -u /dev/sdf
/sbin/scsi_id -g -u /dev/sdg
/sbin/scsi_id -g -u /dev/sdh
/sbin/scsi_id -g -u /dev/sdi
/sbin/scsi_id -g -u /dev/sdl
/sbin/scsi_id -g -u /dev/sdj
/sbin/scsi_id -g -u /dev/sdk
/sbin/scsi_id -g -u /dev/sdl
/sbin/scsi_id -g -u /dev/sdm
/sbin/scsi_id -g -u /dev/sdn
#配置multipath，wwid的值为上面获取的scsi_id，alias可自定义,注释原文件所有行
sed '/^/s/^/#/' /etc/multipath.conf -i
cat <<EOF>> /etc/multipath.conf
defaults {
    user_friendly_names yes
}

blacklist {
  devnode "^sda"
}

multipaths {
  multipath {
  wwid "36000c294bdcea3fdd99b34a77f58becb"
  alias asm_data01
  }
  multipath {
  wwid "36000c29575905c1700590d8e755b3aa4"
  alias asm_data02
  }
  multipath {
  wwid "36000c294d814181da02ff4953334be05"
  alias asm_data03
  }
  multipath {
  wwid "36000c29f105b5428d831f9cfdec40c61"
  alias asm_ocr01
  }
  multipath {
  wwid "36000c295523af0a30da2cf6ed7821695"
  alias asm_ocr02
  }
  multipath {
  wwid "36000c2930b6caac64a18453c0f929c21"
  alias asm_ocr03
  }
  multipath {
  wwid "36000c29bfe3a7df41ddfcecc9de5b47e"
  alias asm_ogg01
  }
  multipath {
  wwid "36000c298ada9369771e3cdf307d69217"
  alias asm_ogg02
  }
  multipath {
  wwid "36000c299f2c3ff1b31b4088eb1685563"
  alias asm_ogg03
  }
  multipath {
  wwid "36000c299e9a3bac01b13541eda461949"
  alias asm_ogg04
  }
  multipath {
  wwid "36000c2996610d1f39a94bf8458dc10b7"
  alias asm_ogg11
  }
  multipath {
  wwid "36000c29b0a2fd4d8bd50ed0c9e4ee1c2"
  alias asm_ogg12
  }
  multipath {
  wwid "36000c299956c20c6b409d7dd181dd74c"
  alias asm_ogg13
  }
  multipath {
  wwid "36000c29278d897d19dd1506626a8b971"
  alias asm_ogg14
  }
  multipath {
  wwid "36000c29236e0a5484b831362e0064ed8"
  alias asm_cc
  }

}
EOF
#激活multipath多路径：
multipath -F

multipath -v2

multipath -ll

#UDEV绑盘
cd /dev/mapper
for i in asm_*; do
    printf "%s %s\n" "$i" "$(udevadm info --query=all --name=/dev/mapper/"$i" | grep -i dm_uuid)" >>/dev/mapper/udev_info
done
while read -r line; do
    dm_uuid=$(echo "$line" | awk -F'=' '{print $2}')
    disk_name=$(echo "$line" | awk '{print $1}')
    echo "KERNEL==\"dm-*\",ENV{DM_UUID}==\"${dm_uuid}\",SYMLINK+=\"${disk_name}\",OWNER=\"grid\",GROUP=\"asmadmin\",MODE=\"0660\"" >>/etc/udev/rules.d/99-oracle-asmdevices.rules
done < /dev/mapper/udev_info
#重载udev
udevadm control --reload-rules

udevadm trigger --type=devices

ll /dev/asm*

3.dd格式化磁盘
dd if=/dev/zero of=/dev/sdb   bs=1M count=1000
dd if=/dev/zero of=/dev/sdc   bs=1M count=1000
dd if=/dev/zero of=/dev/sdd   bs=1M count=1000
dd if=/dev/zero of=/dev/sde   bs=1M count=1000
dd if=/dev/zero of=/dev/sdf   bs=1M count=1000
dd if=/dev/zero of=/dev/sdg   bs=1M count=1000
