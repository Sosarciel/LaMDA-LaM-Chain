/** OpenAI 聊天 API 回复格式 */
export type OpenAIChatResponse = {
    /** 响应 ID */
    id: `chatcmpl-${string}`;
    /** 对象类型 */
    object: "chat.completion";
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: string;
    /** 系统指纹 */
    system_fingerprint: null|`fp_${string}`;
    /** 用量统计 */
    usage: {
        /** 提示 token 数量 */
        prompt_tokens: number;
        /** 完成 token 数量 */
        completion_tokens: number;
        /** 总 token 数量 */
        total_tokens: number;
        /** 提示 token 详情 */
        prompt_tokens_details?: {
			/** 缓存 token 数量 */
			cached_tokens?: number;
			/** 音频 token 数量 */
			audio_tokens?: number;
		},
		/** 完成 token 详情 */
		completion_tokens_details?: {
			/** 推理 token 数量 */
			reasoning_tokens?: number;
			/** 音频 token 数量 */
			audio_tokens?: number;
			/** 接受的预测 token 数量 */
			accepted_prediction_tokens?: number;
			/** 拒绝的预测 token 数量 */
			rejected_prediction_tokens?: number;
		}
    };
    /** 选项列表 */
    choices: ChatChoice[];
};
/** 聊天 API 选项格式 */
type ChatChoice = {
    /** 完成原因 */
    finish_reason: "stop" | "length" | "content_filter" | "tool_calls";
    /** 索引 */
    index: number;
    /** 消息 */
    message: {
        /** 角色 */
        role: "assistant";
        /** 内容 */
        content?: string|null;
        /** 工具调用列表 */
        tool_calls?: ChatToolCall[];
    };
};

/** OpenAI 工具调用项 */
type ChatToolCall = {
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

export const OpenAIChatResponseExample = {
    id: "chatcmpl-An5LfoXnmT2WpgSRREQyp8tilpYRd",
    system_fingerprint: "fp_5154047bf2",
    object: "chat.completion",
    created: 1677723290,
    model: "gpt-3.5-turbo-0301",
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    choices: [
        {
            message: { role: "assistant", content: "您好，有什么需要帮助的吗？" },
            finish_reason: "stop",
            index: 0,
        },
        {
            message: { role: "assistant", content: "您好，有什么需要帮助的吗？" },
            finish_reason: "stop",
            index: 1,
        },
    ],
} satisfies OpenAIChatResponse;

/** Tool Call（函数调用）回复样例 */
export const OpenAIChatToolCallResponseExample = {
    id: "chatcmpl-Bn8KfoYnmT2WpgSRREQyp8tilpYRd",
    system_fingerprint: "fp_5154047bf2",
    object: "chat.completion",
    created: 1677723300,
    model: "gpt-4o",
    usage: {
        prompt_tokens: 58,
        completion_tokens: 22,
        total_tokens: 80,
        prompt_tokens_details: { cached_tokens: 0 },
    },
    choices: [
        {
            message: {
                role: "assistant",
                content: null,
                tool_calls: [
                    {
                        id: "call_98xAbc123weather",
                        type: "function",
                        function: {
                            name: "get_weather",
                            arguments: "{\"city\":\"上海\"}",
                        },
                    },
                ],
            },
            finish_reason: "tool_calls",
            index: 0,
        },
    ],
} satisfies OpenAIChatResponse;