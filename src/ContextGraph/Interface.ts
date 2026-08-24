import type { MPromise } from "@zwa73/utils";

import type { ContextGraph, ContextGraphOption } from "./ContextGraph";

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

/** 上下文块基础属性 */
export type ContextBlockBase<T> = {
    /** 区块唯一标识 */
    id: string;
    /** 优先级：数值越大优先级越高，优先抢占 Token 预算 */
    priority: number;
    /** 是否可抛弃，默认 false。若预算不足且为 false 则中断抛错 */
    droppable?: boolean;
    /** 是否忽略长度限制，默认 false。若为 true 则该块可用长度视为无限 */
    ignoreLength?: boolean;
    /** 是否忽略消息条数限制，默认 false。若为 true 则该块可用条数视为无限 */
    ignoreCount?: boolean;
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
    /** 静态 Context[] 列表或无参求值函数 */
    context: Context[] | (() => MPromise<Context[]>);
}>;

/** 预算块：接收计算出的可用预算，返回 Context[] 或自定义 BlockProcessResult */
export type BudgetBlock<Context = ContextSchema> = ContextBlockBase<{
    type: 'budget';
    /** 预算块处理器 */
    context: (availableBudget: ContextBudget) => MPromise<Context[] | Partial<Omit<BlockProcessResult<Context>,'context'>>&Pick<BlockProcessResult<Context>,'context'>>;
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
    graph: ContextGraph<Context> | ContextGraphOption<Context>;
    /** 是否作为常量静态图求值，默认 false。
     * - true: 使用子图自身的固有预算求值，不注入母图动态预算（超出母图剩余时由母图裁决 droppable）
     * - false: 自动注入母图当前剩余的 availableBudget 执行动态编排
     */
    constant?: boolean;
}>;

/** 框架支持的基础上下文区块联合类型 */
export type ContextGraphBlock<Context = ContextSchema> =
    | ConstantBlock<Context>
    | BudgetBlock<Context>
    | WindowBlock<Context>
    | GraphBlock<Context>;
