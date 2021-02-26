import { jsx as _jsx } from "react/jsx-runtime";
import { useStudyMetadata } from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { Redirect, useRouteMatch } from 'react-router';
export function DefaultVariableRedirect() {
    const { url } = useRouteMatch();
    const studyMetadata = useStudyMetadata();
    const entities = Array.from(preorder(studyMetadata.rootEntity, (e) => e.children || []));
    const entity = entities[0];
    const variable = entity && entity.variables.find((v) => v.dataShape != null);
    if (entity == null || variable == null)
        return _jsx("div", { children: "Could not find specified variable." }, void 0);
    // Prevent <Variables> from rendering multiple times
    return _jsx(Redirect, { to: `${url}/${entity.id}/${variable.id}` }, void 0);
}
//# sourceMappingURL=DefaultVariableRedirect.js.map