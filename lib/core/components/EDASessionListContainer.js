import { jsx as _jsx } from "react/jsx-runtime";
import { useWdkStudyRecord, useStudyMetadata } from '../hooks/study';
import { LoadError } from '@veupathdb/wdk-client/lib/Components';
import { WorkspaceContext } from '../context/WorkspaceContext';
export function EDASessionListContainer(props) {
    const { studyId, subsettingClient, sessionClient, className = 'EDAWorkspace', children, } = props;
    const studyRecordState = useWdkStudyRecord(studyId);
    const studyMetadata = useStudyMetadata(studyId, subsettingClient);
    if (studyMetadata.error)
        return _jsx(LoadError, {}, void 0);
    if (studyRecordState == null || studyMetadata.value == null)
        return null;
    return (_jsx("div", Object.assign({ className: className }, { children: _jsx(WorkspaceContext.Provider, Object.assign({ value: Object.assign(Object.assign({}, studyRecordState), { studyMetadata: studyMetadata.value, sessionClient,
                subsettingClient }) }, { children: children }), void 0) }), void 0));
}
//# sourceMappingURL=EDASessionListContainer.js.map