import { SLogger, throwError } from "@zwa73/utils";
import type { DeepReadonly, MPromise } from "@zwa73/utils";

/** 声明扩展注册接口：调用方可通过 declare module 全局扩展此接口指定默认 Context 类型 */
export interface ContextSchema { };

/** 标准化上下文预算结构 */
export type ContextBudget = {
    /** 最大 Token 长度预算 */
    maxLength: number;
    /** 最大消息条数预算 */
    maxCount: number;
};

/** 块处理算子计算输出的增强结论 */
export type BlockProcessResult<Context = ContextSchema> = {
    /** 最终生成的 Context[] 消息列表 */
    context: Context[];
    /** 区块计算得出的 Token 消耗数 */
    contextLength: number;
    /** 区块包含的消息条数 */
    contextCount: number;
};

/** 传递给区块处理器的环境上下文 */
export type BlockProcessContext<Context = ContextSchema> = {
    /** 当前区块可用的总预算 */
    availableBudget: ContextBudget;
    /** 单条 Context 单元的 Token 长度计算函数 */
    computeLength: (msg: Context) => MPromise<number>;
};

/** 计算 Context[] 消息列表总 Token 长度的辅助函数 */
export const calcContextLength = <Context = ContextSchema>(
    ctx: Context[],
    computeLength: (msg: Context) => MPromise<number>
): MPromise<number> => {
    return Promise.all(ctx.map(computeLength)).then(lens => lens.reduce((a, b) => a + b, 0));
};

/** 上下文块基础属性 */
export type ContextBlockBase<T> = {
    /** 区块唯一标识 */
    id: string;
    /** 优先级：数值越大优先级越高，优先抢占 Token 预算 */
    priority: number;
    /** 是否可抛弃，默认 false。若预算不足且为 false 则中断抛错 */
    droppable?: boolean;
    /** 块的独立保证保底预算 (即使全局预算为 0，也会顶开获得至少此配额) */
    minBudget?: Partial<ContextBudget>;
    /** 块级别的最大预算上限约束 */
    maxBudget?: Partial<ContextBudget>;
    /** 是否打印处理日志与截断报告，默认 true */
    verbose?: boolean;
    /** 区块类型标识 */
    type: string;
} & T;

/** 常量/基础块：静态 Context[] 列表或无参求值函数 */
export type ConstantBlock<Context = ContextSchema> = ContextBlockBase<{
    type: 'constant';
    context: Context[] | (() => MPromise<Context[]>);
}>;

/** 预算块：接收计算出的可用预算，返回 Context[] 或自定义 BlockProcessResult */
export type BudgetBlock<Context = ContextSchema> = ContextBlockBase<{
    type: 'budget';
    context: (availableBudget: ContextBudget) => MPromise<Context[] | { context: Context[]; contextLength?: number }>;
}>;

/** 托管滑窗块：通过 Context 流生成器拉取历史，由块处理器统一做预算截断与拦截 */
export type WindowBlock<Context = ContextSchema> = ContextBlockBase<{
    type: 'window';
    /** 历史 Context 消息流生成器或返回生成器的函数 */
    stream: AsyncIterable<Context> | ((availableBudget: ContextBudget) => AsyncIterable<Context>);
    /** 自定义拦截器：返回 'continue' 继续、'reject' 截断且不计入、'include' 截断但计入 */
    onIntercept?: (msg: Context) => MPromise<'continue' | 'reject' | 'include'>;
}>;

/** 子图块：将一个 ContextGraph 实例或其配置嵌套入母图 */
export type GraphBlock<Context = ContextSchema> = ContextBlockBase<{
    type: 'graph';
    /** 嵌套的子图实例，或接收当前可用预算返回子图实例/配置的函数 */
    graph:
        | ContextGraph<Context>
        | ((availableBudget: ContextBudget) => MPromise<ContextGraph<Context> | ContextGraphOption<Context>>);
}>;

/** 框架支持的基础上下文区块联合类型 */
export type ContextGraphBlock<Context = ContextSchema> =
    | ConstantBlock<Context>
    | BudgetBlock<Context>
    | WindowBlock<Context>
    | GraphBlock<Context>;

/** 独立的块处理器表 (as const 表驱动设计)  */
export const blockProcessorTable = {
    /** 常量块处理器 */
    constant: async <Context = ContextSchema>(block: ConstantBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, verbose = true } = block;
        const ctx = typeof block.context === 'function' ? await block.context() : block.context;
        const contextLength = await calcContextLength(ctx, procCtx.computeLength);
        const contextCount = ctx.length;

        if (verbose) {
            SLogger.info(`[ContextGraph:constant] id:${id} 求值完成 contextCount:${contextCount} contextLength:${contextLength}`);
        }

        return { context: ctx, contextLength, contextCount };
    },

    /** 预算块处理器 */
    budget: async <Context = ContextSchema>(block: BudgetBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, verbose = true } = block;
        const res = await block.context(procCtx.availableBudget);

        const context = Array.isArray(res) ? res : res.context;
        const contextLength = Array.isArray(res) || res.contextLength == undefined
            ? await calcContextLength(context, procCtx.computeLength)
            : res.contextLength;
        const contextCount = context.length;

        if (verbose) {
            SLogger.info(`[ContextGraph:budget] id:${id} 求值完成 contextCount:${contextCount} contextLength:${contextLength}`);
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

    /** 子图块处理器：求值嵌套子图并归集 Token 消耗 */
    graph: async <Context = ContextSchema>(block: GraphBlock<Context>, procCtx: BlockProcessContext<Context>): Promise<BlockProcessResult<Context>> => {
        const { id, verbose = true } = block;
        const { availableBudget, computeLength } = procCtx;

        // 获取子图配置：若为函数则传入当前可用预算动态计算
        const rawGraph = typeof block.graph === 'function' ? await block.graph(availableBudget) : block.graph;

        // 统一构建/提取子图实例
        let subGraphInstance: ContextGraph<Context>;
        if (rawGraph instanceof ContextGraph) {
            subGraphInstance = rawGraph;
        } else {
            subGraphInstance = new ContextGraph<Context>({
                ...rawGraph,
                maxBudget: availableBudget,
                computeLength,
            });
        }

        // 递归求解子图并计算消耗
        const context = await subGraphInstance.build();
        const contextLength = await calcContextLength(context, computeLength);
        const contextCount = context.length;

        if (verbose) {
            SLogger.info(`[ContextGraph:graph] id:${id} 子图编排完成 contextCount:${contextCount} contextLength:${contextLength}`);
        }

        return { context, contextLength, contextCount };
    },
} as const;

/** 处理器表映射类型定义 */
export type BlockProcessorTable = typeof blockProcessorTable;

/** ContextGraph 构造函数配置选项 (单参形式)  */
export type ContextGraphOption<Context = ContextSchema> = {
    /** 上下文区块列表 (物理拼接排版顺序以传入此数组的顺序为准)  */
    blockList: ContextGraphBlock<Context>[];
    /** 全局预算上限 (包含最大 Token 长度与最大消息条数) 缺失则为无限 */
    maxBudget?: Partial<ContextBudget>;
    /** 单条 Context 单元的 Token 长度计算函数 若不传则永远计算为0 */
    computeLength?: (msg: Context) => MPromise<number>;
    /** 是否打印全局编排报告，默认 true */
    verbose?: boolean;
};

/** 上下文图谱编排器 */
export class ContextGraph<Context = ContextSchema> {
    private readonly _blockList: ContextGraphBlock<Context>[];
    private readonly maxBudget: ContextBudget;
    private readonly computeLength: (msg: Context) => MPromise<number>;
    private readonly verbose: boolean;
    /** 获取当前编排的所有区块 (对外暴露 DeepReadonly 视图)  */
    public get blockList(): DeepReadonly<ContextGraphBlock<Context>[]> {
        return this._blockList as DeepReadonly<ContextGraphBlock<Context>[]>;
    }

    /** 构造函数 (单参形式)
     * @param opt - 配置选项
     */
    constructor(opt: ContextGraphOption<Context>) {
        this._blockList = [...opt.blockList];
        this.maxBudget = {
            maxCount: opt.maxBudget?.maxCount ?? Infinity,
            maxLength: opt.maxBudget?.maxLength ?? Infinity,
        };
        this.computeLength = opt.computeLength??(()=>0);
        this.verbose = opt.verbose ?? true;
    }

    //#region 块操作
    /** 在指定目标区块前或后插入新区块 (支持单块或多块批量插入)
     * @param targetId - 目标参考区块的 id
     * @param position - 插入相对位置：'before' (前) 或 'after' (后)
     * @param block - 要插入的区块或区块数组
     * @returns this 支持链式调用
     * @throws 未找到目标区块时抛出错误
     */
    addBlock(opt:{
        /** 目标参考区块的 id */
        targetId: string;
        /**插入相对位置：'before' (前) 或 'after' (后)  */
        position: 'before' | 'after';
        /** 要插入的区块或区块数组 */
        block: ContextGraphBlock<Context> | ContextGraphBlock<Context>[];
    }): this {
        const { targetId, position, block } = opt;
        const index = this._blockList.findIndex(b => b.id === targetId);
        if (index === -1)
            throw throwError(`ContextGraph.addBlock 未找到目标区块 targetId: '${targetId}'`);

        const insertIndex = position === 'before' ? index : index + 1;
        const insertBlockList = Array.isArray(block) ? block : [block];
        this._blockList.splice(insertIndex, 0, ...insertBlockList);

        return this;
    }

    /** 头部插入 (作为新的第一个区块) 
     * @param block - 要插入的区块或区块数组
     * @returns this 支持链式调用
     */
    unshiftBlock(...block: ContextGraphBlock<Context>[]): this {
        this._blockList.unshift(...block);
        return this;
    }

    /** 尾部追加 (作为新的最后一个区块) 
     * @param block - 要追加的区块或区块数组
     * @returns this 支持链式调用
     */
    pushBlock(... block: ContextGraphBlock<Context>[]): this {
        this._blockList.push(...block);
        return this;
    }

    /** 替换或删除指定 id 的区块
     * @param targetId - 目标区块 id
     * @param newBlock - 新区块、区块数组或 undefined (传入 undefined 或留空时删除该区块) 
     * @returns this 支持链式调用
     * @throws 未找到目标区块时抛出错误
     */
    replaceBlock(targetId: string, newBlock?: ContextGraphBlock<Context> | ContextGraphBlock<Context>[] | undefined): this {
        const idx = this._blockList.findIndex(b => b.id === targetId);
        if (idx === -1) throw throwError(`ContextGraph.replaceBlock 未找到目标区块 targetId: '${targetId}'`);

        if (newBlock === undefined) {
            // 传入 undefined 时执行删除
            this._blockList.splice(idx, 1);
        } else {
            // 替换为单块或多块
            const insertBlockList = Array.isArray(newBlock) ? newBlock : [newBlock];
            this._blockList.splice(idx, 1, ...insertBlockList);
        }

        return this;
    }
    //#endregion

    /** 处理器求值派发入口
     * @param block - 上下文区块
     * @param procCtx - 处理环境上下文
     */
    private static async proc<Context = ContextSchema, T extends ContextGraphBlock<Context> = ContextGraphBlock<Context>>(
        block: T,
        procCtx: BlockProcessContext<Context>
    ): Promise<BlockProcessResult<Context> | undefined> {
        const handler = blockProcessorTable[block.type as keyof BlockProcessorTable];
        if (handler == undefined) {
            SLogger.error(`ContextGraph.proc 未知区块类型: ${block.type} (id: ${block.id})`);
            return undefined;
        }
        return handler(block as never, procCtx);
    }

    /** 执行上下文图谱编排
     * @returns 组装好的完整 Context[] 数组 (保持构造时传入的物理顺序)
     */
    async build(): Promise<Context[]> {
        // 1. 记录原始索引，确保最终输出物理位置不随优先级排序改变
        const indexedBlockList = this._blockList.map((block, originalIndex) => ({ block, originalIndex }));

        // 2. 按 priority 降序排序进行 Token 预算抢占分配
        const sortedByPriority = [...indexedBlockList].sort((a, b) => {
            // 1. 优先级降序（数值大的优先）
            const priorityDiff = b.block.priority - a.block.priority;
            if (priorityDiff !== 0) return priorityDiff;
            // 2. 优先级相等时，按原始物理索引升序（从上到下）
            return a.originalIndex - b.originalIndex;
        });

        const remainingGlobalBudget: ContextBudget = { ...this.maxBudget };
        const resultsByOriginalIndex: (Context[] | undefined)[] = new Array(this._blockList.length);

        // 3. 按优先级求值与分配预算
        for (const { block, originalIndex } of sortedByPriority) {
            const droppable = block.droppable ?? false;
            const blockVerbose = block.verbose ?? this.verbose;

            const minToken = block.minBudget?.maxLength ?? 0;
            const minCount = block.minBudget?.maxCount ?? 0;

            // 计算可用预算：通过 Math.max 确保即使全局预算为 0，保底 minBudget 也能顶开全局拿到配额
            let allocLength = Math.max(remainingGlobalBudget.maxLength, minToken);
            let allocCount = Math.max(remainingGlobalBudget.maxCount, minCount);

            // 若配置了块级别 maxBudget 约束上限，取最小值
            if (block.maxBudget?.maxLength != undefined) {
                allocLength = Math.min(allocLength, block.maxBudget.maxLength);
            }
            if (block.maxBudget?.maxCount != undefined) {
                allocCount = Math.min(allocCount, block.maxBudget.maxCount);
            }

            const availableBudget: ContextBudget = {
                maxLength: allocLength,
                maxCount: allocCount,
            };

            // 表驱动处理
            const res = await ContextGraph.proc(block, {
                availableBudget,
                computeLength: this.computeLength,
            });

            if (res == undefined) continue;

            const { context, contextLength, contextCount } = res;

            const isLengthExceeded = contextLength > availableBudget.maxLength;
            const isCountExceeded = contextCount > availableBudget.maxCount;

            // 校验预算超限 (达到 Token 或条数任意一项即判定超限)
            if (isLengthExceeded || isCountExceeded) {
                if (!droppable) {
                    throw throwError(
                        `[ContextGraph] 区块预算超限且不可抛弃: id=${block.id}, type=${block.type}, priority=${block.priority}, ` +
                        `需求长度:${contextLength}/${availableBudget.maxLength}, 需求条数:${contextCount}/${availableBudget.maxCount}`
                    );
                } else {
                    if (blockVerbose) {
                        SLogger.warn(
                            `[ContextGraph] 可抛弃区块预算不足已丢弃: id=${block.id}, type=${block.type}, priority=${block.priority}, ` +
                            `需求长度:${contextLength}/${availableBudget.maxLength}, 需求条数:${contextCount}/${availableBudget.maxCount}`
                        );
                    }
                    resultsByOriginalIndex[originalIndex] = [];
                    continue;
                }
            }

            // 扣减全局剩余预算
            remainingGlobalBudget.maxLength -= contextLength;
            remainingGlobalBudget.maxCount -= contextCount;
            resultsByOriginalIndex[originalIndex] = context;

            if (blockVerbose) {
                SLogger.info(
                    `[ContextGraph] 区块装载成功: id=${block.id}, type=${block.type}, priority=${block.priority}, ` +
                    `contextLength:${contextLength}, contextCount:${contextCount}, 剩余GlobalLength:${remainingGlobalBudget.maxLength}, 剩余GlobalCount:${remainingGlobalBudget.maxCount}`
                );
            }
        }

        // 4. 恢复初始传入的物理顺序平铺输出
        return resultsByOriginalIndex.flat().filter((ctx): ctx is Context => ctx != undefined);
    }
}

