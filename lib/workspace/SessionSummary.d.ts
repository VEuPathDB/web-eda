import { Session } from '../core';
interface Props {
    session: Session;
    setSessionName: (name: string) => void;
    copySession: () => Promise<{
        id: string;
    }>;
    saveSession: () => void;
    deleteSession: () => void;
}
export declare function SessionSummary(props: Props): JSX.Element;
export {};
//# sourceMappingURL=SessionSummary.d.ts.map