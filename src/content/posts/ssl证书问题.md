---
title: ssl证书问题
published: 2025-03-28
description: "WARNING: Retrying (Retry(total=0, connect=None, read=None, redirect=No"
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

pip软件安装报错
WARNING: Retrying (Retry(total=0, connect=None, read=None, redirect=None, status=None)) after connection broken by 'SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:997)'))': /simple/pyopenssl/
Could not fetch URL https://pypi.org/simple/pyopenssl/: There was a problem confirming the ssl certificate: HTTPSConnectionPool(host='pypi.org', port=443): Max retries exceeded with url: /simple/pyopenssl/ (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:997)'))) - skipping
ERROR: Could not find a version that satisfies the requirement pyopenssl (from versions: none)
ERROR: No matching distribution found for pyopenssl

解决方法：
参考https://www.cnblogs.com/shimmernight/p/13441760.html
https://www.cnblogs.com/aimed/p/10178048.html

1.将pip源调整为国内的源
pip install ssl -i http://mirrors.aliyun.com/pypi/simple --trusted-host mirrors.aliyun.com

2.永久修改pip源，可按照如下操作：
Windows：
1.找到系统盘下C:\Users\用户名\AppData\Roaming

2.查看在Roaming文件夹下有没有一个pip文件夹，如果没有创建一个；

3.进入pip文件夹，创建一个pip.ini文件；

4.使用记事本的方式打开pip.ini文件，写入:

[global]
index-url = http://mirrors.aliyun.com/pypi/simple # 指定下载源
trusted-host = mirrors.aliyun.com # 指定域名

Linux:
# 找到~/.pip/pip.conf,如果不存在就创建,加入内容如下
[global]
timeout = 10 # 设置超时，单位s
index-url =  http://mirrors.aliyun.com/pypi/simple/   # 指定优先下载源
extra-index-url= http://pypi.douban.com/simple/   # 第二下载源
[install]
trusted-host=
    mirrors.aliyun.com
    pypi.douban.com
