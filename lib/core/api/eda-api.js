/* eslint-disable @typescript-eslint/no-redeclare */
import { createJsonRequest, FetchClient, } from '@veupathdb/web-common/lib/util/api';
import { array, number, record, string, type } from 'io-ts';
import { memoize } from 'lodash';
import { StudyMetadata, StudyOverview } from '../types/study';
import { ioTransformer } from './ioTransformer';
export const StudyResponse = type({
    study: StudyMetadata,
});
export const DistributionResponse = type({
    entitiesCount: number,
    distribution: record(string, number),
});
export class SubsettingClient extends FetchClient {
    getStudies() {
        return this.fetch(createJsonRequest({
            method: 'GET',
            path: '/studies',
            transformResponse: (res) => ioTransformer(type({ studies: array(StudyOverview) }))(res).then((r) => r.studies),
        }));
    }
    getStudyMetadata(studyId) {
        return this.fetch(createJsonRequest({
            method: 'GET',
            path: `/studies/${studyId}`,
            transformResponse: (res) => ioTransformer(StudyResponse)(res).then((r) => r.study),
        }));
    }
    getEntityCount(studyId, entityId, filters) {
        return this.fetch(createJsonRequest({
            method: 'POST',
            path: `/studies/${studyId}/entities/${entityId}/count`,
            body: { filters },
            transformResponse: ioTransformer(type({ count: number })),
        }));
    }
    getDistribution(studyId, entityId, variableId, params) {
        return this.fetch(createJsonRequest({
            method: 'POST',
            path: `/studies/${studyId}/entities/${entityId}/variables/${variableId}/distribution`,
            body: params,
            transformResponse: ioTransformer(DistributionResponse),
        }));
    }
}
SubsettingClient.getClient = memoize((baseUrl) => new SubsettingClient({ baseUrl }));
//# sourceMappingURL=eda-api.js.map