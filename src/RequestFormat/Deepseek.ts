import type { OpenAIChatAPIEntry, OpenAIChatAssistantEntry, OpenAITool, OpenAIToolChoice } from "./OpenAIChat";
import { OpenAIChatAPIRole } from "./OpenAIChat";
import type { OpenAITextRequest } from "./OpenAIText";


//https://api-docs.deepseek.com/zh-cn/api/create-chat-completion
/** Deepseek 模型 ID
 * @see doc/Deepseek/chat-completion-api.md
 */
export type DeepseekModelID = "deepseek-v4-flash"|"deepseek-v4-pro"|"deepseek-v4-flash-vision-exp";

/** Deepseek 响应输出格式配置 仅支持 text/json_object 不支持 OpenAI 的 json_schema
 * @see doc/Deepseek/guide-json_mode.md
 */
export type DeepseekResponseFormat={
    type:"text";
}|{
    /** JSON 模式 保证输出合法 JSON 需在 system/user 消息中指示模型生成 JSON */
    type:"json_object";
};

/** Deepseek 流式输出选项 */
export type DeepseekStreamOptions={
    /** 为 true 时在 data: [DONE] 前传输一个含整请求 usage 统计的额外 chunk 其 choices 为空数组 */
    include_usage?:boolean;
};

/** Deepseek 思考模式控制
 * @see doc/Deepseek/guide-thinking_mode.md
 */
export type DeepseekThinking={
    /** 是否开启思考 默认 enabled */
    type:"enabled"|"disabled";
    /** 控制模型的推理强度 默认 high
     * 出于兼容考虑 medium、xhigh 会映射为 high
     */
    reasoning_effort?:DeepseekReasoningEffort;
};

/** Deepseek 推理强度档位
 * 实际映射: medium->high xhigh->high
 */
export type DeepseekReasoningEffort = "low"|"medium"|"high"|"xhigh"|"max";

/** Deepseek 模型请求格式 */
export type DeepseekRequest={
    /** 模型名称 */
    model: DeepseekModelID|string;
    /** 消息列表 */
    messages: DeepseekAPIEntry[];
    /** 最大生成 token 数 */
    max_tokens?: number;
    /** 温度参数 (0~2, 默认 1) 思考模式下不生效 */
    temperature?: number;
    /** Top-P 采样参数 (0~1, 默认 1) 思考模式下不生效 */
    top_p?: number;
    /** 停止序列 string 或最多 16 个 string 的 list */
    stop?: string[]|null;
    /** 存在惩罚 已弃用 传入不再产生任何效果 */
    presence_penalty?: number;
    /** 频率惩罚 已弃用 传入不再产生任何效果 */
    frequency_penalty?: number;
    /** 推理强度 兼容 OpenAI SDK 的顶层写法 等价于 thinking.reasoning_effort
     * @deprecated 优先使用 thinking.reasoning_effort (API Schema 权威定义)
     */
    reasoning_effort?: DeepseekReasoningEffort;
    /** 思考模式控制 */
    thinking?:DeepseekThinking;
    /** 响应输出格式 仅支持 text/json_object
     * @see doc/Deepseek/guide-json_mode.md
     */
    response_format?: DeepseekResponseFormat;
    /** 是否以 SSE 流式返回增量 以 data: [DONE] 结尾 */
    stream?: boolean|null;
    /** 流式输出选项 仅 stream=true 时可设置 */
    stream_options?: DeepseekStreamOptions|null;
    /** 是否返回输出 token 的对数概率 */
    logprobs?: boolean|null;
    /** 每个位置返回 top N(0~20) token 的对数概率 需 logprobs=true */
    top_logprobs?: number|null;
    /** 自定义用户标识 字符集 [a-zA-Z0-9\-_] 最大512 用于内容安全/KVCache隔离/调度隔离 */
    user_id?: string|null;
    /** 可供模型调用的工具列表 最多 128 个 function */
    tools?: OpenAITool[];
    /** 工具调用控制 无 tools 时默认 none 有 tools 时默认 auto */
    tool_choice?: OpenAIToolChoice;
};

/** Deepseek assistant 消息条目 扩展 prefix 与 reasoning_content
 * @see doc/Deepseek/guide-chat_prefix_completion.md
 */
export type DeepseekAssistantEntry=OpenAIChatAssistantEntry&{
    /** (Beta) 强制模型以此 assistant 消息中的前缀内容开始回答 需 base_url=https://api.deepseek.com/beta */
    prefix?:boolean;
    /** (Beta) 思考模式下对话前缀续写时作为最后一条 assistant 思维链内容的输入 使用时 prefix 必须为 true */
    reasoning_content?:string|null;
    /** 参与者名称 区分相同角色的参与者 */
    name?:string;
};

/** Deepseek API 消息条目 user/system/tool 与 OpenAI 相同 assistant 为扩展版 */
export type DeepseekAPIEntry=
    Exclude<OpenAIChatAPIEntry,OpenAIChatAssistantEntry>
    |DeepseekAssistantEntry;

//https://api-docs.deepseek.com/zh-cn/api/create-completion
/** Deepseek FIM 补全请求格式
 * OpenAITextRequest 的子集 缺失字段直接复用 OpenAI 定义 不支持 best_of/n/logit_bias/seed/user
 * @see doc/Deepseek/create-completion.md
 * 需 base_url=https://api.deepseek.com/beta
 */
export type DeepseekTextRequest=Omit<OpenAITextRequest,
    "model"|"n"|"best_of"|"logit_bias"|"seed"|"user"
>&{
    /** 模型名称 FIM 仅支持 deepseek-v4-pro */
    model:DeepseekModelID|string;
};

export const DeepseekAPIRole = OpenAIChatAPIRole;
export type DeepseekAPIRole = OpenAIChatAPIRole;