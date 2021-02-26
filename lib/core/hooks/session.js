var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useStateWithHistory } from '@veupathdb/wdk-client/lib/Hooks/StateWithHistory';
import { useCallback, useEffect, useState } from 'react';
import { useSessionClient } from './workspace';
import { usePromise } from './promise';
export var Status;
(function (Status) {
    Status["InProgress"] = "in-progress";
    Status["Loaded"] = "loaded";
    Status["NotFound"] = "not-found";
    Status["Error"] = "error";
})(Status || (Status = {}));
export function useSession(sessionId) {
    const sessionClient = useSessionClient();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { current: session, setCurrent, canRedo, canUndo, redo, undo, } = useStateWithHistory({
        size: 10,
        onUndo: useCallback(() => setHasUnsavedChanges(true), [
            setHasUnsavedChanges,
        ]),
        onRedo: useCallback(() => setHasUnsavedChanges(true), [
            setHasUnsavedChanges,
        ]),
    });
    const savedSession = usePromise(useCallback(() => {
        return sessionClient.getSession(sessionId);
    }, [sessionId, sessionClient]));
    useEffect(() => {
        if (savedSession.value) {
            setCurrent(savedSession.value);
        }
    }, [savedSession.value, setCurrent]);
    const status = savedSession.pending
        ? Status.InProgress
        : savedSession.error
            ? Status.Error
            : Status.Loaded;
    const useSetter = (propertyName) => useCallback((value) => {
        setCurrent((_a) => _a && Object.assign(Object.assign({}, _a), { [propertyName]: value }));
        setHasUnsavedChanges(true);
    }, [propertyName]);
    const setName = useSetter('name');
    const setFilters = useSetter('filters');
    const setVisualizations = useSetter('visualizations');
    const setDerivedVariables = useSetter('derivedVariables');
    const setStarredVariables = useSetter('starredVariables');
    const setVariableUISettings = useSetter('variableUISettings');
    const saveSession = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (session == null)
            throw new Error("Attempt to save an session that hasn't been loaded.");
        yield sessionClient.updateSession(session);
        setHasUnsavedChanges(false);
    }), [sessionClient, session]);
    const copySession = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (session == null)
            throw new Error("Attempt to copy an session that hasn't been loaded.");
        if (hasUnsavedChanges)
            yield saveSession();
        return yield sessionClient.createSession(session);
    }), [sessionClient, session, saveSession, hasUnsavedChanges]);
    const deleteSession = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        return sessionClient.deleteSession(sessionId);
    }), [sessionClient, sessionId]);
    return {
        status,
        session,
        canRedo,
        canUndo,
        hasUnsavedChanges,
        redo,
        undo,
        setName,
        setFilters,
        setVisualizations,
        setDerivedVariables,
        setStarredVariables,
        setVariableUISettings,
        copySession,
        deleteSession,
        saveSession,
    };
}
//# sourceMappingURL=session.js.map