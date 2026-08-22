import type { PromiseRetries, PromiseRetryResult } from "@zwa73/js-utils";
import type { PresetOption } from "@zwa73/utils";
import { preset } from "@zwa73/utils";

import type { CredProvider, ModelInfo, SourceProvider } from "LaMChain";
import type { AnyTextCompletionRequest } from "RequestFormat";
import type { AnyTextCompletionResponse } from "ResponseFormat";






/**请求格式化工具 */
export type Interactor<FMT extends AnyTextCompletionResponse = AnyTextCompletionResponse> = {
    /**向 openai模型 发送一个POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    postLaM(partialOpt:PresetOption<typeof PostLaMOptionPreset>):Promise<FMT|undefined>
    /**向 openai模型 重复请求发送POST请求并接受数据
     * @async
     * @param partialOpt - 可选的参数
     * @returns 结果 undefined 为未能成功接收
     */
    postLaMRepeat(partialOpt:PresetOption<typeof PostLaMOptionPreset>): Promise<PromiseRetryResult<FMT|undefined>>
}





//#region 缺省option参数
/**PostLaM参数 */
export type PostLaMOption={
    /**传入的参数对象 */
    postJson:AnyTextCompletionRequest;
    /**账户数据 */
    cred:CredProvider;
    /**来源数据 */
    source:SourceProvider;
    /**api价格 */
    modelData:ModelInfo;
    /**单个超时时间/毫秒 最小为10000毫秒 -1为不存在 */
    timeLimit:number;
    /**重试选项 */
    retryOption:PromiseRetries;
}
/**默认的聊天设置 */
export const PostLaMOptionPreset = preset<PostLaMOption>()({
    timeLimit:3_600_000,
    retryOption:{
        count:3,
        tryInterval: 300_000,
        tryDelay: 3000,
    }
});
//#endregion