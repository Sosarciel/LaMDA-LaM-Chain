import { LaMChainCompose } from "./LaMChainCompose";
import { LaMChainFunc } from "./LaMChainFunc";
import { LaMChainInteractor } from "./LaMChainInteractor";
import { LaMChainResponseVerify } from "./LaMChainResponseVerify";

export const LaMChain = {
    ...LaMChainFunc,
    ...LaMChainCompose,
    ...LaMChainResponseVerify,
    ...LaMChainInteractor,
};

export type LaMChain = typeof LaMChain;