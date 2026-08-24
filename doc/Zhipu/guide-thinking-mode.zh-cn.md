# 思考模式 | 智谱开放平台中文文档

Source: https://docs.bigmodel.cn/cn/guide/capabilities/thinking-mode.md
Captured: 2026-08-24

GLM 提供多种思考模式，覆盖从常规对话到工具调用与编码智能体的不同需求。

## 默认思考行为

GLM-5.3 / 5.2 / 5.1 / 5 / 4.7 系列默认开启 Thinking，
不同于 GLM-4.6 的默认「混合 thinking（自动开启）」。

关闭方式:

```json
"thinking": { "type": "disabled" }
```

注意 `GLM-5.3` 强制思考不能关闭。

## 交错式思考（Interleaved Thinking）

从 GLM 4.5 开始默认支持：GLM 可以在工具调用之间、以及收到工具结果之后继续思考。
模型可解读每次工具输出、串联多次工具调用与推理步骤、根据中间结果做细粒度决策。

注意：使用「交错思考 + 工具」时，必须显式保留 reasoning content，并在返回工具结果时一并返回。

## 保留式思考（Preserved Thinking）

编码场景新能力：模型可在上下文中保留先前 assistant 回合的 reasoning content。
有助于保持推理连续性、提升表现并提高缓存命中率。

- Coding Plan 端点默认开启；标准 API 端点默认关闭
- 通过 `"clear_thinking": false` 在 API 端点开启
- 必须将完整、未修改的 reasoning content 传回 API；
  所有连续的 reasoning content 必须与模型原始生成的序列完全一致，
  不要重新排序或修改，否则会降低效果并影响缓存命中

## 轮级思考（Turn-level Thinking）

GLM-4.7 新引入：按轮控制推理计算，同一会话中每轮请求可独立选择开启/关闭思考。

- 更灵活的成本/时延控制：轻量轮次关闭思考快速响应；重任务轮次开启提升正确率
- 多轮体验顺滑：思考开关在会话内随时切换
- 适合 Agent/工具调用场景：工具轮次降低推理开销，决策轮次开启深度思考

## 使用示例

该机制同时适用于 Interleaved Thinking 和 Preserved Thinking，无需手动区分。
请记得返回历史的 `reasoning_content` 以保持推理连贯性。

```python
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="https://open.bigmodel.cn/api/paas/v4/")

tools = [{"type": "function", "function": {
    "name": "get_weather",
    "description": "Get weather information",
    "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
}}]

messages = [
    {"role": "system", "content": "You are an assistant"},
    {"role": "user", "content": "What's the weather like in Beijing?"},
]

# Round 1: 模型推理并调用工具
response = client.chat.completions.create(
    model="glm-5.1", messages=messages, tools=tools, stream=True,
    extra_body={
        "thinking": {
            "type": "enabled",
            "clear_thinking": False   # False 为 Preserved Thinking
        }
    })

# 流式解析 delta.reasoning_content / delta.content / delta.tool_calls ...

# 关键: 回传 reasoning_content 保持推理连贯
messages.append({"role": "assistant", "content": content,
                 "reasoning_content": reasoning,
                 "tool_calls": [...]})
messages.append({"role": "tool", "tool_call_id": tool_calls[0]["id"],
                 "content": json.dumps({"weather": "Sunny", "temp": "25°C"})})

# Round 2: 模型基于工具结果继续推理并回答（同样传 clear_thinking: False）
```
