---
title: MCP
published: 2025-11-11
description: "MCP (Model Context Protocol) 配置笔记"
tags: ["AI", "实战笔记"]
category: AI
draft: false
---

MCP (Model Context Protocol) 配置笔记
=====================================

配置文件位置:
- 用户级: %USERPROFILE%\.claude.json
- 项目级: 项目目录\.mcp.json

=====================================
一、MCP 类型
=====================================

【HTTP 类型 - 远程服务】
适用: 云端API服务，需要网络连接和认证

{
  "服务名": {
    "type": "http",
    "url": "https://api.example.com/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}

可选参数:
- timeout: 超时时间(毫秒)

【stdio 类型 - 本地命令】
适用: 本地运行的npm包或可执行程序

{
  "服务名": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "包名"],
    "env": {
      "环境变量名": "值"
    }
  }
}

command 可以是:
- npx: 运行npm包
- node: 运行Node.js脚本
- python: 运行Python脚本
- 其他可执行程序路径

=====================================
二、官方推荐 MCP
=====================================

GitHub: https://github.com/modelcontextprotocol/servers

【文件与数据】
filesystem      读写本地文件，限制访问目录
sqlite          SQLite数据库查询和操作
postgres        PostgreSQL数据库操作
memory          简单的键值存储

【开发工具】
github          GitHub API，PR/Issue/仓库操作
gitlab          GitLab API操作
linear          Linear项目管理

【浏览器与搜索】
puppeteer       浏览器自动化，截图、爬虫
brave-search    Brave搜索引擎
google-maps     Google地图API
fetch           HTTP请求工具

【通讯工具】
slack           Slack消息和频道操作
discord         Discord集成

【其他】
seq             日志分析
everart         AI图像生成

=====================================
三、当前使用的 MCP 配置
=====================================

【playwright】浏览器自动化 - 本地运行，无需KEY
{
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}

功能: 网页导航、点击、填表、截图、等待元素

【zai-mcp-server】ZAI工具集 - 需要API KEY
{
  "zai-mcp-server": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@z_ai/mcp-server"],
    "env": {
      "Z_AI_MODE": "ZAI",
      "Z_AI_API_KEY": "YOUR_API_KEY"
    }
  }
}

功能:
- ui_to_artifact       UI截图转代码/规格
- analyze_image        通用图像分析
- analyze_video        视频内容分析
- extract_text_from_screenshot  截图文字提取
- diagnose_error_screenshot     错误截图诊断
- analyze_data_visualization    数据可视化分析
- understand_technical_diagram  技术图表理解

【web-search-prime】网络搜索 - 需要API KEY
{
  "web-search-prime": {
    "type": "http",
    "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}

功能: 搜索网络信息，返回标题、URL、摘要

【web-reader】网页读取 - 需要API KEY
{
  "web-reader": {
    "type": "http",
    "url": "https://api.z.ai/api/mcp/web_reader/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}

功能: 抓取网页并转换为Markdown格式

【zread】GitHub仓库阅读 - 需要API KEY
{
  "zread": {
    "type": "http",
    "url": "https://api.z.ai/api/mcp/zread/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}

功能:
- get_repo_structure  获取仓库目录结构
- read_file           读取文件内容
- search_doc          搜索文档/Issue/提交

=====================================
四、API KEY 说明
=====================================

需要KEY的情况:
- 调用云端AI服务 (计算资源消耗)
- 需要身份验证的API
- 有配额限制的付费服务

不需要KEY的情况:
- 完全本地运行的工具
- 开源免费的服务

=====================================
五、常见问题
=====================================

Q: MCP连接失败怎么办?
A: 1. 检查网络连接
   2. 确认API KEY有效
   3. 查看debug日志: %USERPROFILE%\.claude\debug\

Q: 如何添加新MCP?
A: 编辑 .claude.json 的 mcpServers 部分，添加配置后重启Claude Code

Q: 如何禁用某个MCP?
A: 从 mcpServers 中删除对应配置，或设置 "disabled": true
