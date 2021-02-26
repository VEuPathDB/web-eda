import * as t from 'io-ts';
import { RecordClass, RecordInstance } from '@veupathdb/wdk-client/lib/Utils/WdkModel';
export declare type StudyRecordClass = RecordClass;
export declare type StudyRecord = RecordInstance;
export declare type StudyVariable = t.TypeOf<typeof StudyVariable>;
export declare const StudyVariable: t.IntersectionC<[t.TypeC<{
    id: t.StringC;
    providerLabel: t.StringC;
    displayName: t.StringC;
    type: t.StringC;
    isMultiValued: t.BooleanC;
}>, t.PartialC<{
    parentId: t.StringC;
    displayType: t.StringC;
    dataShape: t.StringC;
}>]>;
declare type _StudyEntityBase = t.TypeOf<typeof _StudyEntityBase>;
declare const _StudyEntityBase: t.TypeC<{
    id: t.StringC;
    displayName: t.StringC;
    description: t.StringC;
    variables: t.ArrayC<t.IntersectionC<[t.TypeC<{
        id: t.StringC;
        providerLabel: t.StringC;
        displayName: t.StringC;
        type: t.StringC;
        isMultiValued: t.BooleanC;
    }>, t.PartialC<{
        parentId: t.StringC;
        displayType: t.StringC;
        dataShape: t.StringC;
    }>]>>;
}>;
export declare type StudyEntity = _StudyEntityBase & {
    children?: StudyEntity[];
};
export declare const StudyEntity: t.Type<StudyEntity>;
export declare type StudyOverview = t.TypeOf<typeof StudyOverview>;
export declare const StudyOverview: t.TypeC<{
    id: t.StringC;
    datasetId: t.StringC;
}>;
export declare type StudyMetadata = t.TypeOf<typeof StudyMetadata>;
export declare const StudyMetadata: t.IntersectionC<[t.TypeC<{
    id: t.StringC;
    datasetId: t.StringC;
}>, t.TypeC<{
    rootEntity: t.Type<StudyEntity, StudyEntity, unknown>;
}>]>;
export {};
//# sourceMappingURL=study.d.ts.map