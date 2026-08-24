---
title: 正则表达式re使用
published: 2026-01-09
description: "re 是 Python 中一个用于处理正则表达式的模块，它提供了许多有用的函数和方法。以下是一些常用的 re 函数："
tags: ["工具", "实战笔记"]
category: 工具
draft: false
---

re 是 Python 中一个用于处理正则表达式的模块，它提供了许多有用的函数和方法。以下是一些常用的 re 函数：

1. re.match(pattern, string, flags=0)
用于检查字符串开头是否匹配正则表达式。如果是，返回一个匹配对象，否则返回 None。
import re

pattern = r"Hello"
text = "Hello, World!"
result = re.match(pattern, text)
if result:
    print("Match found:", result.group())
else:
    print("No match")

2. re.search(pattern, string, flags=0)
在字符串中查找第一个匹配的子串。如果找到，返回第一个匹配对象，否则返回 None。
import re

pattern = r"\d+"
text = "Hello, 123 World!"
match = re.search(pattern, text)
if match:
    print("Match found:", match.group())
else:
    print("No match")

3. re.findall(pattern, string, flags=0)
在字符串中查找所有匹配的子串，返回一个包含所有匹配的列表。
import re

pattern = r"\d+"
text = "Hello, 123 World! 456"
matches = re.findall(pattern, text)
print("Matches found:", matches)

4. re.finditer(pattern, string, flags=0)
在字符串中查找所有匹配的子串，并返回一个迭代器。
import re

pattern = r"\d+"
text = "Hello, 123 World! 456"
matches = re.finditer(pattern, text)
for match in matches:
    print("Match found:", match.group())

5. re.sub(pattern, replacement, string, count=0, flags=0)
替换匹配的子串。
import re

pattern = r"\d+"
text = "Hello, 123 World! 456"
replacement = "X"
new_text = re.sub(pattern, replacement, text)
print("After replacement:", new_text)

6. re.subn(pattern, repl, string, count=0, flags=0)
和 sub 类似，但是它返回的是替换的次数和替换后的字符串。
import re

pattern = r"\d+"
text = "Hello, 123 World! 456"
replacement = "X"

# 使用 re.subn() 替换匹配的数字为 "X"
new_text, num_replacements = re.subn(pattern, replacement, text)

print("After replacement:", new_text)
print("Number of replacements:", num_replacements)

7. re.split(pattern, string, maxsplit=0, flags=0)
根据模式将字符串分割为一个列表。maxsplit 参数是分割的最大次数。
import re

pattern = r"\s+"  # 匹配一个或多个空白字符（空格、制表符、换行符等）
text = "Hello   World   Python"
result = re.split(pattern, text)

print("Split result:", result)

8. re.escape(string)：
将字符串中的所有非字母数字字符转义。
import re

# 包含正则表达式中的特殊字符的字符串
special_characters = ".*+?()|{}[]\^$"

# 使用 re.escape() 转义特殊字符
escaped_string = re.escape(special_characters)

# 输出转义后的字符串
print("Escaped string:", escaped_string)

9. re.purge(pattern)：
清除正则表达式缓存中与特定模式相关的所有条目。
import re

# 编译正则表达式并缓存
pattern1 = re.compile(r'\d+')
pattern2 = re.compile(r'[a-zA-Z]+')

# 清除正则表达式的缓存
re.purge()

# 尝试使用已清除的缓存，这将引发异常
try:
    match = pattern1.match('123')
except re.error:
    print("Pattern not found in cache")

try:
    match = pattern2.match('abc')
except re.error:
    print("Pattern not found in cache")

10. re.groups(pattern)：
返回一个包含所有匹配的子串的元组，但是不包括组号。
import re

pattern = r"(\d{2})-(\d{2})-(\d{4})"
text = "Date: 30-09-2023"
match = re.search(pattern, text)
# 通过match.groups()来访问这些捕获组的匹配结果
day, month, year = match.groups()
print("Day:", day)
print("Month:", month)
print("Year:", year)

11. re.groupindex(pattern)：
返回一个字典，其中键是组号，值是相应组的匹配的列表。
import re

pattern = r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})"
text = "Date: 2023-09-30"
match = re.search(pattern, text)

# 获取捕获组的名称及其对应的组号
group_index = match.re.groupindex
print("Group Index:", group_index)

# 输出：
# Group Index: {'year': 1, 'month': 2, 'day': 3}

12. re.fullmatch(pattern, string)：
类似于 match，但是需要整个字符串都符合模式。
import re

pattern = r"\d{3}-\d{2}-\d{4}"
text1 = "123-45-6789"
text2 = "Hello, 123-45-6789"
text3 = "123-45-6789 is my SSN"

match1 = re.fullmatch(pattern, text1)
match2 = re.fullmatch(pattern, text2)
match3 = re.fullmatch(pattern, text3)

print(match1)  # 输出: <re.Match object; span=(0, 11), match='123-45-6789'>
print(match2)  # 输出: None
print(match3)  # 输出: None

13. re.compile(pattern, flags=0)
编译正则表达式模式，返回一个正则表达式对象。可以在编译时指定一些标志（如 re.IGNORECASE 或 re.MULTILINE）。
import re

# 编译正则表达式模式
pattern = re.compile(r'\d+')  # 匹配一个或多个数字

# 使用编译后的正则表达式对象进行匹配
text = "Hello, 123 World! 456"
match = pattern.search(text)  # 在文本中查找匹配项

if match:
    print("Match found:", match.group())  # 输出：123
else:
    print("No match")

14. re.escape(string)：
将字符串中的所有非字母数字字符转义。转义在默认情况下是不进行的，只有当指定了适当的标志（如 re.IGNORECASE 或 re.MULTILINE）时才进行。
import re

# 包含正则表达式中的特殊字符的字符串
special_characters = ".*+?()|{}[]\^$"

# 使用 re.escape() 转义特殊字符
escaped_string = re.escape(special_characters)

# 输出转义后的字符串
print("Escaped string:", escaped_string)

15. 使用捕获组
使用括号捕获匹配的部分。
import re

pattern = r"(\d{2})-(\d{2})-(\d{4})"
text = "Date: 30-09-2023"
match = re.search(pattern, text)
if match:
    day, month, year = match.groups()
    print("Day:", day)
    print("Month:", month)
    print("Year:", year)

16. Flags
re.IGNORECASE 或 re.I: 忽略大小写。
re.MULTILINE 或 re.M: 多行模式，使 ^ 和 $ 匹配每行的开头和结尾。
re.DOTALL 或 re.S: 让 . 匹配换行符。
import re

pattern = r"^hello"
text = "Hello, World!\nhello, Python"
result = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
if result:
    print("Match found:", result.group())
else:
    print("No match")

pattern：正则表达式模式。
repl：替换的字符串或可调用对象（比如函数）。
string：要搜索和替换的原始字符串。
count（可选）：替换的最大次数。默认为 0，表示替换所有匹配项。
flags（可选）：正则表达式的匹配标志。
