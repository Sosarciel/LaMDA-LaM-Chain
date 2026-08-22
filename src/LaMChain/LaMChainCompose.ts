import { lazyFunction, UtilFP, UtilFunc } from "@zwa73/utils";

import type { Interactor } from "Interactor";
import { GeminiPostTool, OpenAiPostTool } from "Interactor";
import type { AnyOpenAIChatLikeRequest, AnyOpenAILikeRequest, GeminiRequest, OpenAITextRequest } from "RequestFormat";
import type { AnyGeminiResponse, AnyOpenAIChatLikeResponse, AnyOpenAIResponse, GeminiResponse, OpenAITextResponse } from "ResponseFormat";

import type { LaMPostRequestFunc } from "./Interface";
import { LaMChainFunc } from "./LaMChainFunc";
import { LaMChainInteractor } from "./LaMChainInteractor";


/**偏函数化与快捷包装 */
export namespace LaMChainCompose{

/**简易发送OpenAI Chat API 请求 */
export const simpleOpenAIChatRequest = lazyFunction(()=>UtilFP.flow(
    LaMChainCompose.postOpenAIChatRequest,
    async res => LaMChainFunc.reduceRepeatResult(res),
    LaMChainFunc.extractOpenAIChatResponseSingle,
    v=>v ?? undefined,
));

/**简易发送OpenAI Chat API 请求, 带有工具*/
export const simpleOpenAIChatToolCallRequest = lazyFunction(()=>UtilFP.flow(
    (v: Omit<Parameters<typeof LaMChainInteractor.processOpenAIChatToolLoop>[0],'resp'>)=>
        ({ ...v,json:{...v.json,tools:v.json.tools ?? LaMChainFunc.toOpenAITools(v.tool) } }),
    UtilFP.bind('firstResp',async v=>LaMChainCompose.postOpenAIChatRequest(v)),
    UtilFP.bind('resp',async v=>LaMChainFunc.reduceRepeatResult(v.firstResp)),
    LaMChainInteractor.processOpenAIChatToolLoop,
    LaMChainFunc.extractOpenAIChatResponseSingle,
    v=>v ?? undefined,
));


/**发送Gemini API 请求 */
export const postGeminiRequest = (UtilFunc.partialize(LaMChainInteractor.postRequest<GeminiRequest,GeminiResponse>,{
    interactor:GeminiPostTool
})) satisfies LaMPostRequestFunc<GeminiRequest,GeminiResponse>;
/**发送OpenAI API 请求 */
export const postOpenAIRequest = (UtilFunc.partialize(LaMChainInteractor.postRequest<AnyOpenAILikeRequest,AnyOpenAIResponse>,{
    interactor:OpenAiPostTool
})) satisfies LaMPostRequestFunc<AnyOpenAILikeRequest,AnyOpenAIResponse>;
/**发送OpenAI Chat API 请求 */
export const postOpenAIChatRequest = (UtilFunc.partialize(LaMChainInteractor.postRequest<AnyOpenAIChatLikeRequest,AnyOpenAIChatLikeResponse>,{
    interactor:OpenAiPostTool as Interactor<AnyOpenAIChatLikeResponse>
})) satisfies LaMPostRequestFunc<AnyOpenAIChatLikeRequest,AnyOpenAIChatLikeResponse>;
/**发送OpenAI Text API 请求 */
export const postOpenAITextRequest = (UtilFunc.partialize(LaMChainInteractor.postRequest<OpenAITextRequest,OpenAITextResponse>,{
    interactor:OpenAiPostTool as Interactor<OpenAITextResponse>
})) satisfies LaMPostRequestFunc<OpenAITextRequest,OpenAITextResponse>;


/**计费Gemini API 返回值 */
export const recordGeminiCost = UtilFunc.partialize(LaMChainFunc.recordCost<AnyGeminiResponse>,{computeUsage:LaMChainFunc.computeGeminiUsage});
/**计费OpenAI Chat API 返回值 */
export const recordOpenAICost = UtilFunc.partialize(LaMChainFunc.recordCost<AnyOpenAIResponse>,{computeUsage:LaMChainFunc.computeOpenAIUsage});


}