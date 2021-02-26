import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from './Utils';
import { SessionSummary } from './SessionSummary';
import { useSession } from '../core';
import WorkspaceNavigation from '@veupathdb/wdk-client/lib/Components/Workspace/WorkspaceNavigation';
import { Redirect, Route, useRouteMatch, } from 'react-router';
import { SubsettingRoute } from './Subsetting';
import { DefaultVariableRedirect } from './DefaultVariableRedirect';
export function SessionPanel(props) {
    const { sessionId } = props;
    const { session, setName, copySession, saveSession, deleteSession, } = useSession(sessionId);
    const { url: routeBase } = useRouteMatch();
    if (session == null)
        return null;
    return (_jsxs("div", Object.assign({ className: cx('-Session') }, { children: [_jsx(WorkspaceNavigation, { heading: _jsx(SessionSummary, { session: session, setSessionName: setName, copySession: copySession, saveSession: saveSession, deleteSession: deleteSession }, void 0), routeBase: routeBase, items: [
                    {
                        display: 'Browse and subset',
                        route: '/variables',
                        exact: false,
                    },
                    {
                        display: 'Visualize',
                        route: '/visualizations',
                        exact: false,
                    },
                ] }, void 0),
            _jsx(Route, { path: routeBase, exact: true, render: () => _jsx(Redirect, { to: `${routeBase}/variables` }, void 0) }, void 0),
            _jsx(Route, { path: `${routeBase}/variables`, exact: true, render: () => _jsx(DefaultVariableRedirect, {}, void 0) }, void 0),
            _jsx(Route, { path: `${routeBase}/variables/:entityId/:variableId`, render: (props) => _jsx(SubsettingRoute, Object.assign({ sessionId: session.id }, props.match.params), void 0) }, void 0),
            _jsx(Route, { path: `${routeBase}/visualizations`, component: () => _jsx("h3", { children: "TODO" }, void 0) }, void 0)] }), void 0));
}
//# sourceMappingURL=SessionPanel.js.map