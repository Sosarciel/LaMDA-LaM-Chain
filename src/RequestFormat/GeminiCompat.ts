import type { OpenAIChatAPIEntry } from "./OpenAIChat";



//https://ai.google.dev/gemini-api/docs/openai?hl=zh-cn#extra-body
//https://api-gpt-ge.apifox.cn/210339408e0
/** Gemini OpenAI 兼容请求格式 */
export type GeminiCompatRequest={
    /** 模型名称 */
    model: string;
    /** 消息列表 */
    messages: GeminiCompatAPIEntry[];
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
    /** 额外请求体 */
    extra_body?:{
        /** Google 特定配置 */
        google?:{
            /** 思考配置 */
            thinking_config?:{
                /** 是否包含思考过程 */
                include_thoughts?: boolean,
                /** 思考预算 */
                thinking_budget?: number,
            }
        }
    }
    /** 推理努力程度，提供三个级别："low"、"medium" 和 "high"，分别对应于 1,024、8,192 和 24,576 个 token */
    reasoning_effort?:"low"|"medium"|"high";
};

/** Gemini 兼容 API 消息条目 */
export type GeminiCompatAPIEntry=OpenAIChatAPIEntry;
