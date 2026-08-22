// MODULE:请求格式 API的原始请求格式 #LaMManager
import type { DeepseekRequest } from './Deepseek';
import type { GeminiRequest } from './Gemini';
import type { GLMRequest } from './GLM';
import type { OpenAIChatRequest } from './OpenAIChat';
import type { OpenAITextRequest } from './OpenAIText';

export * from './Deepseek';
export * from './GLM';
export * from './OpenAIChat';
export * from './OpenAIText';
export * from './Gemini';
export * from './GeminiCompat';


/**任何Deepseek厂商的格式 */
export type AnyDeepseekRequest = DeepseekRequest;
/**任何GLM厂商的格式 */
export type AnyGLMRequest = GLMRequest;
/**任何Openai厂商的格式 */
export type AnyOpenAIRequest = OpenAIChatRequest|OpenAITextRequest;
/**任何Gemini厂商的格式 */
export type AnyGeminiRequest = GeminiRequest;

/**任何遵从OpenAI Api 鉴权方式 的请求的格式 */
export type AnyOpenAILikeRequest = AnyOpenAIRequest|AnyDeepseekRequest|AnyGLMRequest;

/**任何遵从OpenAI Api Chat格式 的请求的格式 */
export type AnyOpenAIChatLikeRequest = OpenAIChatRequest|AnyDeepseekRequest|AnyGLMRequest;

/**任何文本完成模型的配置 */
export type AnyTextCompletionRequest = AnyDeepseekRequest|AnyOpenAIRequest|AnyGeminiRequest|AnyGLMRequest;