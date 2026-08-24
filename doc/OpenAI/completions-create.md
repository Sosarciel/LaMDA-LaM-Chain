# Create completion | OpenAI 官方文档摘要

Source: https://developers.openai.com/api/reference/resources/completions/methods/create.md
Captured: 2026-08-24

POST `/completions` — Creates a completion for the provided prompt and parameters.
Returns a completion object, or a sequence of completion objects if streamed.

## Body Parameters

- **model** string required — `gpt-3.5-turbo-instruct` | `davinci-002` | `babbage-002`
- **prompt** string | string[] | number[] | number[][] — 提示词；`<|endoftext|>` 为训练时的文档分隔符
- **best_of** number|null — 服务端生成 best_of 个候选并返回每 token 对数概率最高者；
  不可流式；与 n 同用时必须大于 n；注意 token 配额消耗
- **echo** boolean|null — 在补全外回传 prompt
- **frequency_penalty** number|null (-2~2)
- **presence_penalty** number|null (-2~2)
- **logit_bias** map[number]|null — token ID(GPT tokenizer) -> -100~100 偏置；
  -100 等价于禁止该 token
- **logprobs** number|null (max 5) — 返回 top N 最可能输出 token 及对数概率；
  API 总是返回采样 token 的 logprob，故响应最多有 logprobs+1 个元素
- **max_tokens** number|null
- **n** number|null — 每个 prompt 生成的补全数量
- **seed** number|null — 尽力确定性采样，配合 system_fingerprint 监控后端变更
- **stop** string|string[]|null — 最多 4 个序列；返回文本不含停止序列；不支持 o3/o4-mini
- **stream** boolean|null — SSE 流式，以 data: [DONE] 结尾
- **stream_options** object|null
    - `include_obfuscation` boolean — 流式混淆（默认开启，侧信道缓解）
    - `include_usage` boolean — [DONE] 前附加整请求 usage chunk（choices 为空数组）
- **suffix** string|null — FIM 后缀（仅 gpt-3.5-turbo-instruct）
- **temperature** number|null (0~2) — 默认 1
- **top_p** number|null
- **user** string

## Returns (Completion object)

- **id** string
- **choices** array of CompletionChoice
    - `finish_reason`: `"stop"` | `"length"` | `"content_filter"`
    - `index` number
    - `logprobs` object|null — **平行数组结构**（与 Chat API 的对象数组结构不同）:
        - `text_offset` number[] — 生成 token 的字符偏移
        - `token_logprobs` number[]
        - `tokens` string[]
        - `top_logprobs` map[number][] — 每位置最可能 token -> logprob 映射
    - `text` string
- **created** number — Unix 秒
- **model** string
- **object**: `"text_completion"`
- **system_fingerprint** string — 可配合 seed 判断后端是否变更
- **usage** CompletionUsage
    - prompt_tokens / completion_tokens / total_tokens
    - completion_tokens_details: {reasoning_tokens?, audio_tokens?, accepted_prediction_tokens?,
      rejected_prediction_tokens?, text_tokens?}
    - prompt_tokens_details: {cached_tokens?, audio_tokens?, text_tokens?, image_tokens?,
      cache_write_tokens?}

### Example response (no streaming)

```json
{
  "id": "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
  "object": "text_completion",
  "created": 1589478378,
  "model": "gpt-3.5-turbo-instruct",
  "system_fingerprint": "fp_44709d6fcb",
  "choices": [
    { "text": "\n\nThis is indeed a test", "index": 0, "logprobs": null, "finish_reason": "length" }
  ],
  "usage": { "prompt_tokens": 5, "completion_tokens": 7, "total_tokens": 12 }
}
```
