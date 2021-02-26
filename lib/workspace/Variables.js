var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useSession, Distribution, useStudyMetadata, useSubsettingClient, } from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { startCase } from 'lodash';
import { cx } from './Utils';
import { usePromise } from '../core/hooks/promise';
import { useHistory } from 'react-router';
const variableKeys = [
    // 'displayName',
    'providerLabel',
    'type',
    'dataShape',
];
export function VariablesRoute(props) {
    const { variableId, entityId } = props;
    const studyMetadata = useStudyMetadata();
    const history = useHistory();
    const entities = Array.from(preorder(studyMetadata.rootEntity, (e) => e.children || []));
    const entity = entityId
        ? entities.find((e) => e.id === entityId)
        : entities[0];
    const variable = entity &&
        ((variableId && entity.variables.find((v) => v.id === variableId)) ||
            entity.variables.find((v) => v.dataShape != null));
    useEffect(() => {
        if (entity != null && variable != null) {
            if (entityId == null)
                history.replace(`${history.location.pathname}/${entity.id}/${variable.id}`);
            else if (variableId == null)
                history.replace(`${history.location.pathname}/${variable.id}`);
        }
    }, [entityId, variableId, entity, variable, history]);
    if (entity == null || variable == null)
        return _jsx("div", { children: "Could not find specified variable." }, void 0);
    // Prevent <Variables> from rendering multiple times
    if (entityId == null || variableId == null)
        return null;
    return (_jsx(Variables, { sessionId: props.sessionId, entity: entity, variable: variable }, void 0));
}
export function Variables(props) {
    var _a, _b;
    const { sessionId, entity, variable } = props;
    const studyMetadata = useStudyMetadata();
    const subsettingClient = useSubsettingClient();
    const history = useHistory();
    const entities = Array.from(preorder(studyMetadata.rootEntity, (e) => e.children || []));
    const { session, setFilters } = useSession(sessionId);
    const entityCount = usePromise(() => subsettingClient.getEntityCount(studyMetadata.id, entity.id, []), [studyMetadata.id, entity]);
    const filteredCount = usePromise(() => __awaiter(this, void 0, void 0, function* () {
        var _c;
        if (session == null)
            return;
        return subsettingClient.getEntityCount(studyMetadata.id, entity.id, (_c = session === null || session === void 0 ? void 0 : session.filters) !== null && _c !== void 0 ? _c : []);
    }), [studyMetadata.id, entity, session]);
    if (session == null)
        return null;
    return (_jsxs("div", Object.assign({ className: cx('-Variables') }, { children: [_jsxs("div", Object.assign({ style: { margin: '.5em 0' } }, { children: ["Select an entity:", _jsx("select", Object.assign({ value: entity.id, onChange: (e) => {
                            history.replace(e.currentTarget.value);
                        } }, { children: entities.map((entity) => (_jsx("option", Object.assign({ value: `../${entity.id}/${entity.variables[0].id}` }, { children: entity.displayName }), void 0))) }), void 0)] }), void 0),
            _jsxs("div", Object.assign({ style: { margin: '.5em 0' } }, { children: ["Select a variable:", _jsx("select", Object.assign({ value: variable.id, onChange: (e) => history.replace(e.currentTarget.value) }, { children: entity.variables.map((variable) => variable.dataShape && (_jsxs("option", Object.assign({ value: variable.id }, { children: [variable.displayName, " (", variable.dataShape, " ", variable.type, ")"] }), void 0))) }), void 0)] }), void 0),
            _jsxs("div", { children: [_jsx("h3", { children: "Filters" }, void 0),
                    session.filters ? (session.filters.map((f) => (_jsxs("div", { children: [_jsx("button", Object.assign({ type: "button", onClick: () => setFilters(session.filters.filter((_f) => _f !== f)) }, { children: "Remove" }), void 0),
                            _jsx("code", { children: JSON.stringify(f) }, void 0)] }, void 0)))) : (_jsx("div", { children: _jsx("i", { children: "No filters" }, void 0) }, void 0))] }, void 0),
            _jsxs("div", { children: [_jsxs("h3", { children: [entity.displayName, " (", (_a = filteredCount.value) === null || _a === void 0 ? void 0 : _a.count.toLocaleString(), " of", ' ', (_b = entityCount.value) === null || _b === void 0 ? void 0 : _b.count.toLocaleString(), ")"] }, void 0),
                    _jsx("h4", { children: variable.displayName }, void 0),
                    _jsx("dl", { children: variableKeys.map((key) => (_jsxs("div", { children: [_jsx("dt", { children: startCase(key) }, void 0),
                                _jsx("dd", { children: variable[key] }, void 0)] }, void 0))) }, void 0),
                    _jsx("h4", { children: "Distribution" }, void 0),
                    _jsx("div", Object.assign({ className: "filter-param" }, { children: _jsx(Distribution, { filters: session.filters, onFiltersChange: setFilters, studyMetadata: studyMetadata, entity: entity, variable: variable }, void 0) }), void 0)] }, void 0)] }), void 0));
}
//# sourceMappingURL=Variables.js.map