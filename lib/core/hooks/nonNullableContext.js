import { useContext } from 'react';
export function useNonNullableContext(context) {
    var _a;
    const v = useContext(context);
    if (v == null)
        throw new Error('Context has not be initialized: ' +
            ((_a = context.displayName) !== null && _a !== void 0 ? _a : 'unknown') +
            ' context.');
    return v;
}
//# sourceMappingURL=nonNullableContext.js.map