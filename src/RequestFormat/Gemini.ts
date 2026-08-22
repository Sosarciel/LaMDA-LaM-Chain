

/** Gemini API 请求格式 */
export type GeminiRequest={
    /** 系统指令 */
    system_instruction:{parts:{text: string}};
    /** 对话内容列表 */
    contents:GeminiAPIEntry[];
    /** 生成配置 */
    generationConfig:{
        /** 停止序列 */
        stopSequences: string[]|undefined;
        /** 温度参数 */
        temperature?: number|undefined;
        /** 最大输出 token 数 */
        maxOutputTokens?: number|undefined;
        /** Top-P 采样参数 */
        topP?: number|undefined;
        /** Top-K 采样参数 */
        topK?: number|undefined;
        /** 思考预算 */
        thinkingBudget?: number|undefined;
        /** 思考配置 */
        thinkingConfig?: {
            /** 思考预算 */
            thinkingBudget:number|undefined;
            /** 是否返回明文思考过程，默认返回思考 key */
            includeThoughts:boolean|undefined;
        }
    };
    /** 安全设置 */
    safetySettings?:{
        category:GeminiHarmCategory;
        threshold:GeminiHarmBlockThreshold;
    }[];
}

/** Gemini API 消息条目 */
export type GeminiAPIEntry={
    /** 角色 */
    role: GeminiAPIRole;
    /** 消息部分列表 */
    parts:[{text:string}];
}

/** Gemini API 角色枚举 */
export const GeminiAPIRole = {
    /** 用户角色 */
    User:"user",
    /** 模型角色 */
    Model:"model",
} as const;
export type GeminiAPIRole = typeof GeminiAPIRole[keyof typeof GeminiAPIRole];

/** 用于 Gemini API 的消息数据 */
export type GeminiApiData = {
    /** 消息列表 */
    message:GeminiAPIEntry[];
    /** 定义 */
    define :string;
}

/** Gemini API 安全设置 */
export const GeminiHarmCategoryList = [
    //"HARM_CATEGORY_UNSPECIFIED"         , //未指定类别。
    //"HARM_CATEGORY_DEROGATORY"          , //PaLM - 针对身份和/或受保护属性的负面或有害评论。
    //"HARM_CATEGORY_TOXICITY"            , //PaLM - 粗鲁、无礼或亵渎性的内容。
    //"HARM_CATEGORY_VIOLENCE"            , //PaLM - 描述描绘针对个人或团体的暴力行为的场景，或一般性血腥描述。
    //"HARM_CATEGORY_SEXUAL"              , //PaLM - 包含对性行为或其他淫秽内容的引用。
    //"HARM_CATEGORY_MEDICAL"             , //PaLM - 宣传未经核实的医疗建议。
    //"HARM_CATEGORY_DANGEROUS"           , //PaLM - 宣扬、助长或鼓励有害行为的危险内容。
    "HARM_CATEGORY_HARASSMENT"          , //Gemini - 骚扰内容。
    "HARM_CATEGORY_HATE_SPEECH"         , //Gemini - 仇恨言论和内容。
    "HARM_CATEGORY_SEXUALLY_EXPLICIT"   , //Gemini - 露骨色情内容。
    "HARM_CATEGORY_DANGEROUS_CONTENT"   , //Gemini - 危险内容。
] as const;
/** Gemini API 安全设置 */
export type GeminiHarmCategory = typeof GeminiHarmCategoryList[number];

/** Gemini API 安全拦截阈值设置 */
export const GeminiHarmBlockThresholdList = [
    "HARM_BLOCK_THRESHOLD_UNSPECIFIED"  , // 阈值未指定，将使用默认阈值进行屏蔽。
    "BLOCK_LOW_AND_ABOVE"              , // 当不安全内容的可能性为低、中或高时屏蔽。
    "BLOCK_MEDIUM_AND_ABOVE"           , // 当不安全内容的可能性为中等或较高时屏蔽（通常是默认值）。
    "BLOCK_ONLY_HIGH"                  , // 仅在出现不安全内容的概率极高时屏蔽。
    "BLOCK_NONE"                       , // 无论不安全内容的可能性如何，一律显示（不屏蔽）。
    "OFF"                              , // 完全关闭安全过滤条件（适用于最新版模型，部分地区可用）。
] as const;

/** Gemini API 安全拦截阈值类型 */
export type GeminiHarmBlockThreshold = typeof GeminiHarmBlockThresholdList[number];
