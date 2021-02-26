import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Distribution, useStudyMetadata, } from '../core';
import { cx } from './Utils';
export function Variable(props) {
    var _a, _b, _c, _d;
    const { entity, variable, filteredEntityCount, totalEntityCount, sessionState, } = props;
    const studyMetadata = useStudyMetadata();
    const percent = filteredEntityCount &&
        totalEntityCount &&
        (filteredEntityCount / totalEntityCount).toLocaleString(undefined, {
            style: 'percent',
        });
    const filters = (_b = (_a = sessionState.session) === null || _a === void 0 ? void 0 : _a.filters) !== null && _b !== void 0 ? _b : [];
    return (_jsxs("div", { children: [_jsxs("div", Object.assign({ className: cx('-VariableEntityHeader') }, { children: [_jsx("h2", { children: entity.displayName }, void 0),
                    _jsxs("div", { children: ["Your subset includes ", filteredEntityCount === null || filteredEntityCount === void 0 ? void 0 : filteredEntityCount.toLocaleString(), ' ', entity.displayName, " (", percent, ")."] }, void 0)] }), void 0),
            _jsx("div", { children: (_c = sessionState.session) === null || _c === void 0 ? void 0 : _c.filters.map((f) => (_jsxs("div", { children: [_jsx("button", Object.assign({ type: "button", onClick: () => sessionState.setFilters(filters.filter((_f) => _f !== f)) }, { children: "remove" }), void 0),
                        _jsx("code", { children: JSON.stringify(f) }, void 0)] }, `${f.entityId}_${f.variableId}`))) }, void 0),
            _jsx("div", Object.assign({ className: "filter-param" }, { children: _jsx(Distribution, { filters: (_d = sessionState.session) === null || _d === void 0 ? void 0 : _d.filters, onFiltersChange: sessionState.setFilters, studyMetadata: studyMetadata, entity: entity, variable: variable }, void 0) }), void 0)] }, void 0));
}
//# sourceMappingURL=Variable.js.map