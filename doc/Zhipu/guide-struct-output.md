# 结构化输出 | 智谱开放平台中文文档

Source: https://docs.bigmodel.cn/cn/guide/capabilities/struct-output.md
Captured: 2026-08-24

结构化输出（JSON 模式）可以确保 AI 返回符合预定义格式的 JSON 数据，为程序化处理 AI 输出提供可靠保障。

## 核心参数说明

- `response_format`: 设置为 `{"type": "json_object"}` 启用 JSON 模式
- `model`: 使用支持结构化输出的模型
- `messages`: 在系统消息中定义期望的 JSON 结构和字段要求

> **注意**: GLM 不支持 OpenAI 的 `json_schema` 类型。期望的 JSON 结构需通过
> system/user prompt 中的文本描述（或直接内嵌 JSON Schema 文本）传达给模型，
> 客户端拿到结果后自行用 jsonschema 等库验证。

## 代码示例

```python
from zai import ZhipuAiClient
import json

client = ZhipuAiClient(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    model="glm-5.2",
    messages=[
        {
            "role": "system",
            "content": """
            你是一个情感分析专家。请按照以下 JSON 格式返回分析结果：
            {
                "sentiment": "positive/negative/neutral",
                "confidence": 0.95,
                "emotions": ["joy", "excitement"],
                "keywords": ["天气", "心情"],
                "analysis": "详细分析说明"
            }
            """
        },
        {
            "role": "user",
            "content": "请分析这句话的情感：'今天天气真好，心情很愉快！'"
        }
    ],
    response_format={"type": "json_object"}
)

result = json.loads(response.choices[0].message.content)
```

带 JSON Schema 验证的推荐模式：

```python
schema = {...}  # 客户端定义的 JSON Schema

response = client.chat.completions.create(
    model="glm-5.2",
    messages=[
        {"role": "system", "content": f"请按照以下 JSON Schema 格式返回:\n{json.dumps(schema, ensure_ascii=False)}"},
        {"role": "user", "content": "..."},
    ],
    response_format={"type": "json_object"},
)

result = json.loads(response.choices[0].message.content)
validate(instance=result, schema=schema)   # jsonschema 校验
```

## 对应 API Schema (对话补全)

```yaml
response_format:
  type: object
  description: >
    指定模型的响应输出格式，默认为 text，仅文本模型支持此字段。
    type 取值收敛为三种: text（普通文本输出）、json_object（JSON 格式输出）
  properties:
    type:
      type: string
      enum: [text, json_object]
      default: text
  required: [type]
```

## 实践建议

- Schema 设计：明确性（字段名与类型清晰）、完整性（包含必要验证规则）、灵活性（考虑扩展）
- 错误处理：多层验证（Schema 验证 + 业务逻辑验证）；准备简化的备用 Schema；记录错误日志
- 从简单结构开始逐步增加复杂性；关键字段提供详细描述和示例
