import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ErrorStatus from '@veupathdb/wdk-client/lib/Components/PageStatus/Error';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { useStudyMetadata, useWdkStudyRecord } from '../hooks/study';
export function EDAWorkspaceContainer(props) {
    const { studyId, sessionClient, subsettingClient, children, className = 'EDAWorkspace', makeVariableLink, } = props;
    const wdkStudyRecordState = useWdkStudyRecord(studyId);
    const { value: studyMetadata, error: studyMetadataError } = useStudyMetadata(studyId, subsettingClient);
    if (studyMetadataError)
        return (_jsxs(ErrorStatus, { children: [_jsx("h2", { children: "Unable to load study metadata" }, void 0),
                _jsx("pre", { children: String(studyMetadataError) }, void 0)] }, void 0));
    if (wdkStudyRecordState == null || studyMetadata == null)
        return null;
    return (_jsx(WorkspaceContext.Provider, Object.assign({ value: Object.assign(Object.assign({}, wdkStudyRecordState), { studyMetadata,
            sessionClient,
            subsettingClient,
            makeVariableLink }) }, { children: _jsx("div", Object.assign({ className: className }, { children: children }), void 0) }), void 0));
}
//# sourceMappingURL=EDAWorkspaceContainer.js.map