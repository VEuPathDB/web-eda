import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSession, useStudyRecord, useStudyMetadata } from '../core';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
export function MapVeuSession(props) {
    const { sessionId } = props;
    const studyRecord = useStudyRecord();
    const studyMetadata = useStudyMetadata();
    const { session } = useSession(sessionId);
    if (session == null)
        return _jsx("div", { children: "No session found" }, void 0);
    const entities = Array.from(preorder(studyMetadata.rootEntity, (e) => { var _a; return (_a = e.children) !== null && _a !== void 0 ? _a : []; }));
    return (_jsxs(_Fragment, { children: [_jsxs("h2", { children: ["Study: ", studyRecord.displayName] }, void 0),
            _jsx("h3", { children: "Study details" }, void 0),
            _jsxs("dl", { children: [_jsx("dt", { children: "Entities" }, void 0),
                    _jsx("dd", { children: _jsx("ul", { children: entities.map((e) => (_jsx("li", { children: safeHtml(e.displayName) }, void 0))) }, void 0) }, void 0)] }, void 0),
            _jsx("h3", { children: "Session details" }, void 0),
            _jsxs("dl", { children: [' ', _jsx("dt", { children: "Name" }, void 0),
                    _jsx("dd", { children: session === null || session === void 0 ? void 0 : session.name }, void 0),
                    _jsx("dt", { children: "Created" }, void 0),
                    _jsx("dd", { children: session.created }, void 0)] }, void 0)] }, void 0));
}
//# sourceMappingURL=MapVeuSession.js.map