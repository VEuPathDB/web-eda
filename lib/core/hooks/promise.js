import { useCallback, useEffect, useState } from 'react';
export function usePromise(promiseFactory, deps) {
    const [state, setState] = useState({
        pending: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const callback = useCallback(promiseFactory, deps !== null && deps !== void 0 ? deps : [promiseFactory]);
    useEffect(() => {
        let ignoreResolve = false;
        setState({ pending: true });
        callback().then((value) => {
            if (ignoreResolve)
                return;
            setState({
                value,
                pending: false,
            });
        }, (error) => {
            if (ignoreResolve)
                return;
            setState({
                error,
                pending: false,
            });
        });
        return function cleanup() {
            ignoreResolve = true;
        };
    }, [callback]);
    return state;
}
//# sourceMappingURL=promise.js.map