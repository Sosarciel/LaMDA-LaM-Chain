import type { PresetOption, PromiseRetryResult } from '@zwa73/utils';
import { SLogger, UtilFunc, UtilHttp } from '@zwa73/utils';

import { LaMChain } from 'LaMChain';
import type { AnyOpenAILikeRequest } from 'RequestFormat';
import type { AnyOpenAIResponse } from 'ResponseFormat';


import type { Interactor } from 'Interactor/Interface';
import { PostLaMOptionPreset } from 'Interactor/Interface';
import { getProxy } from 'Interactor/ProxyPool';



/**适用与 openai 鉴权方式的post工具 */
class _OpenAiPostTool implements Interactor<AnyOpenAIResponse> {
    constructor(){}

    /**向 openai模型 发送一个POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    async postLaM(partialOpt:PresetOption<typeof PostLaMOptionPreset>){
        const opt = PostLaMOptionPreset.assign(partialOpt);
        const {cred,source,modelData,timeLimit} = opt;
        const postJson = LaMChain.specializeOpenAILikeRequest({
            json:opt.postJson as AnyOpenAILikeRequest,
            source,
        });

        const protocol = source.protocol??'https';
        const port = source.port??(protocol==='https'?443:80);

        const respData = await UtilHttp.url(`${protocol}://${source.hostname}`)
            .postJson().option({
                hostname: source.hostname,
                port,
                path: modelData.endpoint,//'/v1/chat/completions'
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cred.key}`,
                },
                dispatcher: source.proxyUrl ? getProxy(source.proxyUrl) : undefined,
                timeout:timeLimit,
            }).once({json:postJson});

        const resp = respData?.data as AnyOpenAIResponse|undefined;
        //post错误
        if(resp==undefined){
            SLogger.warn(`OpenApiPostTool.postLaM 错误 未能接收resp`);
            return undefined;
        }

        //错误检测
        if ("error" in resp)
            return resp;

        if(LaMChain.checkRespCode(respData)===false){
            SLogger.warn(`OpenApiPostTool.postLaM 错误 不成功的状态码`);
            return undefined;
        }

        //记录使用量
        await LaMChain.recordOpenAICost({resp,price:modelData.price,cred,logUsage:true});

        return resp;
    }
    /**向 openai模型 重复请求发送POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    async postLaMRepeat(partialOpt:PresetOption<typeof PostLaMOptionPreset>):Promise<PromiseRetryResult<AnyOpenAIResponse | undefined>>{
        //解构参数
        const opt = PostLaMOptionPreset.assign(partialOpt);
        const retryOption = UtilFunc.assignOption({},
            PostLaMOptionPreset.default().retryOption,
            partialOpt.retryOption);

        return await UtilFunc.retryPromise(
            async ()=>this.postLaM(opt),
            async obj=>await LaMChain.verifyOpenAIResp(obj, opt.cred),
            {...retryOption,logFlag:"OpenApiPostTool.postLaMRepeat"}
        );
    }
}

export const OpenAiPostTool = new _OpenAiPostTool();

