import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router';
import { EDAWorkspaceContainer, SubsettingClient } from '../core';
import { EDAWorkspaceHeading } from './EDAWorkspaceHeading';
import { mockSessionStore } from './Mocks';
import { SessionPanel } from './SessionPanel';
import { cx } from './Utils';
export function WorkspaceContainer(props) {
    const { url } = useRouteMatch();
    const subsettingClient = useMemo(() => new SubsettingClient({
        baseUrl: props.edaServiceUrl,
    }), [props.edaServiceUrl]);
    const makeVariableLink = useCallback((entityId, variableId) => `${url}/variables/${entityId}/${variableId}`, [url]);
    return (_jsxs(EDAWorkspaceContainer, Object.assign({ sessionId: props.sessionId, studyId: props.studyId, className: cx(), sessionClient: mockSessionStore, subsettingClient: subsettingClient, makeVariableLink: makeVariableLink }, { children: [_jsx(EDAWorkspaceHeading, {}, void 0),
            _jsx(SessionPanel, { sessionId: props.sessionId }, void 0)] }), void 0));
}
//# sourceMappingURL=WorkspaceContainer.js.map