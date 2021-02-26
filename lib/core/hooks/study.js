var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createContext } from 'react';
import { useWdkServiceWithRefresh } from '@veupathdb/wdk-client/lib/Hooks/WdkServiceHook';
import { preorderSeq } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getTargetType, getScopes, getNodeId, } from '@veupathdb/wdk-client/lib/Utils/CategoryUtils';
import { usePromise } from './promise';
const STUDY_RECORD_CLASS_NAME = 'dataset';
export const StudyContext = createContext(undefined);
export function useWdkStudyRecord(datasetId) {
    return useWdkServiceWithRefresh((wdkService) => __awaiter(this, void 0, void 0, function* () {
        const studyRecordClass = yield wdkService.findRecordClass(STUDY_RECORD_CLASS_NAME);
        const ontology = yield wdkService.getOntology((yield wdkService.getConfig()).categoriesOntologyName);
        const attributes = preorderSeq(ontology.tree)
            .filter((node) => getTargetType(node) === 'attribute' &&
            getScopes(node).includes('eda'))
            .map(getNodeId)
            .toArray();
        const studyRecord = yield wdkService.getRecord(STUDY_RECORD_CLASS_NAME, [{ name: 'dataset_id', value: datasetId }], { attributes });
        return {
            studyRecord,
            studyRecordClass,
        };
    }), [datasetId]);
}
export function useStudyMetadata(datasetId, store) {
    return usePromise(() => __awaiter(this, void 0, void 0, function* () {
        const studies = yield store.getStudies();
        const study = studies.find((s) => s.datasetId === datasetId);
        if (study == null)
            throw new Error('Could not find study with associated dataset id `' + datasetId + '`.');
        return store.getStudyMetadata(study.id);
    }), [datasetId, store]);
}
//# sourceMappingURL=study.js.map