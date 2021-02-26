/// <reference types="react" />
import { SubsettingClient } from '../api/eda-api';
import { SessionClient } from '../api/session-api';
import { StudyMetadata, StudyRecord, StudyRecordClass } from '../types/study';
interface WorkspaceContextValue {
    studyRecordClass: StudyRecordClass;
    studyRecord: StudyRecord;
    studyMetadata: StudyMetadata;
    sessionClient: SessionClient;
    subsettingClient: SubsettingClient;
    makeVariableLink?: (entityId: string, variableId: string) => string;
}
export declare const WorkspaceContext: import("react").Context<WorkspaceContextValue | undefined>;
export {};
//# sourceMappingURL=WorkspaceContext.d.ts.map