import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from './Utils';
import { SessionSummary } from './SessionSummary';
import { useSession, useStudyRecord } from '../core';
import WorkspaceNavigation from '@veupathdb/wdk-client/lib/Components/Workspace/WorkspaceNavigation';
import { Redirect, Route } from 'react-router';
import { VariablesRoute } from './Variables';
export function EDASession(props) {
    const { sessionId } = props;
    const { session, setName, copySession, saveSession, deleteSession, } = useSession(sessionId);
    const studyRecord = useStudyRecord();
    if (session == null)
        return null;
    const routeBase = `/eda/${studyRecord.id.map((p) => p.value).join('/')}/${session.id}`;
    return (_jsxs("div", Object.assign({ className: cx('-Session') }, { children: [_jsx(WorkspaceNavigation, { heading: _jsx(SessionSummary, { session: session, setSessionName: setName, copySession: copySession, saveSession: saveSession, deleteSession: deleteSession }, void 0), routeBase: routeBase, items: [
                    {
                        display: 'Browse and subset',
                        route: '/variables',
                    },
                    {
                        display: 'Visualize',
                        route: '/visualizations',
                    },
                ] }, void 0),
            _jsx(Route, { path: routeBase, exact: true, render: () => _jsx(Redirect, { to: `${routeBase}/variables` }, void 0) }, void 0),
            _jsx(Route, { path: `${routeBase}/variables/:entityId?/:variableId?`, render: (props) => _jsx(VariablesRoute, Object.assign({ sessionId: session.id }, props.match.params), void 0) }, void 0),
            _jsx(Route, { path: `${routeBase}/visualizations`, component: () => _jsx("h3", { children: "TODO" }, void 0) }, void 0)] }), void 0));
}
//# sourceMappingURL=EDASession.js.map