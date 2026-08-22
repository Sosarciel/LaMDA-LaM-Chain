







/** Google 错误响应格式 */
type Quota = {
    /** 错误信息 */
    error: {
        /** 错误代码 */
        code: 429;
        /** 错误消息 */
        message: "Resource has been exhausted (e.g. check quota).";
        /** 错误状态 */
        status: "RESOURCE_EXHAUSTED";
    };
};


export type GeminiErrorResponse = Quota;

/** 文本内容 */
type TextContent = {
    /** 文本内容 */
    text: string,
    /** 思考签名 */
    thoughtSignature?:string,
    /** 思考标记 true 表示这段文本是思维链而非真实输出 */
    thought?:boolean
};
/** 候选结果 */
type Candidate = {
    /** 内容 */
    content: {
        /** 消息部分列表 */
        parts: (TextContent)[],
        /** 角色 */
        role: "model",
    },
    /** 完成原因 */
    finishReason: "STOP"|string,
    /** 平均对数概率 */
    avgLogprobs: number,
}

/** 用量元数据 */
type UsageMetadata = {
    /** 提示 token 数量 */
    promptTokenCount: number,
    /** 候选 token 数量 */
    candidatesTokenCount: number,
    /** 总 token 数量 */
    totalTokenCount: number,
    /** 提示 token 详情 */
    promptTokensDetails: [
        {
            /** 模态 */
            modality: "TEXT",
            /** token 数量 */
            tokenCount: number,
        },
    ],
    /** 候选 token 详情 */
    candidatesTokensDetails: [
        {
            /** 模态 */
            modality: "TEXT",
            /** token 数量 */
            tokenCount: number,
        },
    ],
    /** 思考 token 数量 */
    thoughtsTokenCount: number
}

/** Gemini 响应格式 */
export type GeminiResponse = {
    /** 候选结果列表 */
    candidates:Candidate[],
    /** 用量元数据 */
    usageMetadata:UsageMetadata,
    /** 模型版本 */
    modelVersion:string,
}



export const GeminiResponseExample = {
    candidates: [
        {
            content: {
                parts: [
                    { text: '你好！ 你好吗？ (Nǐ hǎo! Nǐ hǎo ma?)  \n \nThis means "Hello! How are you?"  How can I help you today?\n', },
                ],
                role: "model",
            },
            finishReason: "STOP",
            avgLogprobs: -0.20637991370224371,
        },
    ],
    usageMetadata: {
        thoughtsTokenCount: 0,
        promptTokenCount: 5,
        candidatesTokenCount: 41,
        totalTokenCount: 46,
        promptTokensDetails: [
            {
                modality: "TEXT",
                tokenCount: 5,
            },
        ],
        candidatesTokensDetails: [
            {
                modality: "TEXT",
                tokenCount: 41,
            },
        ],
    },
    modelVersion: "gemini-1.5-flash",
} as const satisfies GeminiResponse;
