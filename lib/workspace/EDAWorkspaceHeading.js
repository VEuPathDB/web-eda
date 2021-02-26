import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@veupathdb/wdk-client/lib/Components';
import { cx } from './Utils';
import { StudySummary } from './StudySummary';
import { useStudyRecord, useStudyRecordClass } from '../core';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
export function EDAWorkspaceHeading() {
    const studyRecord = useStudyRecord();
    const studyRecordClass = useStudyRecordClass();
    return (_jsxs("div", Object.assign({ className: cx('-Heading') }, { children: [_jsx("h1", { children: "Explore and Analyze" }, void 0),
            _jsxs("h2", { children: ["Study: ", safeHtml(studyRecord.displayName)] }, void 0),
            _jsx(StudySummary, { studyRecord: studyRecord, studyRecordClass: studyRecordClass }, void 0),
            _jsxs("div", Object.assign({ className: cx('-Linkouts') }, { children: [_jsx(Link, Object.assign({ target: "_blank", to: `/record/dataset/${studyRecord.id.map((p) => p.value).join('/')}` }, { children: "Study details" }), void 0), "|", _jsx("button", Object.assign({ type: "button", className: "link", onClick: () => alert('todo') }, { children: "Bulk download" }), void 0)] }), void 0)] }), void 0));
}
//# sourceMappingURL=EDAWorkspaceHeading.js.map