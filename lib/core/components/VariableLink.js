var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useVariableLink } from '../hooks/workspace';
export function VariableLink(props) {
    const { entityId, variableId } = props, rest = __rest(props, ["entityId", "variableId"]);
    return _jsx(Link, Object.assign({}, rest, { to: useVariableLink(entityId, variableId) }), void 0);
}
//# sourceMappingURL=VariableLink.js.map