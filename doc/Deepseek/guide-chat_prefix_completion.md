# 对话前缀续写（Beta） | DeepSeek API 文档

Source: https://api-docs.deepseek.com/zh-cn/guides/chat_prefix_completion
Captured: 2026-08-24

对话前缀续写沿用 Chat Completion API，用户提供 assistant 开头的消息，来让模型补全其余的消息。

## 注意事项

1. 使用对话前缀续写时，需确保 `messages` 列表里最后一条消息的 `role` 为 `assistant`，
   并设置该消息的 `prefix` 参数为 `true`
2. 需要设置 `base_url="https://api.deepseek.com/beta"` 来开启 Beta 功能

## 样例代码

设置 assistant 开头消息为 `` ```python\n`` 强制模型输出 python 代码，
并设置 `stop=['```']` 避免额外解释：

```python
from openai import OpenAI

client = OpenAI(
    api_key="<your api key>",
    base_url="https://api.deepseek.com/beta",
)

messages = [
    {"role": "user", "content": "Please write quick sort code"},
    {"role": "assistant", "content": "```python\n", "prefix": True}
]

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=messages,
    stop=["```"],
)
print(response.choices[0].message.content)
```

## 对应 API Schema (create-chat-completion)

assistant 消息上的相关字段:

- `prefix` bool (Beta) — 强制模型以此 assistant 消息中的前缀内容开始回答
- `reasoning_content` string nullable (Beta) — 思考模式下「对话前缀续写」时，
  作为最后一条 assistant 思维链内容的输入；使用时 `prefix` 必须为 `true`
