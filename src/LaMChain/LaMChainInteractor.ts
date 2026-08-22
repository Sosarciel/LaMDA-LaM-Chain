import type { MPromise, PromiseRetries } from "@zwa73/js-utils";

import type { Interactor } from "Interactor";
import type { AnyOpenAIChatLikeRequest, AnyTextCompletionRequest } from "RequestFormat";
import type { AnyOpenAIChatLikeResponse, AnyTextCompletionResponse } from "ResponseFormat";

import type { CredProvider, ModelInfo, SourceProvider, ToolProvider } from "./Interface";
import { LaMChainCompose } from "./LaMChainCompose";
import { LaMChainFunc } from "./LaMChainFunc";

export namespace LaMChainInteractor{

/**发送请求 */
export const postRequest = async <
T extends AnyTextCompletionRequest,
R extends AnyTextCompletionResponse,
>(param:{
    /**凭据提供者 */
    cred:CredProvider;
    /**来源提供者 */
    source:SourceProvider;
    /**模型信息 */
    model:ModelInfo;
    /**请求体 */
    json:T;
    /**重试参数 */
    retry?:PromiseRetries;
    /**交互器 */
    interactor:Interactor<R>;
})=>{
    const {model,json,cred,source,retry,interactor} = param;
    return interactor.postLaMRepeat({
        cred, source,
        postJson:json,
        modelData:model,
        retryOption: retry ?? source.retry,
    });
};

/** 尝试/处理 OpenAI Tool Call 循环 */
export const processOpenAIChatToolLoop = async <
REQ extends AnyOpenAIChatLikeRequest,
RES extends AnyOpenAIChatLikeResponse
>(param: {
    /** 原始响应 */
    resp: RES|undefined;
    /** 工具提供者 */
    tool: ToolProvider;
    /** 凭据提供者 */
    cred: CredProvider;
    /** 来源提供者 */
    source: SourceProvider;
    /** 模型信息 */
    model: ModelInfo;
    /** 原始请求 */
    json: REQ;
    /** 重试参数 */
    retry?: PromiseRetries;
    /** 请求修改器 */
    patch?: (param: {
        /** 上次响应 */
        resp: RES;
        /** 完成工具拼接的当前请求 */
        body: REQ
    }) => MPromise<REQ>;
    /** 最大循环次数 */
    maxLoops?: number;
}) => {
    if(param.resp==undefined) return undefined;
    const { tool, cred, source, model, retry, patch, maxLoops = 10 } = param;

    let currentResult = param.resp;
    let currentBody:REQ = {
        ...param.json,
        messages: [...(param.json.messages ?? [])],
        tools: param.json.tools ?? LaMChainFunc.toOpenAITools(tool),
    };

    const toolMap = Object.fromEntries(tool.tools.map(t => [t.name, t]));

    for (let loop = 0; loop < maxLoops; loop++) {
        const completedResp = currentResult;
        const choice = completedResp?.choices?.[0];

        const msg = choice?.message ?? {};
        const toolCalls = ('tool_calls' in (msg))
            ? msg.tool_calls : undefined;

        // 尝试提取：如果没有 tool_calls 则直接原样返回最终结果
        if (!toolCalls || toolCalls.length === 0)
            return currentResult;

        // 1. 执行本地 tools
        const toolResponses = await Promise.all(
            toolCalls.map(async call => {
                const targetTool = toolMap[call.function.name];
                let content: string;
                if (targetTool) {
                    try {
                        const rawArgs = call.function.arguments;
                        // GLM 等厂商可能直接返回 object 参数, 此时跳过 JSON.parse
                        const parsedArgs = (typeof rawArgs === "object" && rawArgs !== null)
                            ? rawArgs
                            : rawArgs ? JSON.parse(rawArgs) : {};
                        const res = await targetTool.handler(parsedArgs);
                        content = typeof res === "string" ? res : JSON.stringify(res);
                    } catch (err: any) {
                        content = JSON.stringify({ error: err?.message ?? String(err) });
                    }
                } else content = JSON.stringify({ error: `Tool ${call.function.name} not found` });

                return {
                    role: "tool" as const,
                    tool_call_id: call.id,
                    content,
                };
            })
        );

        // 2. 组装 messages
        currentBody = {
            ...currentBody,
            messages: [
                ...currentBody.messages ?? [],
                choice.message,
                ...toolResponses,
            ],
        } satisfies REQ;

        // 3. 用户 patch 钩子（可在此捕获中间态、打日志或修改即将下发的 body）
        if (patch) currentBody = await patch({ resp: completedResp, body: currentBody });

        // 4. 发起下一轮请求
        const result = await LaMChainFunc.reduceRepeatResult(LaMChainCompose.postOpenAIRequest({
            cred, source, model, retry,
            json: currentBody,
        })) as RES;
        if(result==undefined) return undefined;
        currentResult = result;
    }

    return currentResult;
};

}