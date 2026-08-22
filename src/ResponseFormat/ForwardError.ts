

//#region Eylink
/** 转发api请求失败 */
type OneApiRequestFailed =  {
    error: {
        message: 'do request failed: Post "https://api.open-proxy.cn/v1/chat/completions": unexpected EOF (request id: 2025120200210529140123796977233)';
        type: "one_api_error";
        param: "";
        code: "do_request_failed";
    };
};

/**转发API过载 */
type NewApiOverloaded = {
    error: {
        message: "当前分组上游负载已饱和，请稍后再试",
        type: "new_api_error",
        param: "",
        code: "service_err"
    }
}

/**转发API限额 通常非真实限额而是系统故障 */
type NewApiQuota = {
    error: {
        message: "用户额度不足, 剩余额度: ＄-0.003902 (request id: 202512131514256181461144rZFXvw3) (request id: 2025121315142517238973603614606)";
        type: "new_api_error";
        param: "";
        code: "insufficient_user_quota";
    };
};
//#endregion


//#region Gptge
/** gptge提示词阻拦 */
type VApiPromptBlock = {
    error: {
        message: "request blocked by Gemini API: PROHIBITED_CONTENT  (request id: 2025112323102079161323703192322)";
        type: "v_api_error";
        param: "";
        code: "prompt_blocked";
    };
};
/** gptge业务错误 提示词阻拦(Gemini PROHIBITED_CONTENT) */
type VApiBizPromptBlock = {
    error: {
        message: `request blocked by Gemini API: PROHIBITED_CONTENT (request id: ${string})`;
        type: "v_api_biz_error";
        param: "";
        code: "prompt_blocked";
    };
};
/** gptge业务错误 模型未找到(负载饱和) */
type VApiBizModelNotFound = {
    error: {
        message: "当前分组 default 上游模型 gemini-2.5-pro 负载已饱和，请稍后再试 (request id: 202604121416159708342718659115)",
        type: "v_api_biz_error";
        param: "";
        code: "model_not_found";
    };
};
//#endregion

//#region Jeniya
/** jeniya请求体被阻拦(Gemini PROHIBITED_CONTENT) */
type NewApiRequestBodyBlocked = {
    error: {
        message: `request blocked by Google Gemini (PROHIBITED_CONTENT): content is prohibited under official usage policies. Refer to \`https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters\`  for more information (request id: ${string})`;
        type: "new_api_error";
        param: "";
        code: "request_body_blocked";
    };
};
type UpstreamOverloaded = {
    error: {
        message: "当前分组上游负载已饱和，请稍后再试 (request id: 20260306000025282925491HVozszq5)";
        type: "upstream_error";
        param: "";
        code: "429";
    };
};

type EmptyTypeOverloaded = {
    error: {
        message: "当前分组上游负载已饱和，请稍后再试 (request id: 20260411134432905195927FugVxMgG)";
        type: "";
        param: "";
        code: "429";
    };
};

type NewApiModelNotFound = {
    error: {
        message: "Current group upstream load is saturated, please try again later (request id: 20260411181203162190867YyfekCy3)";
        type: "new_api_error";
        param: "";
        code: "model_not_found";
    };
};
//#endregion

/**综合转发API错误 */
export type ForwardErrorResponse = OneApiRequestFailed|NewApiOverloaded|NewApiQuota|NewApiRequestBodyBlocked|VApiPromptBlock|VApiBizPromptBlock|VApiBizModelNotFound|UpstreamOverloaded|EmptyTypeOverloaded|NewApiModelNotFound;