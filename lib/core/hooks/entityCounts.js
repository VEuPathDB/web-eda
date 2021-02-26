var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { usePromise } from './promise';
import { useStudyMetadata, useSubsettingClient } from './workspace';
export function useEntityCounts(filters) {
    const { id, rootEntity } = useStudyMetadata();
    const subsettingClient = useSubsettingClient();
    return usePromise(() => __awaiter(this, void 0, void 0, function* () {
        const counts = {};
        for (const entity of preorder(rootEntity, (e) => { var _a; return (_a = e.children) !== null && _a !== void 0 ? _a : []; })) {
            const { count } = yield subsettingClient.getEntityCount(id, entity.id, filters !== null && filters !== void 0 ? filters : []);
            counts[entity.id] = count;
        }
        return counts;
    }), [rootEntity, filters]);
}
//# sourceMappingURL=entityCounts.js.map