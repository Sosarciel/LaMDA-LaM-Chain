import type { JToken, PromiseStatus, RequestResult } from "@zwa73/utils";
import { Failed, SLogger, Success, Terminated } from "@zwa73/utils";

import type { AnyErrorResponse, AnyGeminiLikeErrorResponse, AnyGeminiResponse, AnyOpenAILikeErrorResponse, AnyOpenAIResponse, ForwardErrorResponse } from "ResponseFormat";

import type { CredProvider } from "./Interface";

/**标准错误处理 (OpenAI / Deepseek / Gemini) */
export namespace LaMChainResponseVerify{

/**检查响应码是否合规
 * @param respData - 响应数据
 */
export const checkRespCode = (respData?:RequestResult<JToken>)=>{
    const respcode = respData?.statusCode ?? 0;
    return respcode>=200 && respcode<300;
};

/**验证 OpenAI 风格回复可用性并处理错误
 * 适用于 OpenAI / Deepseek 等采用 OpenAI 鉴权与错误体结构的厂商
 * @async
 * @param resp - 未做处理的回复
 * @param cred - 本次回复的API key
 * @returns 可用性
 */
export const verifyOpenAIResp = async(
    resp: AnyOpenAIResponse | AnyOpenAILikeErrorResponse | undefined,
    cred: CredProvider,
): Promise<PromiseStatus> => {
    if (resp == undefined) return Failed;

    if('error' in resp){
        SLogger.warn(`verifyResp 开始处理错误:\n${JSON.stringify(resp)}`);
        return checkOpenAIError(resp.error, cred);
    }
    return Success;

};

/**验证 OpenAI 风格错误并处理
 * @async
 * @param error - 未做处理的错误体
 * @param cred  - 本次回复的API key
 * @returns 可用性
 */
export const checkOpenAIError = async (
    error: AnyOpenAILikeErrorResponse['error'],
    cred: CredProvider,
): Promise<PromiseStatus> => {

    if(error.message=="We were unable to start processing your request within the 900-second timeout limit. Please try again later."){
        SLogger.warn("Deepseek请求处理超时");
        return Failed;
    }

    const openaiError = await checkForwardError(error, cred);
    if(typeof openaiError=='symbol') return openaiError;

    switch (openaiError.type) {
        case "server_error":
            SLogger.warn("服务器错误");
            if (openaiError.message.includes("overloaded with other requests")) {
                SLogger.warn("模型过载");
                return Failed;
            } else if (openaiError.message.includes("error while processing your request")) {
                SLogger.warn("服务器处理出错 1");
                return Failed;
            } else if (openaiError.message.includes("The server had an error processing your request")) {
                SLogger.warn("服务器处理出错 2");
                return Failed;
            } else if (openaiError.code === "invalid_model_output") {
                SLogger.warn("模型输出错误");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "auth_subrequest_error":
            SLogger.warn("授权错误");
            if (openaiError.code == "internal_error") {
                SLogger.warn("OpenAI 内部服务器错误");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "insufficient_quota":
            SLogger.warn("限额错误");
            if (openaiError.message.includes("current quota")) {
                SLogger.warn("用量达到限额");
                //直接设置为不可用
                await cred.setInavailable?.();
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "tokens":
            SLogger.warn("速率限额");
            if (openaiError.message.includes("Rate limit")) {
                SLogger.warn("达到速率限额");
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "invalid_request_error":
            SLogger.warn("无效请求错误");
            if (openaiError.code == "invalid_api_key") {
                //直接设置为不可用
                SLogger.warn("无效的API_KEY");
                await cred.setInavailable?.();
                return Terminated;
            } else if (openaiError.code == "account_deactivated") {
                //直接设置为不可用
                SLogger.fatal("账号被停用");
                await cred.setInavailable?.();
                return Terminated;
            } else if (openaiError.message.includes("currently overloaded with other requests")) {
                SLogger.warn("模型过载");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "access_terminated":
            SLogger.warn("拒绝访问错误");
            if (openaiError.message.includes("access was terminated")) {
                //直接设置为不可用
                SLogger.fatal("违反规则终止访问");
                //直接设置为不可用
                await cred.setInavailable?.();
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "cf_service_unavailable":
            SLogger.warn("cf服务器错误");
            if (openaiError.message == "Service Unavailable.") {
                SLogger.warn("服务器错误");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "requests":
            if (openaiError.message.includes("Rate limit reached")) {
                SLogger.warn("达到速率限额");
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "":
            if (openaiError.message.includes("The response was filtered due to the prompt triggering Azure OpenAI's content management policy")) {
                SLogger.warn("内容过滤");
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        default:
            SLogger.error("未定义的错误类型");
            return Terminated;
    }
};

/**验证 Gemini 风格回复可用性并处理错误
 * @async
 * @param resp - 未做处理的回复
 * @param cred - 本次回复的API key
 * @returns 可用性
 */
export const verifyGeminiResp = async (
    resp: AnyGeminiResponse|undefined,
    cred: CredProvider,
): Promise<PromiseStatus> => {
    if (resp == undefined) return Failed;

    if(!("error" in resp))
        return Success;

    const errorObj = resp as AnyGeminiLikeErrorResponse;
    const error = errorObj.error;

    SLogger.warn(`GeminiRequester.verifyResp 开始处理错误`);
    const geminiError = 'type' in error ? await checkForwardError(error, cred) : error;
    if(typeof geminiError=='symbol') return geminiError;

    switch (String(geminiError.code)) {
        case "429":
            if (error.message.includes("当前分组上游负载已饱和，请稍后再试")) {
                SLogger.warn("转发分组过载");
                return Failed;
            }
            SLogger.warn("达到限额");
            return Terminated;
        default:
            SLogger.error("未定义的错误类型");
            return Terminated;
    }
};

/**验证转发API错误并处理
 * 适用于 Eylink / Gptge / Jeniya / OneApi 等转发服务的通用错误
 * @async
 * @param error - 未做处理的错误体
 * @param cred  - 本次回复的API key
 * @returns 可用性
 */
export const checkForwardError = async <T extends Extract<AnyErrorResponse,{error:{type:string}}>['error']>(
    error: T,
    cred: CredProvider,
): Promise<PromiseStatus|Exclude<T,ForwardErrorResponse['error']>> => {


    switch (error.type) {
        case "one_api_error":
            if(error.code=='do_request_failed'){
                SLogger.warn("OneApi转发请求错误");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "new_api_error":
            if(error.code=='insufficient_user_quota'){
                SLogger.warn("NewApi限额");
                ////直接设置为不可用
                //await accountData.instance.setInavailable();
                return Terminated;
            } else if(error.code=='request_body_blocked'){
                SLogger.warn("Jeniya请求体被阻拦(Gemini PROHIBITED_CONTENT)");
                return Terminated;
            } else if ( error.message.includes("当前分组上游负载已饱和") ||
                        error.message.includes("upstream load is saturated")) {
                SLogger.warn("NewApi转发过载");
                return Failed;
            } else if(error.code=='model_not_found'){
                SLogger.warn("NewApi模型未找到");
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "v_api_error":
            if(error.code=='prompt_blocked'){
                SLogger.warn("VApi提示词被阻拦");
                return Terminated;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "v_api_biz_error":
            if(error.code=='prompt_blocked'){
                SLogger.warn("VApi业务错误 提示词被阻拦(Gemini PROHIBITED_CONTENT)");
                return Terminated;
            } else if(error.message.includes('负载已饱和')){
                SLogger.warn("VApi转发过载");
                return Failed;
            }else if(error.code=='model_not_found'){
                SLogger.warn("VApi模型未找到");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "upstream_error":
            if(error.code=='bad_response_status_code'){
                SLogger.warn("Cloudflare网关超时");
                return Failed;
            } else if (error.message.includes("当前分组上游负载已饱和，请稍后再试")) {
                SLogger.warn("转发分组过载");
                return Failed;
            } else SLogger.error("未定义的错误子类型");
            return Terminated;
        case "":
            if (error.message.includes("当前分组上游负载已饱和，请稍后再试")) {
                SLogger.warn("转发分组过载");
                return Failed;
            }
            return error as Exclude<T,ForwardErrorResponse['error']>;
        default:
            //SLogger.error("未定义的错误类型");
            return error as Exclude<T,ForwardErrorResponse['error']>;
    }
};

}