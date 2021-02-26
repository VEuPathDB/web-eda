import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EDASessionListContainer } from '../core';
import { SubsettingClient } from '../core/api/eda-api';
import { mockSessionStore } from './Mocks';
import { EDAWorkspaceHeading } from './EDAWorkspaceHeading';
import { SessionList } from './SessionList';
import { cx } from './Utils';
import { useMemo } from 'react';
export function EDASessionList(props) {
    const subsettingClient = useMemo(() => new SubsettingClient({
        baseUrl: props.edaServiceUrl,
    }), [props.edaServiceUrl]);
    return (_jsxs(EDASessionListContainer, Object.assign({ studyId: props.studyId, subsettingClient: subsettingClient, className: cx(), sessionClient: mockSessionStore }, { children: [_jsx(EDAWorkspaceHeading, {}, void 0),
            _jsx(SessionList, { sessionStore: mockSessionStore }, void 0)] }), void 0));
}
//# sourceMappingURL=EDASessionList.js.map