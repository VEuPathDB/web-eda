import { Decoder } from 'io-ts';
export declare function ioTransformer<I, A>(decoder: Decoder<I, A>): (value: I) => Promise<A>;
//# sourceMappingURL=ioTransformer.d.ts.map