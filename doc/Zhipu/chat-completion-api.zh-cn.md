# 对话补全 | 智谱开放平台中文文档

Source: https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8.md
Captured: 2026-08-24

POST `https://open.bigmodel.cn/api/paas/v4/chat/completions`

和指定模型对话，模型根据请求给出响应。支持多模态（文本、图片、音频、视频、文件），流式和非流式输出。

## 文本模型请求 (ChatCompletionTextRequest)

### model string required

enum: `glm-5.3`(默认) `glm-5.2` `glm-5.1` `glm-5-turbo` `glm-5` `glm-4.7` `glm-4.7-flash` `glm-4.7-flashx` `glm-4.6` `glm-4.5-air` `glm-4.5-airx` `glm-4.5-flash` `glm-4-flash-250414` `glm-4-flashx-250414`

### messages object[] required (>=1)

消息列表，支持四种角色。注意不能只包含系统消息或助手消息。

- **用户消息**: `{role:"user", content:string}`
- **系统消息**: `{role:"system", content:string}`
- **助手消息**: `{role:"assistant", content?:string, tool_calls?:[]}`
    - `content` — 提供工具调用时通常为空
    - `tool_calls[]`
        - `id` string required — 工具调用 ID
        - `type` string required — enum `function` | `web_search` | `retrieval`
        - `function` object — `{name:string required, arguments:string required}` arguments 为 JSON 格式字符串
- **工具消息**: `{role:"tool", content:string required, tool_call_id:string required}`

### stream boolean (默认 false)

流式输出以 SSE 返回，结束标志 `data: [DONE]`。

### thinking object (ChatThinking)

仅 `GLM-4.5` 及以上模型支持。控制大模型是否开启思维链。

- `type`: `enabled`(默认) | `disabled`
    - GLM-5.3 限制只能开启，由 reasoning_effort 控制思考强度
    - GLM-5.2 / 5.1 / 5 / 5-Turbo / 5v-Turbo / 4.6 / 4.6V / 4.5 开启后为模型自动判断是否思考
    - GLM-4.7 / 4.5V 开启后强制思考
- `clear_thinking` boolean (默认 true) — **GLM 特有**
    - true: 本次请求中忽略/移除历史 turns 的 reasoning_content，仅使用非推理内容作为上下文输入，可降低上下文长度与成本
    - false: 保留历史 reasoning_content 并随上下文一同提供给模型（Preserved Thinking）；
      必须在 messages 中完整、未修改、按原顺序透传历史 reasoning_content，否则效果下降或无法生效
    - 该参数只影响跨 turn 的历史 thinking blocks；不改变当前 turn 是否产生 thinking

### reasoning_effort string (顶层字段)

控制模型的推理程度，`thinking` 开启时生效，默认 `max`，仅 GLM-5.2 及其以上模型支持。

enum: `max` `xhigh` `high` `medium` `low` `minimal` `none`

- GLM-5.3: 仅支持 `low`/`high`/`max` 档位
- GLM-5.2: `none`/`minimal` 放弃思考；`low`/`medium` 映射为 `high`；`xhigh` 映射为 `max`

### do_sample boolean (默认 true)

是否启用采样策略。false 时总选概率最高词汇（确定性输出），temperature/top_p 被忽略。
代码生成/翻译等需一致性的任务建议设为 false。

### temperature number [0.0, 1.0] 限两位小数

默认值: GLM-5.3/5.2/5.1/5/4.7/4.6 系列为 1.0，GLM-4.5 系列 0.6，GLM-4 系列 0.75。

### top_p number [0.01, 1.0] 限两位小数

默认值: GLM-5.3/5.2/5.1/5/4.7/4.6/4.5 系列 0.95，GLM-4 系列 0.9。

### max_tokens integer [1, 131072]

GLM-5.3/5.2/5.1/5/4.7/4.6 最大 128K 输出，GLM-4.5 系列最大 96K，建议不小于 1024。

### tool_stream boolean (默认 false)

是否开启流式响应 Function Calls，仅 GLM-5.3/5.2/5.1/5/5-Turbo/4.7/4.6 系列支持。

### tools object[] (最多 128 个函数)

anyOf:

- FunctionToolSchema `{type:"function", function:{name:string required(pattern ^[a-zA-Z0-9_-]+$ ≤64), description:string required, parameters:object(JSON Schema)}}`
    - 注意: GLM 的 description 与 parameters 均为 required（与 OpenAI 不同）
- RetrievalToolSchema `{type:"retrieval", retrieval:{knowledge_id:string required, prompt_template?:string}}`
- WebSearchToolSchema `{type:"web_search", web_search:{search_engine:"search_std"|"search_pro"|"search_pro_sogou"|"search_pro_quark" required, ...}}`
- MCPToolSchema `{type:"mcp", mcp:{server_label:string required, server_url?, transport_type?:"sse"|"streamable-http"(默认), allowed_tools?:string[], headers?}}`

### tool_choice

仅在工具类型为 function 时补充。默认 `auto` 且**仅支持 `auto`**（与 OpenAI 不同）。

### stop string[] (maxItems 4)

停止词列表，格式 `["stop_word1"]`。

### response_format object (仅文本模型支持)

- `type` string required: `text`(默认) | `json_object`
- 说明: 指定模型的响应输出格式。`text` 普通文本输出；`json_object` JSON 格式输出
- 注意: 收敛为两种取值，不支持 OpenAI 的 `json_schema`

### request_id string (6~64 字符)

请求唯一标识符，建议 UUID 格式，未提供时平台自动生成。

### user_id string (6~128 字符)

终端用户唯一标识符。

## 响应 (ChatCompletionResponse)

- `id` string — 任务 ID
- `request_id` string — 请求 ID
- `created` integer — Unix 秒级时间戳
- `model` string — 模型名称
- `choices` array
    - `index` integer
    - `message` (ChatCompletionResponseMessage)
        - `role` string — 默认 assistant
        - `content` string | array | null — 调用函数时为 null；GLM-4.5V 系列可能包含 `<think></think>` 标签
        - `reasoning_content` string — 思维链内容，仅 glm-4.5 系列、glm-4.1v-thinking 系列返回
        - `audio` object — glm-4-voice 音频内容 {id, data(base64), expires_at}
        - `tool_calls[]`
            - `id` string — 命中函数的唯一标识符
            - `type` string — 目前仅支持 `function`, `mcp`
            - `function` {name, arguments(JSON 字符串)}
            - `mcp` object — MCP 工具调用参数 {id, type:mcp_list_tools|mcp_call, server_label, error?, tools?, arguments?, name?, output?}
    - `finish_reason` string — `stop`(自然结束或触发stop词) | `tool_calls`(模型命中函数) | `length`(达到token限制) |
      `sensitive`(内容被安全审核拦截) | `network_error`(模型推理异常) | `model_context_window_exceeded`(超出上下文窗口)
- `usage` object
    - `prompt_tokens` number
    - `completion_tokens` number
    - `total_tokens` integer — glm-4-voice: 1秒音频=12.5 Tokens 向上取整
    - `prompt_tokens_details` {cached_tokens} — 命中缓存的 Token 数量
- `video_result` array — 视频生成结果 [{url, cover_image_url}]
- `web_search` array — 使用 WebSearchToolSchema 时返回 [{icon,title,link,media,publish_date,content,refer}]
- `content_filter` array — 内容安全信息 [{role:assistant|user|history, level:0-3(0最严重)}]

## 流式响应 (ChatCompletionChunk)

顶层: id / created / model / choices（无 usage、request_id）

chunk.choices[].delta 替代 message:

- `role` — 默认 assistant
- `content` — string|array|null；GLM-4.5V 可能含 `<think>` 标签与 `<|begin_of_box|>` 边界标签
- `audio` — glm-4-voice 音频增量
- `reasoning_content` — 思维链内容，仅 glm-4.5 系列支持
- `tool_calls[]` — 流式逐步生成，含 index/id/type/function{name,arguments}/mcp
