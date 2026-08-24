---
title: Oracle常见参数文件报错
published: 2026-07-28
description: "ORA-09925: Unable to create audit trail file"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

########################################################################################
ORA-09925: Unable to create audit trail file

Linux-x86_64 Error: 2: No such file or directory

Additional information: 9925

ORA-01075: you are currently logged on

修改pfile文件
*.audit_file_dest='$ORACLE_BASE/admin/dbname/adunmp'
确定有这个路径
ls $ORACLE_BASE/admin/dbname/adunmp

########################################################################################
ORA-00205: error in identifying control file, check alert log for more info

检查pfile中control路径,是否和实际路径相同

########################################################################################
PERFUTF1> startup
ORA-00823: Specified value of sga_target greater than sga_max_size
ORA-01078: failure in processing system parameters

症状：sga_target大于sga_max_size,由于内存大于数据库限制最大内存导致数据库无法正常启动

原因：执行升级脚本，导致参数文件被修改（并不确定，可能之前这个库的参数文件被人改了，具体原因未知）

处理方案：
1.查看spfile文件位置(oracle,grid)

```
srvctl config database -d PERFUTF
```

2.查看系统内存大小(任一用户)

aix：topas
linux:free -m

3.进到任意实例创建pfile文件(oracle sqlplus)

create file='/tmp/xxxpfile.ora' from spfile='+DATADG/PERFUTF/PARAMETERFILE/spfile.267.1106323705'

4.修改pfile(任一用户)

vim /tmp/xxxpfile.ora
这里修改sga_max_size，系统内存是100g
（100-系统运行需要的内存-日常脚本需要的内存）80%=sga+pga
根据不同业务设定sga大小，这里看到pga只占了20g，每个实例都单独设置了最大sga大小，根据业务调整

5.启动数据库（oracle sqlplus）
startup file='/tmp/pfiletest.ora'

6.创建spfile文件(oracle sqlplus)
create spfile from file='/tmp/xxxpfile.ora'

7.进到asmcmd查看spfile名称(grid asmcmd)

cd +DATADG/PERFUTF/PARAMETERFILE/

8.修改spfile默认路径(oracle,grid)

```
srvctl modify database -d PERFUTF -spfile='+DATADG/PERFUTF/PARAMETERFILE/spfile.365.1106323705'
```

9.重启数据库(oracle,grid)

```
srvctl stop database -d PERFUTF
srvctl start database -d PERFUTF
```

```
crsctl status res -t
```
