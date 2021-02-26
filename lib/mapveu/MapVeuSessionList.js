var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useStudyRecord } from '../core';
import { useRouteMatch, Link, useHistory } from 'react-router-dom';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { usePromise } from '../core/hooks/promise';
import { Loading } from '@veupathdb/wdk-client/lib/Components';
export function SessionList(props) {
    var _a, _b;
    const { sessionStore, studyId } = props;
    const studyRecord = useStudyRecord();
    const list = usePromise(() => __awaiter(this, void 0, void 0, function* () {
        const studies = yield sessionStore.getSessions();
        return studies.filter((study) => study.id === studyId);
    }), [studyId, sessionStore]);
    const { url } = useRouteMatch();
    const history = useHistory();
    const createSession = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        const { id } = yield sessionStore.createSession({
            name: 'Unnamed session',
            studyId,
            visualizations: [],
            variableUISettings: {},
            derivedVariables: [],
            starredVariables: [],
            filters: [],
        });
        history.push(`${url}/${id}`);
    }), [sessionStore, history, studyId, url]);
    return (_jsxs(_Fragment, { children: [_jsxs("h2", { children: ["Study: ", studyRecord.displayName] }, void 0),
            _jsx("h3", { children: "Saved Sessions" }, void 0),
            _jsx("div", { children: _jsx("button", Object.assign({ className: "btn", type: "button", onClick: createSession }, { children: "New Session" }), void 0) }, void 0),
            list.pending ? (_jsx(Loading, {}, void 0)) : ((_a = list.value) === null || _a === void 0 ? void 0 : _a.length) === 0 ? (_jsx("em", { children: "You do not have any sessions for this study." }, void 0)) : (_jsx("ul", { children: (_b = list.value) === null || _b === void 0 ? void 0 : _b.map((session) => (_jsx("li", { children: _jsx(Link, Object.assign({ to: `${url}/${session.id}` }, { children: safeHtml(session.name) }), void 0) }, void 0))) }, void 0))] }, void 0));
}
//# sourceMappingURL=MapVeuSessionList.js.map