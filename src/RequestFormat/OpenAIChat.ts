import type { AnyString, JObject } from "@zwa73/utils";



/** OpenAI 模型 ID 类型 */
export type OpenAIModelID = AnyString
    | "gpt-5" | "gpt-5-mini" | "gpt-5-nano" | "gpt-5-pro" | `gpt-5-${number}-${number}-${number}` | `gpt-5-chat-${number}-${number}-${number}`
    | "gpt-5.1" | "gpt-5.1-chat-latest"
    | "gpt-5.2" | "gpt-5.2-chat-latest" | "gpt-5-chat-latest" | "gpt-5.2-pro"
    | "gpt-4.1" | "gpt-4.1-mini" | "gpt-4.1-nano"
    | "gpt-4o" | "gpt-4o-2024-05-13" | "gpt-4o-mini" | "gpt-4o-audio-preview" | "gpt-4o-mini-audio-preview" | "gpt-4o-search-preview"
    | `gpt-3.5-turbo`
    | "gpt-audio" | "gpt-audio-mini"
    | "o1" | "o1-mini"| "o1-pro"
    | "o3" | "o3-mini"| "o3-pro"
    | "o4-mini" | "gpt-4o-mini-search-preview"
    | "gpt-5-search-api";

/** OpenAI 推理努力程度 */
export type OpenAIReasoningEffort = 'none'|'minimal'|'low'|'medium'|'high'|'xhigh';
/** OpenAI 对话请求格式 */
export type OpenAIChatRequest={
    /** 模型名称 */
    model: string;
    /** 消息列表 */
    messages: OpenAIChatAPIEntry[];
    /** 最大生成令牌数(已弃用，请使用 max_completion_tokens) */
    max_tokens?: number;
    /** 最大完成令牌数 */
    max_completion_tokens?: number;
    /** 推理努力程度 */
    reasoning_effort?: OpenAIReasoningEffort;
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
    /** Logit 偏置 */
    logit_bias?: Record<string, number>|null;
    /** 生成数量 */
    n?: number;
    /** 可供模型调用的工具列表 */
    tools?: OpenAITool[];
    /** 工具调用控制 */
    tool_choice?: OpenAIToolChoice;
};

/** OpenAI 工具选择配置 */
export type OpenAIToolChoice =
    | "none"
    | "auto"
    | "required"
    | {
        type: "function";
        function: {
            name: string;
        };
    };

/** 用户消息 */
export type OpenAIChatUserEntry = {
    /** 角色 */
    role: typeof OpenAIChatAPIRole.User;
    /** 消息内容 */
    content: string;
};

/** 系统消息 */
export type OpenAIChatSystemEntry = {
    /** 角色 */
    role: typeof OpenAIChatAPIRole.System;
    /** 消息内容 */
    content: string;
};

/** 助手消息 */
export type OpenAIChatAssistantEntry = {
    /** 角色 */
    role: typeof OpenAIChatAPIRole.Assistant;
    /** 消息内容 */
    content?: string | null;
    /** 模型发起的工具调用列表 */
    tool_calls?: OpenAIToolCall[];
};

/** 工具响应消息 */
export type OpenAIChatToolEntry = {
    /** 角色 */
    role: typeof OpenAIChatAPIRole.Tool;
    /** 工具调用 ID（必须与 assistant.tool_calls[].id 一致） */
    tool_call_id: string;
    /** 工具执行结果（字符串或序列化 JSON） */
    content: string;
};

/** OpenAI 对话 API 消息条目联合类型 */
export type OpenAIChatAPIEntry =
    | OpenAIChatUserEntry
    | OpenAIChatSystemEntry
    | OpenAIChatAssistantEntry
    | OpenAIChatToolEntry;


/** OpenAI 对话 API 角色枚举 */
export const OpenAIChatAPIRole = {
    /** 用户 */
    User:"user",
    /** 助手 */
    Assistant:"assistant",
    /** 系统 */
    System:"system",
    /** 工具 */
    Tool: "tool",
} as const;
export type OpenAIChatAPIRole = typeof OpenAIChatAPIRole[keyof typeof OpenAIChatAPIRole];

/** OpenAI 工具调用项 */
export type OpenAIToolCall = {
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

/** OpenAI 工具声明 */
export type OpenAITool = {
    /** 工具类型 */
    type: "function";
    /** 函数定义 */
    function: {
        /** 函数名称 */
        name: string;
        /** 函数描述 */
        description?: string;
        /** JSON Schema 参数描述 */
        parameters?: JObject;
        /** 是否启用严格 Schema 校验 */
        strict?: boolean | null;
    };
};