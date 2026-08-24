import { LaMChainCompose } from "./Compose";
import { LaMChainFunc } from "./Func";
import { LaMChainInteractor } from "./Interactor";
import { LaMChainResponseVerify } from "./ResponseVerify";

export const LaMChain = {
    ...LaMChainFunc,
    ...LaMChainCompose,
    ...LaMChainResponseVerify,
    ...LaMChainInteractor,
};

export type LaMChain = typeof LaMChain;