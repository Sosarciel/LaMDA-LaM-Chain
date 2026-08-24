import type { OpenAIChatAPIEntry, OpenAITool, OpenAIReasoningEffort } from "./OpenAIChat";
import { OpenAIChatAPIRole } from "./OpenAIChat";


//https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8.md
/** GLM 模型 ID
 * @see doc/Zhipu/chat-completion-api.zh-cn.md
 */
export type GLMModelID = "glm-5.3"|"glm-5.2"|"glm-5.1"|"glm-5-turbo"|"glm-5"|"glm-4.7"|
    "glm-4.7-flash"|"glm-4.7-flashx"|"glm-4.6"|"glm-4.5-air"|"glm-4.5-airx"|"glm-4.5-flash"|
    "glm-4-flash-250414"|"glm-4-flashx-250414";

/** GLM 推理强度档位 = OpenAIReasoningEffort + max 默认 max 仅 GLM-5.2 及以上模型支持
 * 映射由 API 服务端自动完成 无需程序处理:
 * - GLM-5.3: 仅支持 low/high/max 且强制思考不可关闭
 * - GLM-5.2: none/minimal 放弃思考 low/medium 映射为 high xhigh 映射为 max
 */
export type GLMReasoningEffort = OpenAIReasoningEffort|"max";

/** GLM 思维链控制 仅 GLM-4.5 及以上模型支持 */
export type GLMThinking={
    /** 是否开启思维链 默认 enabled
     * GLM-5.3 限制只能开启 由 reasoning_effort 控制强度
     * GLM-5.2/5.1/5/5-Turbo/4.6 开启后模型自动判断是否思考
     * GLM-4.7/4.5V 开启后强制思考
     */
    type:"enabled"|"disabled";
    /** 是否清除历史轮次的 reasoning_content 默认 true (GLM 特有)
     * false 时启用保留式思考(Preserved Thinking) 须在 messages 中完整、未修改、按原顺序透传历史 reasoning_content
     */
    clear_thinking?:boolean;
};

/** GLM 响应输出格式配置 仅文本模型支持 不支持 OpenAI 的 json_schema
 * @see doc/Zhipu/guide-struct-output.zh-cn.md
 */
export type GLMResponseFormat={
    type:"text";
}|{
    /** JSON 格式输出 期望的 JSON 结构通过 prompt 描述 客户端自行校验 */
    type:"json_object";
};

/** GLM 模型请求格式 */
export type GLMRequest={
    /** 模型名称 */
    model: GLMModelID|string;
    /** 消息列表 注意不能只包含系统消息或助手消息 */
    messages: GLMAPIEntry[];
    /** 最大生成 token 数 (1~131072) GLM-5.x/4.7/4.6 最大128K输出 建议不小于1024 */
    max_tokens?: number;
    /** 温度参数 [0.0, 1.0] 限两位小数 GLM-5.x/4.7/4.6 默认 1.0 GLM-4.5 系列默认 0.6 */
    temperature?: number;
    /** Top-P 采样参数 [0.01, 1.0] 限两位小数 默认 0.95 */
    top_p?: number;
    /** 停止词列表 最多 4 个 */
    stop?: string[]|null;
    /** 是否启用采样策略 默认 true false 时总选概率最高词汇且 temperature/top_p 被忽略 */
    do_sample?: boolean;
    /** 思维链控制 仅 GLM-4.5 及以上支持 */
    thinking?:GLMThinking;
    /** 推理程度 thinking 开启时生效 默认 max 仅 GLM-5.2 及以上模型支持 */
    reasoning_effort?: GLMReasoningEffort;
    /** 响应输出格式 仅文本模型支持 */
    response_format?: GLMResponseFormat;
    /** 是否以 SSE 流式返回增量 以 data: [DONE] 结尾 */
    stream?: boolean|null;
    /** 是否开启流式响应 Function Calls 默认 false 仅 GLM-5.x/5-Turbo/4.7/4.6 系列支持 */
    tool_stream?: boolean;
    /** 可供模型调用的工具列表 最多 128 个 function
     * 另原生支持 retrieval/web_search/mcp 工具类型 此处暂仅定义 function
     */
    tools?: OpenAITool[];
    /** 工具调用控制 仅支持 auto */
    tool_choice?: "auto";
    /** 请求唯一标识符 6~64 字符 建议 UUID 未提供时平台自动生成 */
    request_id?: string;
    /** 终端用户唯一标识符 6~128 字符 */
    user_id?: string;
};

/** GLM API 消息条目 */
export type GLMAPIEntry=OpenAIChatAPIEntry;

export const GLMAPIRole = OpenAIChatAPIRole;
export type GLMAPIRole = OpenAIChatAPIRole;
