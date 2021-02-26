import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSession, useStudyMetadata, } from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { useEffect } from 'react';
import { useHistory } from 'react-router';
import { cx } from './Utils';
import { Variable } from './Variable';
import { useEntityCounts } from '../core/hooks/entityCounts';
import { VariableLink } from '../core/components/VariableLink';
export function SubsettingRoute(props) {
    const { variableId, entityId, sessionId } = props;
    const session = useSession(sessionId);
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
    return (_jsx(Subsetting, { sessionState: session, entity: entity, entities: entities, variable: variable }, void 0));
}
export function Subsetting(props) {
    var _a;
    const { entity, entities, variable, sessionState } = props;
    const totalCounts = useEntityCounts();
    const filteredCounts = useEntityCounts((_a = sessionState.session) === null || _a === void 0 ? void 0 : _a.filters);
    const totalEntityCount = totalCounts.value && totalCounts.value[entity.id];
    const filteredEntityCount = filteredCounts.value && filteredCounts.value[entity.id];
    return (_jsxs("div", Object.assign({ className: cx('-Subsetting') }, { children: [_jsxs("div", { children: [_jsx("h2", { children: "ENTITIES" }, void 0),
                    _jsx("ul", Object.assign({ style: {
                            border: '1px solid',
                            borderRadius: '.25em',
                            height: '80vh',
                            overflow: 'auto',
                            padding: '1em 2em',
                            margin: 0,
                        } }, { children: entities.map((e) => {
                            var _a, _b;
                            return (_jsx("li", { children: _jsx(VariableLink, Object.assign({ replace: true, style: e.id === entity.id ? { fontWeight: 'bold' } : undefined, entityId: e.id, variableId: (_b = (_a = e.variables.find((v) => v.displayType != null)) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '' }, { children: e.displayName }), void 0) }, void 0));
                        }) }), void 0)] }, void 0),
            _jsxs("div", { children: [_jsx("h2", { children: "VARIABLES" }, void 0),
                    _jsx("ul", Object.assign({ style: {
                            border: '1px solid',
                            borderRadius: '.25em',
                            height: '80vh',
                            overflow: 'auto',
                            padding: '1em 2em',
                            margin: 0,
                        } }, { children: entity.variables.map((v) => v.dataShape && (_jsx("li", { children: _jsxs(VariableLink, Object.assign({ replace: true, style: v.id === variable.id ? { fontWeight: 'bold' } : undefined, entityId: entity.id, variableId: v.id }, { children: [v.displayName, " (", v.dataShape, " ", v.type, ")"] }), void 0) }, void 0))) }), void 0)] }, void 0),
            _jsx("div", { children: _jsx(Variable, { entity: entity, variable: variable, sessionState: sessionState, totalEntityCount: totalEntityCount, filteredEntityCount: filteredEntityCount }, void 0) }, void 0)] }), void 0));
}
//# sourceMappingURL=Subsetting.js.map