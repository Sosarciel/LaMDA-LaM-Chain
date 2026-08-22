import type { OpenAIChatAPIEntry, OpenAITool, OpenAIToolChoice } from "./OpenAIChat";
import { OpenAIChatAPIRole } from "./OpenAIChat";


/** GLM 模型 ID */
export type GLMModelID = "glm-5.1"|"glm-5-turbo"|"glm-5"|"glm-4.7"|"glm-4.6"|
    "glm-4.5-air"|"glm-4.5-airx"|"glm-4.5-flash";
/** GLM 模型请求格式 */
export type GLMRequest={
    /** 模型名称 */
    model: GLMModelID|string;
    /** 消息列表 */
    messages: GLMAPIEntry[];
    /** 最大生成 token 数 */
    max_tokens?: number;
    /** 温度参数 (0.0, 1.0] */
    temperature?: number;
    /** Top-P 采样参数 [0.01, 1.0] */
    top_p?: number;
    /** 停止序列 */
    stop?: string[]|null;
    /** 是否启用采样 */
    do_sample?: boolean;
    /** 思维链控制 */
    thinking?:{
        /** 是否开启思维链 */
        type:"enabled"|"disabled";
    };
    /** 可供模型调用的工具列表 */
    tools?: OpenAITool[];
    /** 工具调用控制 */
    tool_choice?: OpenAIToolChoice;
};

/** GLM API 消息条目 */
export type GLMAPIEntry=OpenAIChatAPIEntry;

export const GLMAPIRole = OpenAIChatAPIRole;
export type GLMAPIRole = OpenAIChatAPIRole;
