//https://developers.openai.com/api/reference/resources/completions/methods/create.md
import type { OpenAIUsage } from "./OpenAIChat";

/** Text API 对数概率信息 (平行数组结构 与 Chat API 的对象数组结构不同) */
export type OpenAITextLogprobs={
    /** 生成 token 的字符偏移 */
    text_offset?:number[];
    /** 生成 token 的对数概率 */
    token_logprobs?:number[];
    /** 生成的 token 列表 */
    tokens?:string[];
    /** 每个位置最可能 token 及其对数概率的映射 */
    top_logprobs?:Record<string,number>[]|null;
};

/** OpenAI 文本 API 回复格式 */
export type OpenAITextResponse = {
    /** 响应 ID */
    id: `cmpl-${string}`|string;
    /** 对象类型 */
    object: "text_completion";
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: string;
    /** 系统指纹 可配合 seed 监控后端变更 */
    system_fingerprint?: string;
    /** 选项列表 */
    choices: OpenAITextChoice[];
    /** 用量统计 与 Chat API 相等 直接复用 */
    usage: OpenAIUsage;
};
/** 文本 API 选项格式 */
export type OpenAITextChoice = {
    /** 文本内容 */
    text: string;
    /** 索引 */
    index: number;
    /** 对数概率 */
    logprobs: null|OpenAITextLogprobs;
    /** 完成原因 */
    finish_reason: "stop" | "length" | "content_filter";
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
