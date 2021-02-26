export declare type PromiseHookState<T> = {
    value?: T;
    pending: boolean;
    error?: unknown;
};
export declare function usePromise<T>(promiseFactory: () => Promise<T>, deps?: unknown[]): PromiseHookState<T>;
//# sourceMappingURL=promise.d.ts.map