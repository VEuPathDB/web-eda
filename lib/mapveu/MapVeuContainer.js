import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { EDASessionListContainer, EDAWorkspaceContainer } from '../core';
import { SubsettingClient } from '../core/api/eda-api';
import { Route, Switch, useRouteMatch, } from 'react-router';
import { SessionList } from './MapVeuSessionList';
import { MapVeuSession } from './MapVeuSession';
import { mockSessionStore } from './Mocks';
import { StudyList } from './StudyList';
const edaClient = new (class extends SubsettingClient {
    getStudyMetadata() {
        // Temporarily hardcode a study id. We don't yet have a way to
        // discover the id used by the subsetting service, from the WDK
        // study record.
        return super.getStudyMetadata('SCORECX01-1');
    }
})({ baseUrl: '/eda-service' });
export function MapVeuContainer() {
    // This will get the matched path of the active parent route.
    // This is useful so we don't have to hardcode the path root.
    const { path } = useRouteMatch();
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "MapVEu" }, void 0),
            _jsxs(Switch, { children: [_jsx(Route, { path: `${path}/:studyId/:sessionId`, render: (props) => (_jsx(EDAWorkspaceContainer, Object.assign({ studyId: props.match.params.studyId, sessionId: props.match.params.sessionId, subsettingClient: edaClient, sessionClient: mockSessionStore }, { children: _jsx(MapVeuSession, { sessionId: props.match.params.sessionId }, void 0) }), void 0)) }, void 0),
                    _jsx(Route, { path: `${path}/:studyId`, render: (props) => (_jsx(EDASessionListContainer, Object.assign({ studyId: props.match.params.studyId, sessionClient: mockSessionStore, subsettingClient: edaClient }, { children: _jsx(SessionList, { studyId: props.match.params.studyId, sessionStore: mockSessionStore }, void 0) }), void 0)) }, void 0),
                    _jsx(Route, { path: path, component: StudyList }, void 0)] }, void 0)] }, void 0));
}
//# sourceMappingURL=MapVeuContainer.js.map