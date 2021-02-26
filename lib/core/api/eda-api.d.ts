/// <reference types="lodash" />
import { FetchClient } from '@veupathdb/web-common/lib/util/api';
import { TypeOf } from 'io-ts';
import { Filter } from '../types/filter';
import { StudyMetadata, StudyOverview } from '../types/study';
export declare type StudyResponse = TypeOf<typeof StudyResponse>;
export declare const StudyResponse: import("io-ts").TypeC<{
    study: import("io-ts").IntersectionC<[import("io-ts").TypeC<{
        id: import("io-ts").StringC;
        datasetId: import("io-ts").StringC;
    }>, import("io-ts").TypeC<{
        rootEntity: import("io-ts").Type<import("../types/study").StudyEntity, import("../types/study").StudyEntity, unknown>;
    }>]>;
}>;
export interface DistributionRequestParams {
    filters: Filter[];
}
export declare type DistributionResponse = TypeOf<typeof DistributionResponse>;
export declare const DistributionResponse: import("io-ts").TypeC<{
    entitiesCount: import("io-ts").NumberC;
    distribution: import("io-ts").RecordC<import("io-ts").StringC, import("io-ts").NumberC>;
}>;
export declare class SubsettingClient extends FetchClient {
    static getClient: ((baseUrl: string) => SubsettingClient) & import("lodash").MemoizedFunction;
    getStudies(): Promise<StudyOverview[]>;
    getStudyMetadata(studyId: string): Promise<StudyMetadata>;
    getEntityCount(studyId: string, entityId: string, filters: Filter[]): Promise<{
        count: number;
    }>;
    getDistribution(studyId: string, entityId: string, variableId: string, params: DistributionRequestParams): Promise<DistributionResponse>;
}
//# sourceMappingURL=eda-api.d.ts.map