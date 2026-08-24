---
title: 批量导出O到excel
published: 2025-08-17
description: "pip install cx_Oracle"
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

1.安装依赖
pip install cx_Oracle
pip install xlsxwriter

2.脚本
import cx_Oracle
import xlsxwriter

# 存储连接串的列表
database_connection_strings = [
    'oracle/oracle@127.0.0.1:1521/orclpdb',
    'oracle/oracle@192.168.81.221/orcl',
    'oracle/oracle@192.168.81.121/orcl',
    # 更多的连接串
]

# 创建一个Excel工作簿和工作表
workbook = xlsxwriter.Workbook('output.xlsx')
worksheet = workbook.add_worksheet()

# 初始化行
row_num = 0
first_run = True  # 添加标志确定是否为首次运行

# 在每个数据库环境中执行查询并将结果写入Excel
for db_connection_string in database_connection_strings:
    try:
        # 创建连接
        conn = cx_Oracle.connect(db_connection_string)

        # 创建游标
        cur = conn.cursor()

        # 执行SQL查询
        cur.execute("SELECT * FROM emp")

        # 在第一轮查询时写入字段名称
        if first_run:
            worksheet.write(row_num, 0, "IP_STR")  # 新增字段名称
            for c, column in enumerate(cur.description, start=1):
                worksheet.write(row_num, c, column[0])
            worksheet.write(row_num, c+1, "Error")  # 新增'Error'字段
            first_run = False  # 更新首次运行标志

        # 将数据库数据写入Excel工作表
        for r, row in enumerate(cur, start=row_num + 1):
            worksheet.write(r, 0, db_connection_string)  # 在每行的第一列添加数据库连接字符串
            for c, col in enumerate(row, start=1):
                worksheet.write(r, c, col)

        # 更新行号
        row_num = r

        # 关闭数据库连接
        cur.close()
        conn.close()

    except Exception as e:
        # 如果有错误发生，将其记录在新行的最后一个字段上，并忽略该错误，继续执行代码
        row_num += 1  # 新行开始
        worksheet.write(row_num, 0, db_connection_string)
        worksheet.write(row_num, c+1, str(e))

# 保存并关闭工作簿
workbook.close()
