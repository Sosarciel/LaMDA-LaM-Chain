import type { GLMModelID } from "RequestFormat";


/** GLM 响应格式 */
export type GLMResponse = {
    /** 响应 ID */
    id: string;
    /** 请求 ID */
    request_id?: string;
    /** 创建时间戳 */
    created: number;
    /** 模型名称 */
    model: GLMModelID|string;
    /** 选项列表 */
    choices: GLMChatChoice[];
    /** 用量统计 */
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        /** 命中缓存的 Token 数量 */
        prompt_tokens_details?: { cached_tokens: number };
    };
    /** 内容安全相关信息 */
    content_filter?: {
        /** 安全生效环节 assistant=模型推理 user=用户输入 history=历史上下文 */
        role:"assistant"|"user"|"history";
        /** 严重程度 0-3 0最严重 3轻微 */
        level:number;
    }[];
    /** 网页搜索结果 使用 web_search 工具时返回 */
    web_search?: {
        /** 来源网站图标 */
        icon?:string;
        /** 搜索结果的标题 */
        title:string;
        /** 搜索结果的网页链接 */
        link:string;
        /** 搜索结果网页的媒体来源名称 */
        media?:string;
        /** 网站发布时间 */
        publish_date?:string;
        /** 搜索结果网页引用的文本内容 */
        content?:string;
        /** 角标序号 */
        refer?:string;
    }[];
};

/** GLM 聊天选项 */
type GLMChatChoice = {
    /** 消息 */
    message: {
        /** 角色 */
        role: "assistant";
        /** 内容 */
        content?: string|null;
        /** 推理内容 */
        reasoning_content?: string;
        /** 工具调用列表 */
        tool_calls?: GLMToolCall[];
    };
    /** 完成原因 */
    finish_reason: "stop"|"tool_calls"|"length"|"sensitive"|"model_context_window_exceeded"|"network_error";
    /** 索引 */
    index: number;
};
/** GLM 工具调用项 */
type GLMToolCall = {
    /** 工具调用 ID */
    id: string;
    /** 工具类型 */
    type: "function";
    /** 函数调用信息 */
    function: {
        /** 函数名称 */
        name: string;
        /** 函数调用参数
         * zhipu openapi 定义为 object, 兼容 string 形式
         */
        arguments: string|object;
    };
};

export const GLMResponseExample = {
    id: "8803848869aad374",
    created: 1677723290,
    model: "glm-4.7",
    request_id: "8803848869aad374",
    choices: [
        {
            index: 0,
            message: { role: "assistant", content: "你好，有什么需要帮助的吗？" },
            finish_reason: "stop",
        },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
} satisfies GLMResponse;
