import { SubsettingClient } from '../api/eda-api';
import { SessionClient } from '../api/session-api';
import { StudyMetadata, StudyRecord, StudyRecordClass } from '../types/study';
export declare function useStudyMetadata(): StudyMetadata;
export declare function useStudyRecord(): StudyRecord;
export declare function useStudyRecordClass(): StudyRecordClass;
export declare function useSubsettingClient(): SubsettingClient;
export declare function useSessionClient(): SessionClient;
export declare function useVariableLink(entityId: string, variableId: string): string;
//# sourceMappingURL=workspace.d.ts.map