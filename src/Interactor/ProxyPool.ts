
import type { Dispatcher } from 'undici';
import { ProxyAgent } from 'undici';



const ProxyPool:Record<string,Dispatcher> = {};
export const getProxy = (url:string)=>{
    return ProxyPool[url] ?? (ProxyPool[url] = new ProxyAgent(url));
};