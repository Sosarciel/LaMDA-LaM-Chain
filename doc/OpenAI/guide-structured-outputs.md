# Structured Outputs / JSON Mode | OpenAI 官方文档摘要

Sources:
- https://platform.openai.com/docs/guides/structured-outputs
- https://developers.openai.com/api/reference/chat-completions/overview.md
Captured: 2026-08-24

Structured Outputs 确保模型始终生成符合所提供 JSON Schema 的响应。

## 两种形式

1. Function calling 中的 strict 模式（连接模型与应用工具时）
2. `response_format` 的 `json_schema` 格式（结构化模型对用户的回复时）

## Structured Outputs vs JSON Mode

| | Structured Outputs | JSON Mode |
|---|---|---|
| 输出合法 JSON | Yes | Yes |
| 遵循 schema | Yes (supported schemas) | No |
| 兼容模型 | `gpt-4o-mini`, `gpt-4o-2024-08-06` 及之后 | `gpt-3.5-turbo`, `gpt-4-*`, `gpt-4o-*`, 兼容 GPT-5 系列 |
| 启用方式 | `response_format: {type: "json_schema", strict: true, schema: ...}` | `response_format: {type: "json_object"}` |

> Chat Completions 与 Responses API 均支持 Structured Outputs 与 JSON mode。
> Responses API 中对应字段为 `text.format`（语义相同）。

## Chat Completions 的 response_format

```jsonc
{
    // "text"(默认) | "json_object" | "json_schema"
    "type": "json_schema",
    // type 为 json_schema 时必填
    "json_schema": {
        "name": "math_reasoning",       // required — schema 名称
        "description": "...",            // optional — schema 描述
        "schema": { /* JSON Schema */ }, // required — JSON Schema 对象
        "strict": true                   // optional — 默认 false; true 时启用严格 schema 校验
    }
}
```

## JSON Mode 注意事项

- 必须在对话中的某条消息（如 system message）指示模型生成 JSON；
  否则模型可能无限输出空白直至 token 上限。
  上下文中未出现字符串 "JSON" 时 API 会抛出错误
- JSON mode 只保证输出是可解析的合法 JSON，不保证匹配任何特定 schema；
  需自行用校验库 + 重试确保符合预期结构
- 需检测并处理边缘情况：max_output_tokens 截断导致 JSON 不完整、
  安全系统拒绝（refusal）、content_filter 中断等

## Supported Schemas 要点

- 部分关键字需特殊处理（如 `$ref`/递归结构用 `$defs` + `$ref`）
- 所有字段必须 `required`（可选字段用 union with null 表达）
- `additionalProperties: false`（strict 模式下）
