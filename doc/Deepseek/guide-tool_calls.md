# Tool Calls | DeepSeek API Docs

Source: https://api-docs.deepseek.com/guides/tool_calls

Tool Calls allows the model to call external tools to enhance its capabilities.

## Non-thinking Mode

Sample (Python):

```python
from openai import OpenAI

def send_messages(messages):
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=messages,
        tools=tools
    )
    return response.choices[0].message

client = OpenAI(api_key="<your api key>", base_url="https://api.deepseek.com")

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather of a location, the user should supply a location first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": { "type": "string", "description": "The city and state, e.g. San Francisco, CA" }
                },
                "required": ["location"]
            },
        },
    },
]

messages = [{"role": "user", "content": "How's the weather in Hangzhou, Zhejiang?"}]
message = send_messages(messages)
print(f"User>\t {messages[0]['content']}")

tool = message.tool_calls[0]
messages.append(message)
messages.append({"role": "tool", "tool_call_id": tool.id, "content": "24℃"})
message = send_messages(messages)
print(f"Model>\t {message.content}")
```

Flow: user asks → model returns function call → user executes + returns result as `role:"tool"` with `tool_call_id` → model answers in natural language.

> The model does not execute functions itself; the user must provide the implementation.

## Thinking Mode

From DeepSeek-V3.2 the API supports tool use in thinking mode (see Thinking Mode guide).

## strict Mode (Beta)

- Requires `base_url="https://api.deepseek.com/beta"`.
- All `function` in `tools` must set `strict:true`.
- Server validates the Function JSON Schema; invalid/unsupported schema returns an error.

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "strict": true,
    "description": "Get weather of a location, the user should supply a location first.",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string", "description": "The city and state, e.g. San Francisco, CA" }
      },
      "required": ["location"],
      "additionalProperties": false
    }
  }
}
```

### Supported JSON Schema types in strict mode

- object, string, number, integer, boolean, array, enum, anyOf.

Constraints:
- **object**: every property must be `required`, `additionalProperties` must be `false`.
- **string**: supports `pattern`, `format` (email, hostname, ipv4, ipv6, uuid). Unsupported: `minLength`, `maxLength`.
- **number/integer**: supports `const`, `default`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`.
- **array**: Unsupported: `minItems`, `maxItems`.
- **enum**: limited predefined options.
- **anyOf**: multiple valid formats.
- **$ref / $def**: reusable modules and recursive structures.