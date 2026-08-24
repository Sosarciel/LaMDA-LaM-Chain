// MODULE:响应格式 API的原始响应格式 #LaMManager
import type { DeepseekErrorResponse, DeepseekChatResponse, DeepseekTextResponse } from './Deepseek';
import type { ForwardErrorResponse } from './ForwardError';
import type { GeminiErrorResponse, GeminiResponse } from './Gemini';
import type { GLMChatResponse } from './GLM';
import type { OpenAIChatResponse } from './OpenAIChat';
import type { OpenAIErrorResponse } from './OpenAIError';
import type { OpenAITextResponse } from './OpenAIText';


export * from './Deepseek';
export * from './ForwardError';
export * from './GLM';
export * from './Gemini';
export * from './OpenAIChat';
export * from './OpenAIText';
export * from './OpenAIError';


/**任何 OpenAI Chat 风格 API 接口的回复格式 */
export type AnyOpenAIChatLikeResponse = OpenAIChatResponse|DeepseekChatResponse|GLMChatResponse;

/**任何 OpenAI Text 风格 API 接口的回复格式 */
export type AnyOpenAITextLikeResponse = OpenAITextResponse|DeepseekTextResponse;

/**任何 OpenAI API 接口的回复格式*/
export type AnyOpenAIResponse = AnyOpenAIChatLikeResponse|OpenAITextResponse;
/**任何 Deepseek API 接口的回复格式 */
export type AnyDeepseekResponse = DeepseekChatResponse|DeepseekTextResponse;

/**任何 GLM API 接口的回复格式 */
export type AnyGLMResponse = GLMChatResponse;

/**任何 Gemini API 接口的回复格式 */
export type AnyGeminiResponse = GeminiResponse;

/**任何 文本完成 API 接口的回复格式 */
export type AnyTextCompletionResponse = AnyOpenAIResponse|AnyGeminiResponse|AnyDeepseekResponse|AnyGLMResponse;

/**任何 OpenAI对话风格 API 接口的错误格式 */
export type AnyOpenAILikeErrorResponse = OpenAIErrorResponse|DeepseekErrorResponse|ForwardErrorResponse;
export type AnyGeminiLikeErrorResponse = ForwardErrorResponse|GeminiErrorResponse;
export type AnyErrorResponse = AnyOpenAILikeErrorResponse|AnyGeminiLikeErrorResponse;