# Chat Completions API | DeepSeek API 文档

Source: https://api-docs.deepseek.com/zh-cn/api/create-chat-completion
Captured: 2026-08-24

POST `/chat/completions` — 根据输入的上下文，来让模型补全对话内容。
base_url: `https://api.deepseek.com` (beta 功能需 `https://api.deepseek.com/beta`)

## Request Body

### messages `object[]` required (>=1)

对话的消息列表，oneOf:

- **System message**
    - `content` string required — system 消息的内容
    - `role` string required (`system`)
    - `name` string optional — 参与者名称，区分相同角色的参与者
- **User message**
    - `content` object required — 字符串或内容块数组（`deepseek-v4-flash-vision-exp` 可携带图片）
        - Text content: string
        - Array of content parts:
            - `{type:"text", text:string}`
            - `{type:"image_url", image_url:{url:string(<=8192字符 http(s)/base64 data URL), detail?:"low"|"high"|"original"|"auto"}}`
              - low 缩小到 512x512；high/original/auto 保留原图。格式：JPEG/PNG/GIF/WebP
            - `{type:"file", file_id?:string("file-api-..."), file_data?:string(base64), filename?:string}`
              - file_id 来自 Files API，与 file_data 互斥
    - `role` string required (`user`)
    - `name` string optional
- **Assistant message**
    - `content` string nullable required
    - `role` string required (`assistant`)
    - `name` string optional
    - `prefix` bool (Beta) — 强制模型以此 assistant 消息中的前缀内容开始回答；需 base_url=/beta
    - `reasoning_content` string nullable (Beta) — 思考模式下「对话前缀续写」时作为最后一条 assistant 思维链输入；必须 `prefix:true`
- **Tool message**
    - `role` string required (`tool`)
    - `content` Text content(string) required
    - `tool_call_id` string required — 此消息所响应的 tool call 的 ID

### model string required

Possible values: `deepseek-v4-flash`, `deepseek-v4-pro`, `deepseek-v4-flash-vision-exp`

### thinking object nullable

控制思考模式与非思考模式的转换。

- `type` string: `enabled` | `disabled` — 默认 `enabled`
- `reasoning_effort` string: `low` | `high` | `max` — 控制模型的推理强度，默认 `high`。
  出于兼容考虑 `medium`、`xhigh` 会映射为 `high`。

> **注意**: `reasoning_effort` 是 `thinking` 的子字段，不是请求顶层字段。

### max_tokens integer nullable

限制一次请求中模型生成 completion 的最大 token 数。

### response_format object nullable

一个 object，指定模型必须输出的格式。

设置为 `{ "type": "json_object" }` 以启用 JSON 模式，保证模型生成的消息是有效的 JSON。

注意: 使用 JSON 模式时，还必须通过 system 或 user 消息指示模型生成 JSON，否则模型可能不断生成空白直到达到 token 上限。若 `finish_reason="length"` 表示被截断。

- `type` string: `text` | `json_object` — 默认 `text`

### stop object nullable

string 或最多 16 个 string 的 list，遇到时停止生成。

### stream boolean nullable

SSE 流式发送增量，以 `data: [DONE]` 结尾。

### stream_options object nullable

仅在 `stream=true` 时可设置。

- `include_usage` boolean — true 时在 `[DONE]` 前传输一个额外 chunk，其 usage 为整请求统计、choices 为空数组；其余块 usage 为 null

### temperature number nullable (<=2, 默认 1)

采样温度 0~2。建议只改 temperature 或 top_p 之一。

### top_p number nullable (<=1, 默认 1)

核采样。

### tools object[] nullable (最多 128 个)

目前仅支持 function 工具。

- `type` string required (`function`)
- `function` object required
    - `description` string — 功能描述
    - `name` string required — a-z A-Z 0-9 _ - ，最大 64 字符
    - `parameters` object — JSON Schema；省略 = 空参数列表
    - `strict` boolean — 默认 `false`；true 时 strict 模式确保输出符合 schema（Beta）

### tool_choice object nullable

无 tools 时默认 `none`，有 tools 时默认 `auto`。

oneOf:

- ChatCompletionToolChoice: `none` | `auto` | `required`
- ChatCompletionNamedToolChoice: `{"type":"function","function":{"name":"my_function"}}`

### logprobs boolean nullable

是否返回输出 token 的对数概率。

### top_logprobs integer nullable (0~20)

每个位置返回 top N token 及对数概率；指定时 logprobs 必须为 true。

### user_id nullable

自定义用户标识，字符集 [a-zA-Z0-9\-_]，最大 512。用途：内容安全处理 / KVCache 缓存隔离 / 调度隔离。

### frequency_penalty deprecated

已不再支持，传入不产生任何效果。

### presence_penalty deprecated

已不再支持，传入不产生任何效果。

## Response 200 (No streaming)

- **id** string required
- **choices** object[] required
    - `finish_reason` string required — `stop` | `length` | `content_filter` | `tool_calls` | `insufficient_system_resource`
      - stop: 自然停止或遇到 stop 序列；length: 达到上下文/max_tokens 限制；content_filter: 触发过滤策略；insufficient_system_resource: 系统推理资源不足被打断
    - `index` integer required
    - `message` object required
        - `content` string nullable required
        - `reasoning_content` string nullable — 仅思考模式，最终答案前的推理内容
        - `tool_calls` object[]
            - `id` string required
            - `type` string required (`function`)
            - `function` object required: `name` string, `arguments` string(JSON 格式，模型可能生成无效 JSON，调用前需验证)
        - `role` string required (`assistant`)
    - `logprobs` object nullable required
        - `content` object[] nullable required
            - `token` string required
            - `logprob` number required — `-9999.0` 代表概率极小不在 top20
            - `bytes` integer[] nullable required — UTF-8 字节表示
            - `top_logprobs` object[] required — 同上结构 {token,logprob,bytes}
        - `reasoning_content` object[] nullable — 结构同 content
- **created** integer required — Unix 秒级时间戳
- **model** string required
- **system_fingerprint** string required
- **object** string required — `chat.completion`
- **usage** object
    - `completion_tokens` integer required
    - `prompt_tokens` integer required (= prompt_cache_hit_tokens + prompt_cache_miss_tokens)
    - `prompt_cache_hit_tokens` integer required
    - `prompt_cache_miss_tokens` integer required
    - `total_tokens` integer required
    - `completion_tokens_details` object: `reasoning_tokens` integer — 推理产生的思维链 token 数

### Schema example (non-stream)

```json
{
  "id": "string",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "string",
        "reasoning_content": "string",
        "tool_calls": [
          { "id": "string", "type": "function", "function": { "name": "string", "arguments": "string" } }
        ],
        "role": "assistant"
      },
      "logprobs": {
        "content": [ { "token": "string", "logprob": 0, "bytes": [0], "top_logprobs": [ { "token": "string", "logprob": 0, "bytes": [0] } ] } ],
        "reasoning_content": [ { "token": "string", "logprob": 0, "bytes": [0], "top_logprobs": [ { "token": "string", "logprob": 0, "bytes": [0] } ] } ]
      }
    }
  ],
  "created": 0,
  "model": "string",
  "system_fingerprint": "string",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 0,
    "prompt_tokens": 0,
    "prompt_cache_hit_tokens": 0,
    "prompt_cache_miss_tokens": 0,
    "total_tokens": 0,
    "completion_tokens_details": { "reasoning_tokens": 0 }
  }
}
```

## Response 200 (Streaming)

流式返回一系列 `chat completion chunk` 对象，`object` 值为 `chat.completion.chunk`。

chunk.choices[].delta 替代 message:

- `content` string nullable
- `reasoning_content` string nullable
- `role` string (`assistant`)
- `logprobs` object nullable — 结构同非流式
- `finish_reason` string nullable required — 枚举同非流式
- `index` integer required

chunk 顶层: `id`/`choices`/`created`(各 chunk 相同)/`model`/`system_fingerprint`/`object`

### SSE Example

```text
data: {"id": "1f633d8bfc032625086f14113c411638", "choices": [{"index": 0, "delta": {"content": "", "role": "assistant"}, "finish_reason": null, "logprobs": null}], "created": 1718345013, "model": "deepseek-v4-pro", "system_fingerprint": "fp_a49d71b8a1", "object": "chat.completion.chunk", "usage": null}
data: {"choices": [{"delta": {"content": "Hello", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-v4-pro", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}
...
data: {"choices": [{"delta": {"content": "", "role": null}, "finish_reason": "stop", "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-v4-pro", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1", "usage": {"completion_tokens": 9, "prompt_tokens": 17, "total_tokens": 26}}
data: [DONE]
```

## 相关指南

- JSON Output: 见 guide-json_mode.md
- Thinking Mode: 见 guide-thinking_mode.md
- Tool Calls: 见 guide-tool_calls.md
