var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Loading } from '@veupathdb/wdk-client/lib/Components';
import FieldFilter from '@veupathdb/wdk-client/lib/Components/AttributeFilter/FieldFilter';
import EmptyState from '@veupathdb/wdk-client/lib/Components/Mesa/Ui/EmptyState';
import { ErrorBoundary } from '@veupathdb/wdk-client/lib/Controllers';
import { usePromise } from '../hooks/promise';
import { fromEdaFilter, toEdaFilter, toWdkVariableSummary, } from '../utils/wdk-filter-param-adapter';
import { useSubsettingClient } from '../hooks/workspace';
export function Distribution(props) {
    var _a;
    const { studyMetadata, entity, variable, filters, onFiltersChange } = props;
    const subsettingClient = useSubsettingClient();
    const variableSummary = usePromise(() => __awaiter(this, void 0, void 0, function* () {
        // remove filter for active variable so it is not reflected in the foreground
        const otherFilters = filters === null || filters === void 0 ? void 0 : filters.filter((f) => f.entityId !== entity.id || f.variableId !== variable.id);
        const bg$ = subsettingClient.getDistribution(studyMetadata.id, entity.id, variable.id, {
            filters: [],
        });
        // If there are no filters, reuse background for foreground.
        // This is an optimization that saves a call to the backend.
        const fg$ = (otherFilters === null || otherFilters === void 0 ? void 0 : otherFilters.length)
            ? subsettingClient.getDistribution(studyMetadata.id, entity.id, variable.id, {
                filters: otherFilters,
            })
            : bg$;
        const [bg, fg] = yield Promise.all([bg$, fg$]);
        return toWdkVariableSummary(fg, bg, variable);
    }), [subsettingClient, studyMetadata, variable, entity, filters]);
    return variableSummary.pending ? (_jsx(Loading, {}, void 0)) : variableSummary.error ? (_jsx("div", { children: String(variableSummary.error) }, void 0)) : variableSummary.value ? (variableSummary.value.distribution.length === 0 ? (_jsx("div", Object.assign({ className: "MesaComponent" }, { children: _jsx(EmptyState, { culprit: "nodata" }, void 0) }), void 0)) : (_jsx(ErrorBoundary, { children: _jsx(FieldFilter, { displayName: entity.displayName, dataCount: variableSummary.value.entitiesCount, filteredDataCount: variableSummary.value.filteredEntitiesCount, filters: filters === null || filters === void 0 ? void 0 : filters.map((f) => fromEdaFilter(f)), activeField: (_a = variableSummary.value) === null || _a === void 0 ? void 0 : _a.activeField, activeFieldState: {
                loading: false,
                summary: {
                    valueCounts: variableSummary.value.distribution,
                    internalsCount: variableSummary.value.entitiesCount,
                    internalsFilteredCount: variableSummary.value.filteredEntitiesCount,
                },
            }, onFiltersChange: (filters) => onFiltersChange(filters.map((f) => toEdaFilter(f, entity.id))), onMemberSort: logEvent('onMemberSort'), onMemberSearch: logEvent('onMemberSearch'), onRangeScaleChange: logEvent('onRangeScaleChange'), selectByDefault: false }, void 0) }, void 0))) : null;
}
function logEvent(tag) {
    return function noop(...args) {
        console.log('Tagged event ::', tag + ' ::', ...args);
    };
}
//# sourceMappingURL=Distribution.js.map