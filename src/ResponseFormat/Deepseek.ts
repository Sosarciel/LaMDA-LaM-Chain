import type { DeepseekModelID } from "RequestFormat";


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
    usage: {
        /** 完成 token 数量 */
        completion_tokens: number;
        /** 提示 token 数量 */
        prompt_tokens: number;
        /** 总 token 数量 */
        total_tokens: number;
        /** 缓存命中的提示 token 数量 */
        prompt_cache_hit_tokens: number;
        /** 缓存未命中的提示 token 数量 */
        prompt_cache_miss_tokens: number;
        /** 提示 token 详情 */
        prompt_tokens_details: { cached_tokens: number };
        /** 完成 token 详情 */
        completion_tokens_details?: { reasoning_tokens?: number };
    };
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
/** Deepseek 对数概率 token */
type DeepseekLogprobToken = {
    /** token 文本 */
    token: string;
    /** token 的对数概率 */
    logprob: number;
    /** UTF-8 字节表示 */
    bytes: number[]|null;
    /** 最可能的 token 列表 */
    top_logprobs: DeepseekLogprobToken[];
};

export type TimeoutLimit = {
    error: {
        message: "We were unable to start processing your request within the 900-second timeout limit. Please try again later."
    }
}
export type DeepseekErrorResponse = TimeoutLimit;

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
