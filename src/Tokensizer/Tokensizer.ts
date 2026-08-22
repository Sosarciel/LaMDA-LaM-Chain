import fs from 'fs';

import { Tokenizer } from "@anush008/tokenizers";
import type { NeedInit } from "@zwa73/utils";
import { AwaitInited, ivk, UtilCodec } from "@zwa73/utils";
import path from 'pathe';

import { DATA_PATH } from "Constant";


import type { TokensizerInterface } from "./Interface";

class Cl100kBase implements TokensizerInterface{
    async encode(str: string){
        return Array.from(await UtilCodec.encodeTokenTurbo(str));
    }
    async decode(str: number[]){
        return UtilCodec.decodeTokenTurbo(str);
    }
    async counting(str: string){
        return UtilCodec.tokenNumTurbo(str);
    }
}

class P50kBase implements TokensizerInterface{
    async encode(str: string){
        return Array.from(await UtilCodec.encodeTokenDavinci(str));
    }
    async decode(str: number[]){
        return UtilCodec.decodeTokenDavinci(str);
    }
    async counting(str: string){
        return UtilCodec.tokenNumDavinci(str);
    }
}

class Deepseek implements TokensizerInterface, NeedInit{
    inited: Promise<{
        tokenizer:Tokenizer
    }>;
    constructor(){
        this.inited = ivk(async ()=>{
            const fp = path.join(DATA_PATH,'tokensizer','deepseek_tokenizer.json');
            const cfg = await fs.promises.readFile(fp,'utf-8');
            return {
                tokenizer:Tokenizer.fromString(cfg)
            };
        });
    }
    @AwaitInited
    async encode(str: string){
        const {tokenizer} = await this.inited;
        return (await tokenizer.encode(str)).getIds();
    }
    async decode(str: number[]){
        const {tokenizer} = await this.inited;
        return await tokenizer.decode(str,false);
    }
    async counting(str: string){
        const {tokenizer} = await this.inited;
        return (await tokenizer.encode(str)).getLength();
    }
}

export const TokensizerMap = {
    "cl100k_base"   :new Cl100kBase(),
    "p50k_base"     :new P50kBase(),
    "deepseek"      :new Deepseek()
};
export type TokensizerType = keyof typeof TokensizerMap;

export function getTokensizer(name: TokensizerType): TokensizerInterface{
    return TokensizerMap[name];
}