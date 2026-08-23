import { SLogger, throwError } from "@zwa73/utils";
import type { DeepReadonly, MPromise } from "@zwa73/utils";
import { BlockProcessContext, BlockProcessResult, ContextBudget, ContextGraphBlock, ContextSchema } from "./Interface";
import { BlockProcessorTable } from "./ProcessorTable";

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

/** 上下文图谱编排完整结果 */
export type ContextGraphResult<Context = ContextSchema> = {
    /** 最终生成的 Context[] 消息列表 */
    context: Context[];
    /** 图谱实际消耗的 Token 长度（已排除内部 ignoreLength 的块） */
    contextLength: number;
    /** 图谱实际消耗的消息条数（已排除内部 ignoreCount 的块） */
    contextCount: number;
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
    insertBlock(opt:{
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
    private static async process<Context = ContextSchema, T extends ContextGraphBlock<Context> = ContextGraphBlock<Context>>(
        block: T,
        procCtx: BlockProcessContext<Context>
    ): Promise<BlockProcessResult<Context>> {
        const handler = BlockProcessorTable[block.type as keyof BlockProcessorTable];
        if (handler == undefined)
            throwError(`ContextGraph.proc 未知区块类型: ${block.type} (id: ${block.id})`);
        return handler(block as never, procCtx);
    }

    /** 执行上下文图谱编排并返回完整度量结论
     * @returns 组装好的完整 Context[] 数组 (保持构造时传入的物理顺序)
     * @throws 编排超限或失败时抛出错误
     */
    async orchestrate(): Promise<ContextGraphResult<Context>> {
        // 1. 记录原始索引，确保最终输出物理位置不随优先级排序改变
        const indexedBlockList = this._blockList.map((block, originalIndex) => ({ block, originalIndex }));

        // 2. 优先级降序 > 物理索引升序稳定排序
        const sortedByPriority = [...indexedBlockList].sort((a, b) => {
            const priorityDiff = b.block.priority - a.block.priority;
            if (priorityDiff !== 0) return priorityDiff;
            return a.originalIndex - b.originalIndex;
        });

        const remainingGlobalBudget: ContextBudget = { ...this.maxBudget };
        const resultsByOriginalIndex: (Context[] | undefined)[] = new Array(this._blockList.length);

        // 记录本图实际产生的有效预算消耗
        let consumedLength = 0;
        let consumedCount = 0;

        if (this.verbose) {
            SLogger.info(
                `[ContextGraph] 开始编排上下文 总预算 maxLength:${this.maxBudget.maxLength}, maxCount:${this.maxBudget.maxCount}, 区块总数:${this._blockList.length}`
            );
        }

        // 3. 按优先级求值与分配预算
        for (const { block, originalIndex } of sortedByPriority) {
            const droppable = block.droppable ?? false;
            const blockVerbose = block.verbose ?? this.verbose;
            const ignoreLength = block.ignoreLength ?? false;
            const ignoreCount = block.ignoreCount ?? false;

            const minLength = block.minBudget?.maxLength ?? 0;
            const minCount = block.minBudget?.maxCount ?? 0;

            // 计算可用预算：通过 Math.max 确保即使全局预算为 0，保底 minBudget 也能顶开全局拿到配额
            // 计算长度预算：若 ignoreLength 则不取全局剩余预算，默认为 Infinity
            let allocLength = ignoreLength
                ? Infinity
                : Math.max(remainingGlobalBudget.maxLength, minLength);

            // 计算条数预算：若 ignoreCount 则不取全局剩余预算，默认为 Infinity
            let allocCount = ignoreCount
                ? Infinity
                : Math.max(remainingGlobalBudget.maxCount, minCount);

            // 若块自身配置了 maxBudget 约束上限，对其进行裁剪收窄
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
            const res = await ContextGraph.process(block, {
                availableBudget,
                computeLength: this.computeLength,
            });

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

            // 仅在未忽略时扣减剩余预算，并累加到本图的有效消耗中
            if (!ignoreLength) {
                remainingGlobalBudget.maxLength -= contextLength;
                consumedLength += contextLength;
            }
            if (!ignoreCount) {
                remainingGlobalBudget.maxCount -= contextCount;
                consumedCount += contextCount;
            }

            resultsByOriginalIndex[originalIndex] = context;

            if (blockVerbose) {
                SLogger.info(
                    `[ContextGraph] 区块装载成功: id=${block.id}, type=${block.type}, priority=${block.priority}, ` +
                    `contextLength:${contextLength}${ignoreLength ? '(不计入总长度)' : ''}, ` +
                    `contextCount:${contextCount}${ignoreCount ? '(不计入总条数)' : ''}, ` +
                    `剩余GlobalLength:${remainingGlobalBudget.maxLength}, 剩余GlobalCount:${remainingGlobalBudget.maxCount}`
                );
            }
        }

        // 4. 恢复初始传入的物理顺序平铺输出
        return {
            context: resultsByOriginalIndex.flat().filter((ctx): ctx is Context => ctx != undefined),
            contextLength: consumedLength,
            contextCount: consumedCount,
        };
    }

    /** 构建编排结果
     * @returns 组装好的完整 Context[] 数组 (保持构造时传入的物理顺序)
     * @throws 编排超限或失败时抛出错误
     */
    async buildOrThrow(): Promise<Context[]> {
        const res = await this.orchestrate();
        return res.context;
    }

    /** 构建编排结果
     * 吞掉错误返回 undefined
     * @returns 组装好的完整 Context[] 数组 (保持构造时传入的物理顺序)
     */
    async build(): Promise<Context[] | undefined> {
        try {
            return await this.buildOrThrow();
        } catch (e) {
            SLogger.warn(`[ContextGraph] 编排上下文失败: ${e}`);
            return undefined;
        }
    }
}

