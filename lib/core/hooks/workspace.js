import { WorkspaceContext } from '../context/WorkspaceContext';
import { useNonNullableContext } from './nonNullableContext';
export function useStudyMetadata() {
    return useNonNullableContext(WorkspaceContext).studyMetadata;
}
export function useStudyRecord() {
    return useNonNullableContext(WorkspaceContext).studyRecord;
}
export function useStudyRecordClass() {
    return useNonNullableContext(WorkspaceContext).studyRecordClass;
}
export function useSubsettingClient() {
    return useNonNullableContext(WorkspaceContext).subsettingClient;
}
export function useSessionClient() {
    return useNonNullableContext(WorkspaceContext).sessionClient;
}
export function useVariableLink(entityId, variableId) {
    const { makeVariableLink = defaultMakeVariableLink } = useNonNullableContext(WorkspaceContext);
    return makeVariableLink(entityId, variableId);
}
function defaultMakeVariableLink(entityId, variableId) {
    return `/variables/${entityId}/${variableId}`;
}
//# sourceMappingURL=workspace.js.map