/** OpenAI 文本 API 回复格式 */
export type OpenAITextResponse = {
    /** 响应 ID */
    id: `cmpl-${string}`;
    /** 对象类型 */
    object: "text_completion";
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: string;
    /** 选项列表 */
    choices: TextChoice[];
    /** 用量统计 */
    usage: {
        /** 提示 token 数量 */
        prompt_tokens: number;
        /** 完成 token 数量 */
        completion_tokens: number;
        /** 总 token 数量 */
        total_tokens: number;
    };
};
/** 文本 API 选项格式 */
export type TextChoice = {
    /** 文本内容 */
    text: string;
    /** 索引 */
    index: number;
    /** 对数概率 */
    logprobs: any;
    /** 完成原因 */
    finish_reason: "stop" | "length";
};


export const OpenAITextResponseExample = {
    choices: [
        {
            finish_reason: "stop",
            index: 0,
            logprobs: null,
            text: "您好，有什么需要帮助的吗？",
        },
        {
            finish_reason: "stop",
            index: 1,
            logprobs: null,
            text: "您好，有什么需要帮助的吗？",
        },
    ],
    created: 1737382221,
    id: "cmpl-Armlpt8gE4zBYcKy8gel7TpRSdVud",
    model: "gpt-3.5-turbo-instruct",
    object: "text_completion",
    usage: { completion_tokens: 3289, prompt_tokens: 1849, total_tokens: 5138 },
} satisfies OpenAITextResponse;
