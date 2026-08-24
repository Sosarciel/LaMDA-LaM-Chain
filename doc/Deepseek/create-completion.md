# FIM 补全 API（Beta） | DeepSeek API 文档

Source: https://api-docs.deepseek.com/zh-cn/api/create-completion
Captured: 2026-08-24

POST `/completions` — FIM (Fill In the Middle) 补全 API。
需设置 `base_url="https://api.deepseek.com/beta"` 来使用此功能。

## 与 OpenAI /completions 的对比结论 (2026-08-24 核对)

- Request: DeepSeek 为 OpenAI 的**子集**（缺失 best_of/n/logit_bias/seed/user，直接复用 OpenAI 定义）
- Response: 结构相同但存在扩展 → finish_reason 多 `insufficient_system_resource`，
  usage 多 `prompt_cache_hit_tokens`/`prompt_cache_miss_tokens`
- logprobs 平行数组结构与 OpenAI 完全相等，直接复用 `OpenAITextLogprobs`

## Request Body

### model string required

Possible values: `deepseek-v4-pro`

### prompt string required (默认 "Once upon a time,")

用于生成完成内容的提示。

### echo boolean nullable

在输出中，把 prompt 的内容也输出出来。

### logprobs integer nullable (<=20)

返回 logprobs 最可能输出 token 的对数概率（包含采样 token）。
响应中最多有 logprobs+1 个元素。最大值 20。（OpenAI 上限为 5）

### max_tokens integer nullable

最大生成 token 数量。

### stop object nullable

string 或最多 16 个 string 的 list。（OpenAI 上限为 4）

### stream boolean nullable

SSE 流式发送增量，以 `data: [DONE]` 结尾。

### stream_options object nullable

仅在 stream=true 时可设置。

- `include_usage` boolean — true 时在 [DONE] 前传输额外 chunk（usage 为整请求统计、choices 空数组）

### suffix string nullable

制定被补全内容的后缀。

### temperature number nullable (<=2, 默认 1)

采样温度 0~2。

### top_p number nullable (<=1, 默认 1)

核采样。

### frequency_penalty / presence_penalty deprecated

已不再支持，传入不产生任何效果。

## Response 200

- **id** string required
- **choices** object[] required
    - `finish_reason` string required — `stop` | `length` | `content_filter` | `insufficient_system_resource`
      - stop: 自然停止或遇到 stop 序列；length: 达到上下文/max_tokens 限制；
        content_filter: 触发过滤策略；insufficient_system_resource: 后端推理资源不足被打断
    - `index` integer required
    - `logprobs` object nullable required (平行数组结构)
        - `text_offset` integer[]
        - `token_logprobs` number[]
        - `tokens` string[]
        - `top_logprobs` object[]
    - `text` string required
- **created** integer required — Unix 秒级时间戳
- **model** string required
- **system_fingerprint** string
- **object** string required — `text_completion`
- **usage** object
    - `completion_tokens` integer required
    - `prompt_tokens` integer required (= prompt_cache_hit_tokens + prompt_cache_miss_tokens)
    - `prompt_cache_hit_tokens` integer required
    - `prompt_cache_miss_tokens` integer required
    - `total_tokens` integer required
    - `completion_tokens_details` object: `reasoning_tokens` integer

### Schema example

```json
{
  "id": "string",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": { "text_offset": [0], "token_logprobs": [0], "tokens": ["string"], "top_logprobs": [{}] },
      "text": "string"
    }
  ],
  "created": 0,
  "model": "string",
  "system_fingerprint": "string",
  "object": "text_completion",
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
