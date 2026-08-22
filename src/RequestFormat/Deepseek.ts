import type { OpenAIChatAPIEntry, OpenAITool, OpenAIToolChoice } from "./OpenAIChat";
import { OpenAIChatAPIRole } from "./OpenAIChat";


//https://api-docs.deepseek.com/zh-cn/api/create-chat-completion
/** Deepseek 模型 ID */
export type DeepseekModelID = "deepseek-v4-flash"|"deepseek-v4-pro";
/** Deepseek 模型请求格式 */
export type DeepseekRequest={
    /** 模型名称 */
    model: DeepseekModelID|string;
    /** 消息列表 */
    messages: DeepseekAPIEntry[];
    /** 最大生成 token 数 */
    max_tokens?: number;
    /** 温度参数 */
    temperature?: number;
    /** Top-P 采样参数 */
    top_p?: number;
    /** 停止序列 */
    stop?: string[]|null;
    /** 存在惩罚 */
    presence_penalty?: number;
    /** 频率惩罚 */
    frequency_penalty?: number;
    /** 思考控制 */
    thinking?:{
        /** 是否开启思考 默认 enbale */
        type:"enabled"|"disabled";
    },
    /**控制模型的推理强度
     * 对普通请求，默认为 high
     * 对一些复杂 Agent 类请求（如 Claude Code、OpenCode），自动设置为 max
     * 出于兼容考虑 low、medium 会映射为 high, xhigh 会映射为 max
     */
    reasoning_effort?:"high"|"max"|"low";
    /** 可供模型调用的工具列表 */
    tools?: OpenAITool[];
    /** 工具调用控制 */
    tool_choice?: OpenAIToolChoice;
};

/** Deepseek API 消息条目 */
export type DeepseekAPIEntry={
    /** 角色 */
    role: OpenAIChatAPIRole;
    /** 消息内容 */
    content:string;
    /** 指定为前缀补全模式 */
    prefix?:boolean;
}|OpenAIChatAPIEntry;

export const DeepseekAPIRole = OpenAIChatAPIRole;
export type DeepseekAPIRole = OpenAIChatAPIRole;