/**
 * Executes `callback` repeatedly, based on `intervalTimeMs`.
 * The interval is cleared only when the parent component is unmounted, or when
 * `intervalTimeMs` changes. Changes to `callback` do not clear the interval.
 */
export declare function useInterval(callback: () => void, intervalTimeMs: number): void;
//# sourceMappingURL=interval.d.ts.map