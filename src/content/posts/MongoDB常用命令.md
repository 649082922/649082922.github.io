---
title: MongoDB常用命令
published: 2026-08-22
description: "mongodump -h dbhost -d dbname -o dbdirectory"
tags: ["MongoDB", "实战笔记"]
category: 数据库
draft: false
---

mongodb备份与恢复：
mongodump -h dbhost -d dbname -o dbdirectory
mongorestore -h dbhost -d dbname --directoryperdb dbdirectory

rs.stepDown() -主从节点切换
rs.printSlaveReplicationInfo()-查看同步是否延迟
show  dba  //查看所有数据库
use  数据库名   //进入对应的数据库
show  users   //查看当前db用户以及附属角色权限
show collections   //查看所有collection
db.collection.count()   //查看该collection下所有数据（没有条件）
db.collection.find( {a:1} )  //查看该collection下数据（有条件，属性为a.值为1）
db.collection.findOne()   //查看collection结果信息
db.adminCommand({"flushrouterconfig":1}) // 刷新元数据信息
db.yest.createIndex({"_id:1"},{background:true})     //创建test 集合下索引
db.adminCommand({getCmdLineOpts:1})   // 获取当前db配置信息

//将指定db下数据查询结果输出到本地，一般不知道db用户密码情况下使用
mongo  --authenticationDatabase  admin -uroot  -p**** localhost:27017/baaoeder  --eval 'db.test.find()' >test.txt

//执行js脚本有两种方式，一种执行执行，但是对于find语句如下案例写法：db.test.find().forEach(printjson);第二种直接使用load(''/home/mongod/teat.js)进行执行
mongo  --authenticationDatabase  admin   -uroot  -p**** localhost:27017/bssorder  --quiet   test.js >text.txt

导数''
//-d 表示对应实例名，-c表示对应集合， -o表示输出目录， -readPreference 表示从节点导出，不加默认从主节点导
mongodump  -h  localhost:27017  -uroot   -p****  -d test  -c  test01  --rreadPreference=secondary  --authenticationDatabase=admin -o /pabank/imp

//movechunk操作
sh.moveChunk("test.fundProductInfo", { "_id" : "test.fundProductInfo-_id_ObjectId('5ea8ed37abea9012e312c542')"},"repl")

db.settings.update({_id:"balancer"},{$set:{activeWindow:{start:"23:00",stop:"6:00"}}},true)   //调整balancer窗口，config实例下执行
db.adminCommand({replSetResizeOplog:1,size:51200})  //在线修改oplog大小，单位M

时间戳转换
MongoDB  Enterprise  repl:PRIMARY> new  Date(1627831113000)
ISODate("2021-08-01T15:18:33Z")
