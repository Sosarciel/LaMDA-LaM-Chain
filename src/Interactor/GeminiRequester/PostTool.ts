import type { PresetOption, PromiseRetryResult } from '@zwa73/utils';
import { SLogger, UtilFunc, UtilHttp } from '@zwa73/utils';

import { LaMChain } from 'LaMChain';
import type { AnyGeminiResponse, GeminiResponse } from 'ResponseFormat';

import type { Interactor } from 'Interactor/Interface';
import { PostLaMOptionPreset } from 'Interactor/Interface';
import { getProxy } from 'Interactor/ProxyPool';


/**适用与 openai 鉴权方式的post工具 */
class _GeminiPostTool implements Interactor<AnyGeminiResponse> {
    constructor(){}

    /**向 openai模型 发送一个POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    async postLaM(partialOpt:PresetOption<typeof PostLaMOptionPreset>){
        const opt = PostLaMOptionPreset.assign(partialOpt);
        const {cred,source,modelData,timeLimit} = opt;
        const postJson = opt.postJson;

        //gemini的model_id影响post请求路径, 必需由交互器处理
        const fixModelId = LaMChain.specializeModelId({ source, modelId:modelData.id});
        const postPath = `${modelData.endpoint}/${fixModelId}:generateContent?key=${cred.key}`;

        const protocol = source.protocol??'https';
        const port = source.port??(protocol==='https'?443:80);
        const respData = await UtilHttp.url(`${protocol}://${source.hostname}`)
            .postJson().option({
                method: 'POST'  as const,
                hostname: source.hostname,
                port,
                path: postPath,//'/v1/chat/completions'
                headers: {
                    'Content-Type': 'application/json',
                },
                dispatcher: source.proxyUrl ? getProxy(source.proxyUrl) : undefined,
                timeout:timeLimit,
            }).once({json:postJson});

        const resp = respData?.data as AnyGeminiResponse|undefined;

        //const err = (res:string)=>outcome(Terminated,res);
        //return await pipe(respObj,
        //    v=>v==undefined
        //        ? err('GeminiPostTool.postLaM 错误 未能接收resp')
        //        : success(v), //post错误
        //    chain(({result})=>'error' in result
        //        ? failed(result) : success(result)), //错误检测 交由verfyResp函数
        //    chain(({result})=>checkRespCode(respData)===false
        //        ? err('GeminiPostTool.postLaM 错误 不成功的状态码')
        //        : success(result)), //状态码检查
        //    tap(chain(async ({result})=>recordPrice(result,modelData.price,accountData)),true), //记录用量
        //    when(Terminated,val=>void SLogger.warn(val)),
        //    chain(v=>v.result), alt(v=>v.result),
        //);

        //post错误
        if(resp==undefined){
            SLogger.warn(`GeminiPostTool.postLaM 错误 未能接收resp`);
            return undefined;
        }

        //错误检测
        if("error" in resp)
            return resp;

        if(LaMChain.checkRespCode(respData)===false){
            SLogger.warn(`GeminiPostTool.postLaM 错误 不成功的状态码`);
            return undefined;
        }

        //记录使用量
        await LaMChain.recordGeminiCost({price:modelData.price, cred, resp, logUsage:true});

        return resp;
    }
    /**向 openai模型 重复请求发送POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    async postLaMRepeat(partialOpt:PresetOption<typeof PostLaMOptionPreset>):Promise<PromiseRetryResult<GeminiResponse | undefined>>{
        //解构参数
        const opt = PostLaMOptionPreset.assign(partialOpt);
        const retryOption = UtilFunc.assignOption({},
            PostLaMOptionPreset.default().retryOption,
            partialOpt.retryOption);

        return await UtilFunc.retryPromise(
            async ()=>this.postLaM(opt),
            async obj=>await LaMChain.verifyGeminiResp(obj, opt.cred),
            {...retryOption,logFlag:"GeminiPostTool.postLaMRepeat"}
        );
    }
}

export const GeminiPostTool = new _GeminiPostTool();