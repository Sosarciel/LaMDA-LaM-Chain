# 思考模式 | DeepSeek API 文档

Source: https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
Captured: 2026-08-24

DeepSeek 模型支持思考模式：在输出最终回答之前，模型会先输出一段思维链内容，以提升最终答案的准确性。

## 思考模式开关与思考强度控制

| | OpenAI 格式 | Anthropic 格式 | Responses API 格式 |
|---|---|---|---|
| 思考模式开关 (1) | `{"thinking": {"type": "enabled/disabled"}}` | `{"reasoning": {"effort": "none/low/high/max"}}` (none 表示关闭) | |
| 思考强度控制 (2) | `{"reasoning_effort": "low/high/max"}` | `{"output_config": {"effort": "low/high/max"}}` | |

- (1) 思考模式默认打开，且 effort 默认为 `high`
- (2) 用户设置的 effort 与模型实际推理 effort 的映射表（`deepseek-v4-flash` 与 `deepseek-v4-pro` 一致）：

| 请求传入 effort | 实际映射 effort |
|---|---|
| low | low |
| medium | high |
| high | high |
| xhigh | high |
| max | max |

在 OpenAI SDK 中使用 Chat Completion 设置时，`thinking` 参数需传入 `extra_body`：

```python
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    # ...
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
)
```

> **注意**: API Schema（create-chat-completion）中 `reasoning_effort` 是 `thinking` 对象的子字段；
> OpenAI SDK 兼容写法将其放在请求顶层。两种写法等价。
> API Schema 注释: 出于兼容考虑 `medium`、`xhigh` 会映射为 `high`。

## 输入输出参数

思考模式不支持 `temperature`、`top_p`、`presence_penalty`、`frequency_penalty` 参数。
为了兼容已有软件，设置参数不会报错，但也不会生效。

思维链内容通过 `reasoning_content` 返回，与 `content` 同级。后续轮次拼接规则：

- 两个 `user` 消息之间，若请求**未携带 `tools`**：中间 assistant 的 `reasoning_content`
  无需参与上下文拼接，传入会被忽略
- 两个 `user` 消息之间，若请求**携带了 `tools`**：中间 assistant 的 `reasoning_content`
  必须回传给 API——即使该轮未实际进行工具调用，否则 API 返回 `400` 错误

## 多轮对话拼接

如果请求未携带 tools，之前轮输出的思维链内容不会被拼接到上下文。

```python
# Turn 1
messages = [{"role": "user", "content": "9.11 and 9.8, which is greater?"}]
response = client.chat.completions.create(
    model="deepseek-v4-pro", messages=messages,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
)
reasoning_content = response.choices[0].message.reasoning_content
content = response.choices[0].message.content

# Turn 2 — The reasoning_content will be ignored by the API
messages.append(response.choices[0].message)
messages.append({'role': 'user', 'content': "How many Rs are there in the word 'strawberry'?"})
response = client.chat.completions.create(
    model="deepseek-v4-pro", messages=messages,
    extra_body={"thinking": {"type": "enabled"}},
)
```

## 工具调用

思考模式支持工具调用：模型可在输出最终答案前进行多轮思考与工具调用。

携带 `tools` 参数的请求，后续所有请求必须完整回传 `reasoning_content`，
否则 API 返回 400 报错。

```python
while True:
    response = client.chat.completions.create(
        model='deepseek-v4-pro', messages=messages, tools=tools,
        reasoning_effort="high",
        extra_body={ "thinking": { "type": "enabled" } },
    )
    messages.append(response.choices[0].message)
    # 等价于显式构造:
    # messages.append({
    #     'role': 'assistant',
    #     'content': ...,
    #     'reasoning_content': ...,   # 必须回传
    #     'tool_calls': ...,
    # })
    tool_calls = response.choices[0].message.tool_calls
    if tool_calls is None:
        break
    for tool in tool_calls:
        result = TOOL_CALL_MAP[tool.function.name](**json.loads(tool.function.arguments))
        messages.append({"role": "tool", "tool_call_id": tool.id, "content": result})
```
