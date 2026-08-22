

/**Token编码器接口 */
export type TokensizerInterface = {
    /**将字符串编码为Token[]
     * @param str 字符串
     */
    encode  : (str:string)      => Promise<number[]>;
    /**将Token[]解码为字符串
     * @param str 数字数组
     */
    decode  : (str:number[])    => Promise<string>;
    /**计算字符串的Token数量
     * @param str 字符串
     */
    counting: (str:string)      => Promise<number>;
}