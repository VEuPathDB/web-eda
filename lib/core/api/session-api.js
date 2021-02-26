import { Session } from '../types/session';
import { createJsonRequest, FetchClient, } from '@veupathdb/web-common/lib/util/api';
import { type, voidType, string, array } from 'io-ts';
import { ioTransformer } from './ioTransformer';
export class SessionClient extends FetchClient {
    getSessions() {
        return this.fetch(createJsonRequest({
            path: '/sessions',
            method: 'GET',
            transformResponse: ioTransformer(array(Session)),
        }));
    }
    getSession(sessionId) {
        return this.fetch(createJsonRequest({
            path: `/sessions/${sessionId}`,
            method: 'GET',
            transformResponse: ioTransformer(Session),
        }));
    }
    createSession(session) {
        return this.fetch(createJsonRequest({
            path: `/sessions`,
            method: 'POST',
            body: session,
            transformResponse: ioTransformer(type({ id: string })),
        }));
    }
    updateSession(session) {
        return this.fetch(createJsonRequest({
            path: `/sessions/${session.id}`,
            method: 'PUT',
            body: session,
            transformResponse: ioTransformer(voidType),
        }));
    }
    deleteSession(sessionId) {
        return this.fetch(createJsonRequest({
            path: `/sessions/${sessionId}`,
            method: 'DELETE',
            body: { sessionId },
            transformResponse: ioTransformer(voidType),
        }));
    }
}
//# sourceMappingURL=session-api.js.map