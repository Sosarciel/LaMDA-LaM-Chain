import type { JToken, MPromise, PromiseRetryResult } from "@zwa73/js-utils";
import { memoize, SLogger, UtilFunc } from "@zwa73/utils";

import type { AnyOpenAILikeRequest, OpenAITool } from "RequestFormat";
import type { AnyGeminiResponse, AnyOpenAIChatLikeResponse, AnyOpenAIResponse } from "ResponseFormat";
import type { TokensizerType } from "Tokensizer";
import { getTokensizer } from "Tokensizer";

import type { CredProvider, LaMComputeUsageFunc, ModelPrice, ModelUsage, SourceProvider, ToolProvider } from "./Interface";

/**函数 */
export namespace LaMChainFunc{

/**剔除重试结果 */
export const reduceRepeatResult = async <T>(t:MPromise<PromiseRetryResult<T>>) => (await t)?.completed;
/**提取OpenAI Chat API 返回值 */
export const extractOpenAIChatResponseSingle = async (t:MPromise<undefined | AnyOpenAIChatLikeResponse>) =>
    (await t)?.choices?.[0]?.message?.content;

/**计算价格 */
export const computeCost = (param:{
    /**模型价格 */
    price:ModelPrice;
    /**模型使用量 */
    usage:ModelUsage;
})=>{
    const {price,usage} = param;
    //如果没有miss则认为全是hit
    const missPromptCount = usage.promptCacheMissTokens ?? usage.promptTokens ?? 0;
    //如果没有miss则直接跳过hit统计
    const hitPromptCount = usage.promptCacheMissTokens == undefined
        ? 0 : usage.promptCacheHitTokens ?? 0;
    const completionCount = usage.completionTokens ?? 0;

    const {
        completionPrice = 0,
        promptPrice: missPromptPrice = 0,
    } = price;

    //如果没有设置cacheHitPromptPrice则使用promptPrice
    const hitPromptPrice = price.cacheHitPromptPrice ?? missPromptPrice;

    const totalPrice =
        (missPromptCount * missPromptPrice)+
        (hitPromptCount  * hitPromptPrice )+
        (completionCount * completionPrice);
    if(isNaN(totalPrice)){
        SLogger.error(`computeCost 错误 无法计算价格 usage:`,usage);
        return 0;
    }
    return totalPrice;
};

/**递归剔除对象中所有值为 undefined 的属性
 * 用于清理 formatOption 等构建的请求对象, 避免携带无意义字段
 */
export const stripUndefined = <T extends JToken>(value: T): T => {
    if (Array.isArray(value))
        return value.map(stripUndefined) as T;
    if (value !== null && typeof value === "object") {
        const out: Record<string, JToken> = {};
        for (const [k, v] of Object.entries(value as Record<string, JToken>)) {
            if (v !== undefined) out[k] = stripUndefined(v);
        }
        return out as T;
    }
    return value;
};

/** 从 Provider 提取 OpenAI tools 请求参数 */
export const toOpenAITools = (tool: ToolProvider) => {
    return tool.tools.map(t => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
            strict: t.strict,
        },
    }) satisfies OpenAITool);
};

//#region 计费
/**计费 */
export const recordCost = async <T>(param:{
    /**凭据提供者 */
    cred:CredProvider;
    /**模型价格 */
    price?:ModelPrice;
    /**响应 */
    resp?:T;
    /**计算函数 */
    computeUsage:LaMComputeUsageFunc<T>;
    /**是否打印使用量 */
    logUsage?:boolean;
})=>{
    const {cred,price,resp,computeUsage,logUsage} = param;
    if (resp == undefined || price == undefined || cred.recordCost == undefined)
        return;
    await cred.recordCost?.(computeCost({price,usage:computeUsage(resp)}));
    //打印理论的当前使用量
    if(logUsage) await cred.currUsage?.();
};

/**计算gemini使用量 */
export const computeGeminiUsage = ((resp:AnyGeminiResponse)=>{
    const {usageMetadata} = resp;
    if(usageMetadata==null){
        void SLogger.error(`computeGeminiUsage 错误 未找到 usageMetadata, resp:`,resp);
        return {} as ModelUsage;
    }

    return {
        completionTokens :(usageMetadata.candidatesTokenCount??0) + (usageMetadata.thoughtsTokenCount??0),
        promptTokens     :usageMetadata.promptTokenCount??0,
    } satisfies ModelUsage;
}) satisfies LaMComputeUsageFunc<AnyGeminiResponse>;
/**计算openai使用量 */
export const computeOpenAIUsage = ((resp:AnyOpenAIResponse)=>{
    const {usage} = resp;
    if(usage==null){
        void SLogger.error(`computeOpenAIUsage 错误 未找到 usage, resp:`,resp);
        return {} as ModelUsage;
    }

    const hitTokens = ('prompt_cache_hit_tokens' in usage ? usage.prompt_cache_hit_tokens : undefined) ??
        ('prompt_tokens_details' in usage ? usage.prompt_tokens_details?.cached_tokens : undefined);

    const missTokens = ('prompt_cache_miss_tokens' in usage ? usage.prompt_cache_miss_tokens : undefined);

    return {
        completionTokens       : usage.completion_tokens??0,
        promptTokens           : usage.prompt_tokens??0,
        promptCacheHitTokens   : hitTokens,
        promptCacheMissTokens  : missTokens,
    } satisfies ModelUsage;
}) satisfies LaMComputeUsageFunc<AnyOpenAIResponse>;
//#endregion



//#region source标准化
/**依照source将option转为对应source的异构格式, 例硅基流动 */
export const specializeOpenAILikeRequest = <T extends AnyOpenAILikeRequest>(param:{
    /**请求体 */
    json:T;
    /**来源提供者 */
    source:SourceProvider;
})=>{
    const {json,source} = param;
    const out = {...json};
    if(UtilFunc.checkSharpSchema(out,{model:"string"})){
        //如果存在id映射则直接替换opt的model
        const mapname = source.modelIdMap?.[out.model];
        if(mapname!=null) out.model = mapname;
    }
    return out;
};

/**依照source将modid转为对应source的异构格式, 例硅基流动 */
export const specializeModelId = (param:{
    /**模型id */
    modelId:string;
    /**来源提供者 */
    source:SourceProvider;
})=>{
    const {modelId,source} = param;
    return source.modelIdMap?.[modelId] ?? modelId;
};
//#endregion

//#region token计算
/**token计算函数 */
export const computeTokenCount = memoize(async (param:{
    text:string,tokensizerType:TokensizerType
}):Promise<number>=>{
    const {text,tokensizerType} = param;
    const tokenizer = getTokensizer(tokensizerType);
    return (await tokenizer.encode(text)).length;
},60_000);

/**token化logit_bias 参数
 * @param rawLogitBias   - 未tokenize的原始 logit_bias 参数
 * @param tokensizerType - 令牌化器类型
 * @returns logit_bias 参数
 */
export const tokenifyLogitBias = memoize(async (param:{
    textLogitBias:Record<string,number>|Record<string,number>[]|null|undefined,
    tokensizerType:TokensizerType,
}):Promise<undefined|Record<string,number>>=>{
    const {tokensizerType} = param;
    let {textLogitBias} = param;

    if(textLogitBias==undefined) return undefined;
    if(!(textLogitBias instanceof Array))
        textLogitBias = [textLogitBias];

    const tokenizer = getTokensizer(tokensizerType);

    const out:Record<string,number> = {};
    const mergeObj = async (tokenStr:string,weight:number)=>{
        const tokenArr = await tokenizer.encode(tokenStr);
        let factor = 1;
        //写入权重
        for(const token of tokenArr){
            const strCode = String(token);
            if(out[strCode]==undefined || weight>out[strCode])
                out[strCode] = Number((weight*factor).toFixed(5));
            factor/=2;
        }
    };

    await Promise.all(textLogitBias.flatMap(biasMap=>
            Object.entries(biasMap).map(async ([k,v])=>mergeObj(k,v))));
    return out;
},60_000);
//#endregion
}