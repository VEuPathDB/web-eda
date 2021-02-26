var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router';
import { EDAWorkspaceContainer, SubsettingClient } from '../core';
import { EDASession } from './EDASession';
import { EDAWorkspaceHeading } from './EDAWorkspaceHeading';
import { mockSessionStore } from './Mocks';
import { cx } from './Utils';
export function EDAWorkspace(props) {
    const { url } = useRouteMatch();
    const subsettingClient = useMemo(() => new (class extends SubsettingClient {
        constructor() {
            super({ baseUrl: props.edaServiceUrl });
        }
        getStudyMetadata() {
            const _super = Object.create(null, {
                getStudyMetadata: { get: () => super.getStudyMetadata }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return _super.getStudyMetadata.call(this, 'GEMSCC0002-1');
            });
        }
    })(), [props.edaServiceUrl]);
    const makeVariableLink = useCallback((entityId, variableId) => `${url}/variables/${entityId}/${variableId}`, [url]);
    return (_jsxs(EDAWorkspaceContainer, Object.assign({ sessionId: props.sessionId, studyId: props.studyId, className: cx(), sessionClient: mockSessionStore, subsettingClient: subsettingClient, makeVariableLink: makeVariableLink }, { children: [_jsx(EDAWorkspaceHeading, {}, void 0),
            _jsx(EDASession, { sessionId: props.sessionId }, void 0)] }), void 0));
}
//# sourceMappingURL=EDAWorkspace.js.map