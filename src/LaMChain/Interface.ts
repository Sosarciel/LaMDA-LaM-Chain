import type { JObject, JToken, MPromise, PromiseRetries, PromiseRetryResult } from "@zwa73/js-utils";

/**价格 */
export type ModelPrice=Partial<{
    /**提示每 1 token 价格 单位: 1/1000 usd */
    promptPrice:number;
    /**完成每 1 token 价格 单位: 1/1000 usd */
    completionPrice:number;
    /**缓存命中提示每 1 token 价格 单位: 1/1000 usd */
    cacheHitPromptPrice?:number;
}>;

/**消耗量 */
export type ModelUsage = Partial<{
    /**补全的token数量 */
    completionTokens:number;
    /**提示的token数量 */
    promptTokens:number;
    /**缓存命中的提示token数量 */
    promptCacheHitTokens:number;
    /**缓存未命中的补全token数量 */
    promptCacheMissTokens:number;
}>

/**凭据提供者 */
export type CredProvider = {
    /**名称 */
    name?:string;
    /**归属类别 */
    category?:string;
    /**获取key */
    key:string;

    /**计费
     * @param price - API的调用价格
     */
    recordCost?:(price:number)=>MPromise<void>;
    /**打印已使用的USD数量 */
    currUsage?:()=>MPromise<void>;
    /**设置为不可用 */
    setInavailable?:()=>MPromise<void>;
}

/**源提供者 */
export type SourceProvider = {
    /**名称 */
    name?:string;
    /**hostname */
    hostname:string;
    /**port */
    port?:number;
    /**是否使用代理 */
    proxyUrl?:string;
    /**所用协议 默认https */
    protocol?:'http' | 'https';
    /**重试设定 PromiseRetries */
    retry?:PromiseRetries;
    /**modelid 映射  
     * 用于处理类似SiliconFlow的模型id不一致问题
     */
    modelIdMap?:Record<string,string>;
}

/**模型信息 */
export type ModelInfo = {
    /**模型id */
    id:string;
    /**此模型api的标准路径 */
    endpoint:string;
    /**标准模型价格 */
    price?:(ModelPrice);
}

/**传输函数类型 */
export type LaMPostRequestFunc<I,O> = (param:{
    /**凭据提供者 */
    cred:CredProvider;
    /**源提供者 */
    source:SourceProvider;
    /**模型信息 */
    model:ModelInfo;
    /**请求体 */
    json:I;
    /**重试设定 PromiseRetries */
    retry?:PromiseRetries;
})=>MPromise<PromiseRetryResult<O|undefined>>;

/**用量计算函数类型 */
export type LaMComputeUsageFunc<T> = (resp:T)=>ModelUsage;

/** 工具定义 */
export type ToolDefinition<TArgs = JToken, TResult = JToken> = {
    /** 工具名称 */
    name: string;
    /** 工具描述 */
    description?: string;
    /** 工具参数 JSON Schema */
    parameters: JObject;
    /** 是否严格模式 */
    strict?: boolean;
    /** 工具处理函数 */
    handler: (args: TArgs) => Promise<TResult> | TResult;
};

/** 工具提供者 */
export type ToolProvider = {
    tools: ToolDefinition[];
};