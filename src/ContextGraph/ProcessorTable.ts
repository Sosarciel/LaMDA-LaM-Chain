import { SLogger } from "@zwa73/utils";
import type { MPromise } from "@zwa73/utils";

import { ContextGraph } from "./ContextGraph";
import type { BlockProcessContext, BlockProcessResult, BudgetBlock, ConstantBlock, ContextSchema, GraphBlock, WindowBlock } from "./Interface";


/** 计算 Context[] 消息列表总 Token 长度的辅助函数 */
const calcContextLength = <Context = ContextSchema>(
    ctx: Context[],
    computeLength: (msg: Context) => MPromise<number>
): MPromise<number> => {
    return Promise.all(ctx.map(computeLength)).then(lens => lens.reduce((a, b) => a + b, 0));
};

/** 独立的块处理器表 (as const 表驱动设计)  */
export const BlockProcessorTable = {
    /** 常量块处理器 */
    constant: async <Context = ContextSchema>(block: ConstantBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, verbose = true } = block;
        const ctx = typeof block.context === 'function' ? await block.context() : block.context;
        const contextLength = await calcContextLength(ctx, procCtx.computeLength);
        const contextCount = ctx.length;

        if (verbose) {
            SLogger.info(
                `[ContextGraph:constant] id:${id} 求值完成 contextCount:${contextCount} contextLength:${contextLength}`
            );
        }

        return { context: ctx, contextLength, contextCount };
    },

    /** 预算块处理器 */
    budget: async <Context = ContextSchema>(block: BudgetBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, verbose = true } = block;
        const res = await block.context(procCtx.availableBudget);

        const context = Array.isArray(res) ? res : res.context;
        const contextLength = (Array.isArray(res) || res.contextLength == undefined)
            ? await calcContextLength(context, procCtx.computeLength)
            : res.contextLength;
        const contextCount = (Array.isArray(res) || res.contextCount == undefined)
            ? context.length
            : res.contextCount;

        if (verbose) {
            SLogger.info(
                `[ContextGraph:budget] id:${id} 求值完成 contextCount:${contextCount} contextLength:${contextLength}`
            );
        }

        return { context, contextLength, contextCount };
    },

    /** 托管滑窗块处理器：统一进行 Token/条数上限校验与拦截器判断 */
    window: async <Context = ContextSchema>(block: WindowBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { stream, onIntercept, verbose = true, id } = block;
        const { availableBudget, computeLength } = procCtx;

        const maxLength = availableBudget.maxLength;
        const maxCount = availableBudget.maxCount;

        const chain: Context[] = [];
        let totalLength = 0;
        let totalCount = 0;

        const iterable = typeof stream === 'function' ? stream(availableBudget) : stream;

        for await (const msg of iterable) {
            const messageLength = await computeLength(msg);
            const wouldBeLength = totalLength + messageLength;
            const wouldBeCount = totalCount + 1;

            // 校验消息条数超限
            if (wouldBeCount > maxCount) {
                if (verbose) SLogger.info(`[ContextGraph:window] id:${id} 消息条数超限 最大允许条数:${maxCount}`);
                break;
            }

            // 校验 Token 长度超限
            if (wouldBeLength > maxLength) {
                if (verbose) SLogger.info(`[ContextGraph:window] id:${id} Token 长度超限 单消息长度:${messageLength} 总长度:${totalLength} 最大允许长度:${maxLength}`);
                break;
            }

            // 执行拦截器回调
            if (onIntercept != undefined) {
                const interceptRes = await onIntercept(msg);
                if (interceptRes === 'reject') {
                    if (verbose) SLogger.info(`[ContextGraph:window] id:${id} onIntercept 截断(不计入)`);
                    break;
                }
                if (interceptRes === 'include') {
                    chain.unshift(msg);
                    totalLength = wouldBeLength;
                    totalCount = wouldBeCount;
                    if (verbose) SLogger.info(`[ContextGraph:window] id:${id} onIntercept 截断(计入) 链接第 ${totalCount} 条 单消息长度:${messageLength} 总长度:${totalLength}`);
                    break;
                }
            }

            chain.unshift(msg);
            totalLength = wouldBeLength;
            totalCount = wouldBeCount;
            if (verbose) SLogger.info(`[ContextGraph:window] id:${id} 链接第 ${totalCount} 条 单消息长度:${messageLength} 总长度:${totalLength}`);
        }
        if (verbose) SLogger.info(`[ContextGraph:window] id:${id} 链接完成 contextCount:${totalCount} contextLength:${totalLength}`);

        return {
            context: chain,
            contextLength: totalLength,
            contextCount : totalCount,
        };
    },

    /** 子图块处理器：求值嵌套子图并归集消耗 */
    graph: async <Context = ContextSchema>(block: GraphBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, graph, constant = false, verbose = true } = block;
        const { availableBudget, computeLength } = procCtx;

        // 统一构建/提取子图实例
        const subGraphInstance = graph instanceof ContextGraph
            ? graph
            : new ContextGraph<Context>({
                ...graph,
                maxBudget: availableBudget,
                computeLength,
            });

        // 静态图使用自身固有预算，动态图注入母图当前可用预算
        const res = constant
            ? await subGraphInstance.orchestrate({ verbose })
            : await subGraphInstance.orchestrate({ verbose, maxBudget: availableBudget });

        if (verbose) {
            SLogger.info(
                `[ContextGraph:graph] id:${id} 子图编排完成 (${constant ? '常量静态图' : '动态预算图'}) ` +
                `contextCount:${res.contextCount} contextLength:${res.contextLength}`
            );
        }

        return res;
    },
} as const;

/** 处理器表映射类型定义 */
export type BlockProcessorTable = typeof BlockProcessorTable;