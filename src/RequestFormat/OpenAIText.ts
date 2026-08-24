//https://developers.openai.com/api/reference/resources/completions/methods/create.md

/** OpenAI 文本流式输出选项 */
export type OpenAITextStreamOptions={
    /** 为 true 时在 data: [DONE] 前传输一个含整请求 usage 统计的额外 chunk */
    include_usage?:boolean;
};

/** OpenAI 文本补全请求格式
 * @see doc/OpenAI/completions-create.md
 */
export type OpenAITextRequest = {
    /** 模型名称 gpt-3.5-turbo-instruct / davinci-002 / babbage-002 */
    model: string;
    /** 提示词 */
    prompt: string;
    /** 后缀文本（FIM模式 仅 gpt-3.5-turbo-instruct 支持） */
    suffix?: string|null;
    /** 最大生成 token 数 */
    max_tokens?: number|null;
    /** 温度参数 (0~2) */
    temperature?: number|null;
    /** Top-P 采样参数 */
    top_p?: number|null;
    /** 每个 prompt 生成的补全数量 */
    n?: number|null;
    /** 服务端生成 best_of 个候选并返回对数概率最高者 不可流式 必须大于 n */
    best_of?: number|null;
    /** 是否以 SSE 流式返回增量 以 data: [DONE] 结尾 */
    stream?: boolean|null;
    /** 流式输出选项 仅 stream=true 时可设置 */
    stream_options?: OpenAITextStreamOptions|null;
    /** 返回 top N(0~5) 最可能 token 的对数概率 始终包含采样 token 本身 */
    logprobs?: number|null;
    /** 是否在返回结果中包含原始 prompt */
    echo?: boolean|null;
    /** 停止序列 最多 4 个 返回文本不含停止序列 */
    stop?: string|string[]|null;
    /** 存在惩罚 (-2~2) */
    presence_penalty?: number|null;
    /** 频率惩罚 (-2~2) */
    frequency_penalty?: number|null;
    /** Logit 偏置 token ID -> -100~100 */
    logit_bias?: Record<string, number> | null;
    /** 随机种子 尽力采样确定性结果 */
    seed?: number|null;
    /** 终端用户标识 */
    user?: string;
};
