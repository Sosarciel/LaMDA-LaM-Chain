import type { DeepseekModelID } from "RequestFormat";

import type { OpenAILogprobToken } from "./OpenAIChat";
import type { OpenAITextChoice } from "./OpenAIText";


/** Deepseek 用量统计 基于 OpenAIUsage 收缩至 Deepseek 实际返回的字段并扩展缓存命中
 * Chat 与 FIM(Text) 两端点的 usage 结构完全相等 共用此类型
 */
export type DeepseekUsage={
    /** 提示 token 数量 */
    prompt_tokens: number;
    /** 完成 token 数量 */
    completion_tokens: number;
    /** 总 token 数量 */
    total_tokens: number;
    /** 缓存命中的提示 token 数量 */
    prompt_cache_hit_tokens:number;
    /** 缓存未命中的提示 token 数量 (= prompt_tokens - prompt_cache_hit_tokens) */
    prompt_cache_miss_tokens:number;
    /** 提示 token 详情 仅含缓存 token 数量 */
    prompt_tokens_details?:{cached_tokens:number};
    /** 完成 token 详情 仅含推理 token 数量 */
    completion_tokens_details?:{reasoning_tokens?:number};
};

/** Deepseek 响应格式 */
export type DeepseekResponse = {
    /** 响应 ID */
    id: string;
    /** 选项列表 */
    choices: ChatChoice[];
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: DeepseekModelID|string;
    /** 对象类型 */
    object: "chat.completion";
    /** 用量统计 */
    usage: DeepseekUsage;
    /** 系统指纹 */
    system_fingerprint:string;
};
/** 聊天选项 */
type ChatChoice = {
    /** 完成原因 */
    finish_reason: "stop"|"length"|"content_filter"|"tool_calls"|"insufficient_system_resource";
    /** 索引 */
    index: number;
    /** 消息 */
    message: {
        /** 内容 */
        content: string|null;
        /** 推理内容 */
        reasoning_content?: string|null;
        /** 工具调用列表 */
        tool_calls?: DeepseekToolCall[];
        /** 角色 */
        role: "assistant";
    };
    /** 对数概率 */
    logprobs: null|{
        /** 内容 token 对数概率 */
        content: DeepseekLogprobToken[]|null;
        /** 推理内容 token 对数概率 */
        reasoning_content: DeepseekLogprobToken[]|null;
    };
};
/** Deepseek 工具调用项 */
type DeepseekToolCall = {
    /** 工具调用 ID */
    id: string;
    /** 工具类型 */
    type: "function";
    /** 函数调用信息 */
    function: {
        /** 函数名称 */
        name: string;
        /** 序列化的 JSON 参数字符串 */
        arguments: string;
    };
};
/** Deepseek 对数概率 token 与 OpenAI Chat API 的结构完全相等 直接复用 */
export type DeepseekLogprobToken = OpenAILogprobToken;

export type TimeoutLimit = {
    error: {
        message: "We were unable to start processing your request within the 900-second timeout limit. Please try again later."
    }
}
export type DeepseekErrorResponse = TimeoutLimit;

//https://api-docs.deepseek.com/zh-cn/api/create-completion
/** Deepseek FIM 补全选项 基于 OpenAI TextChoice
 * logprobs 平行数组结构与 OpenAI 相等 直接复用 finish_reason 扩展 insufficient_system_resource
 */
export type DeepseekTextChoice=OpenAITextChoice&{
    /** 完成原因 */
    finish_reason:"stop"|"length"|"content_filter"|"insufficient_system_resource";
};

/** Deepseek FIM 响应格式
 * @see doc/Deepseek/create-completion.md
 * usage 与 Chat 端点完全相等 直接复用 DeepseekUsage
 */
export type DeepseekTextResponse={
    /** 响应 ID */
    id:string;
    /** 对象类型 */
    object: "text_completion";
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: string;
    /** 选项列表 */
    choices:DeepseekTextChoice[];
    /** 用量统计 */
    usage:DeepseekUsage;
    /** 系统指纹 */
    system_fingerprint?:string;
};

export const DeepseekResponseExample = {
    id: "456a034b-6e31-4a4d-9548-e87b5d694ae0",
    object: "chat.completion",
    created: 1759123711,
    model: "deepseek-v4-pro",
    choices: [
        {
            index: 0,
            message: {
                role: "assistant",
                content: "你好，有什么需要帮助的吗？",
            },
            logprobs: null,
            finish_reason: "stop",
        },
    ],
    usage: {
        prompt_tokens: 2115,
        completion_tokens: 253,
        total_tokens: 2368,
        prompt_tokens_details: { cached_tokens: 0 },
        prompt_cache_hit_tokens: 0,
        prompt_cache_miss_tokens: 2115,
    },
    system_fingerprint: "fp_8333852bec_prod0820_fp8_kvcache",
} satisfies DeepseekResponse;
