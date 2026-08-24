---
title: full_xtrbackup
published: 2024-01-12
description: "base_path=/backup/dailybak/mysql/anytxn/"
tags: ["MySQL", "实战笔记"]
category: 数据库
draft: false
---

########################################################################
# script name: full_bak.sh                                             #
# description: mysql full backup                                       #
# date: 2017-06-14                                                     #
# author: 1616                                                         #
########################################################################

#!/bin/bash

# backup_base_dir
base_path=/backup/dailybak/mysql/anytxn/

# current_date
bak_date=`date ""+%Y-%m-%d_%H:%M:%S""`

# log_date
log_date=`date ""+%Y-%m-%d_%H:%M:%S""`

# log_path
log_path=$base_path/bak_log

# current_backup_dir
bak_path=$base_path/full_$bak_date

# keep backup days
kbd=6

# if not exist base_path, then create it
if [ ! -d $base_path ]; then
            mkdir $base_path
fi

# if not exist log_path, then create it
if [ ! -d $log_path ]; then
            mkdir $log_path
fi

echo ""================`date '+%F %H:%M:%S'` Begin Backup database================"" >>$log_path/full_$log_date.log

#full backup

/mysql/xtrabackup/bin/xtrabackup  --defaults-file=/mysql/ilms/conf/my.cnf --host=127.0.0.1  --user=root --password='Root%1234' --backup --compress --target-dir=$bak_path 2>>$log_path/full_$log_date.log

echo ""================`date '+%F %H:%M:%S'` Finish Backup database================"" >>$log_path/full_$log_date.log

#delete obsoleted

echo ""================`date '+%F %H:%M:%S'` Delete obsoleted Backup==============="" >>$log_path/full_$log_date.log

if [ ! `find $base_path -type d -name 'full*' -mtime +$kbd && find $base_path -type d -name 'inc*' -mtime +$kbd` ]; then
             echo ""no obsolete backup found!"" >>$log_path/full_$log_date.log
     else
        find $base_path -type d -name 'full*' -mtime +$kbd >> $log_path/full_$log_date.log
        find $base_path -type d -name 'full*' -mtime +$kbd | xargs rm -rf
fi

echo ""================`date '+%F %H:%M:%S'` Finish Delete obsoleted==============="" >>$log_path/full_$log_date.log
