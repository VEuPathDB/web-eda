import { Session } from '../types/session';
declare type Setter<T extends keyof Session> = (value: Session[T]) => void;
export declare enum Status {
    InProgress = "in-progress",
    Loaded = "loaded",
    NotFound = "not-found",
    Error = "error"
}
export declare type SessionState = {
    status: Status;
    hasUnsavedChanges: boolean;
    session?: Session;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    setName: Setter<'name'>;
    setFilters: Setter<'filters'>;
    setVisualizations: Setter<'visualizations'>;
    setDerivedVariables: Setter<'derivedVariables'>;
    setStarredVariables: Setter<'starredVariables'>;
    setVariableUISettings: Setter<'variableUISettings'>;
    copySession: () => Promise<{
        id: string;
    }>;
    deleteSession: () => Promise<void>;
    saveSession: () => Promise<void>;
};
export declare function useSession(sessionId: string): SessionState;
export {};
//# sourceMappingURL=session.d.ts.map