/// <reference types="react" />
/// <reference types="lodash" />
import { StudyMetadata, StudyRecordClass, StudyRecord } from '../types/study';
import { SubsettingClient } from '../api/eda-api';
interface StudyState {
    studyRecordClass: StudyRecordClass;
    studyRecord: StudyRecord;
    studyMetadata: StudyMetadata;
}
export declare const StudyContext: import("react").Context<StudyState | undefined>;
export declare function useWdkStudyRecord(datasetId: string): {
    studyRecord: import("@veupathdb/wdk-client/lib/Utils/WdkModel").RecordInstance;
    studyRecordClass: Pick<import("@veupathdb/wdk-client/lib/Utils/WdkModel").RecordClass, "displayName" | "description" | "attributes" | "iconName" | "properties" | "fullName" | "urlSegment" | "displayNamePlural" | "shortDisplayName" | "shortDisplayNamePlural" | "recordIdAttributeName" | "primaryKeyColumnRefs" | "tables" | "formats" | "useBasket" | "searches"> & {
        attributesMap: import("lodash").Dictionary<import("@veupathdb/wdk-client/lib/Utils/WdkModel").AttributeField>;
        tablesMap: import("lodash").Dictionary<import("@veupathdb/wdk-client/lib/Utils/WdkModel").TableField>;
    };
} | undefined;
export declare function useStudyMetadata(datasetId: string, store: SubsettingClient): import("./promise").PromiseHookState<{
    id: string;
    datasetId: string;
} & {
    rootEntity: import("../types/study").StudyEntity;
}>;
export {};
//# sourceMappingURL=study.d.ts.map