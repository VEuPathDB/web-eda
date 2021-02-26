import { Session, NewSession } from '../types/session';
import { FetchClient } from '@veupathdb/web-common/lib/util/api';
export declare class SessionClient extends FetchClient {
    getSessions(): Promise<Session[]>;
    getSession(sessionId: string): Promise<Session>;
    createSession(session: NewSession): Promise<{
        id: string;
    }>;
    updateSession(session: Session): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
}
//# sourceMappingURL=session-api.d.ts.map