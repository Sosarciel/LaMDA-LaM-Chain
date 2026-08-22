
/**模型过载 */
type Overloaded1 = {
    /**模型过载 */
    error: {
        /**模型过载 */
        message: `That model is currently overloaded with other requests. You can retry your request, or contact us through our help center at help.openai.com if the error persists. (Please include the request ID 1c1321769722421992653445bc0da5c6 in your message.)`,
        type: "server_error",
        param: null,
        code: null
    }
}
/**模型过载 */
type Overloaded2 = {
    /**模型过载 */
    error:{
        /**模型过载 */
        message:"The model is currently overloaded with other requests (timed out after generating some tokens) - please retry with smaller completion length or fewer completions (requested 1 prompts, 3 completions for each)",
        type:"invalid_request_error",
        param:null,
        code:null
    }
}
/**速率限额 不重试 */
type RateLimit1 = {
    /**速率限额 不重试 */
    error: {
        /**速率限额 不重试 */
        message: "Rate limit reached for default-text-davinci-003 in organization org-6dfRBpEkuFvWjHwe2Taog7WA on tokens per min. Limit: 150000.000000 / min. Current: 220000.000000 / min. Contact support@openai.com if you continue to have issues. Please add a payment method to your account to increase your rate limit. Visit https://beta.openai.com/account/billing to add a payment method.",
        type: "tokens",
        param: null,
        code: null
    }
}
/**速率限制 不重试 */
type RateLimit2 = {
    error: {
        message: "Rate limit reached for organization org-nikDF6baa2PTHsxYchL650mZ on requests per min (RPM): Limit 3, Used 3, Requested 1. Please try again in 20s. Visit https://platform.openai.com/account/rate-limits to learn more. You can increase your rate limit by adding a payment method to your account at https://platform.openai.com/account/billing.";
        type: "requests";
        param: null;
        code: "rate_limit_exceeded";
    };
}
/**用量限额 不重试 设置无效 */
type Quota = {
    /**用量限额 不重试 设置无效 */
    error: {
        /**用量限额 不重试 设置无效 */
        message: "You exceeded your current quota, please check your plan and billing details.",
        type: "insufficient_quota",
        param: null,
        code: null
    }
}
/**无效Key 不重试 设置无效 */
type InvalidKey = {
    /**无效Key 不重试 设置无效 */
    error: {
        /**无效Key 不重试 设置无效 */
        message: "Incorrect API key provided: sk-4jwnH***************************************X123. You can find your API key at https://beta.openai.com.",
        type: "invalid_request_error",
        param: null,
        code: "invalid_api_key"
    }
}
/**授权/网络错误 */
type AuthSubrequest = {
    /**授权/网络错误 */
    error:{
        /**授权/网络错误 */
        message:"Internal server error",
        type:"auth_subrequest_error",
        param:null,
        code:"internal_error"
    }
}
/**其他错误 */
type OtherError1 = {
    /**其他错误 */
    error:{
        /**其他错误 */
        message:"The server had an error while processing your request. Sorry about that!",
        type:"server_error",
        param:null,
        code:null
    }
}
type OtherError2 = {
    /**其他错误 */
    error: {
        message: "The server had an error processing your request. Sorry about that! You can retry your request, or contact us through our help center at help.openai.com if you keep seeing this error. (Please include the request ID 45378566e30c8891d41f7c6d7e1cf159 in your email.)",
        type: "server_error",
        param: null,
        code: null
    }
}
/**违反规则被封号 不重试 设置无效 */
type AccessTerminated = {
    /**违反规则被封号 不重试 设置无效 */
    error:{
        /**违反规则被封号 不重试 设置无效 */
        message:"Your access was terminated due to violation of our policies, please check your email for more information. If you believe this is in error and would like to appeal, please contact support@openai.com.",
        type:"access_terminated",
        param:null,
        code:null
    }
}
/**账号停用 不重试 设置无效 */
type AccountDeactivated = {
    /**账号停用 不重试 设置无效 */
    error:{
        /**账号停用 不重试 设置无效 */
        message:"This key is associated with a deactivated account. If you feel this is an error, contact us through our help center at help.openai.com.",
        type:"invalid_request_error",
        param:null,
        code:"account_deactivated"
    }
}
/**cf服务器错误 */
type CFTokenError = {
    /**cf服务器错误 */
    error: {
        code: 503,
        /**cf服务器错误 */
        message: "Service Unavailable.",
        param: null,
        type: "cf_service_unavailable"
    }
}
/**模型输出错误 */
type InvalidOutput = {
    error: {
        message: "Failed to create completion as the model generated invalid Unicode output. Unfortunately, this can happen in rare situations. Consider reviewing your prompt or reducing the temperature of your request. You can retry your request, or contact us through our help center at help.openai.com if the error persists. (Please include the request ID req_cdcdcbd29bffddf43aa8f87d60185201 in your message.)";
        type: "server_error";
        param: null;
        code: "invalid_model_output";
    };
}

//内容过滤
type ContentFilter = {
    error: {
        message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy. Please modify your prompt and retry. To learn more about our content filtering policies please read our documentation: https://go.microsoft.com/fwlink/?linkid=2198766",
        type: "",
        param: "prompt",
        code: "content_filter"
    }
}

type BadCode = {
    error: {
        message: " (request id: 2025112400181067620006657649561)";
        type: "upstream_error";
        param: "524";
        code: "bad_response_status_code";
    };
};

/**所有错误格式的合集 */
export type OpenAIErrorResponse = Overloaded1|Overloaded2|RateLimit1|Quota|
InvalidKey|AuthSubrequest|OtherError1|OtherError2|AccessTerminated|
AccountDeactivated|CFTokenError|RateLimit2|InvalidOutput|ContentFilter|BadCode;