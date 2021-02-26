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
import { Link, useRouteMatch } from 'react-router-dom';
import { useWdkService } from '@veupathdb/wdk-client/lib/Hooks/WdkServiceHook';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
export function StudyList() {
    const { path } = useRouteMatch();
    const studies = useWdkService((wdkService) => __awaiter(this, void 0, void 0, function* () {
        return wdkService.getAnswerJson({
            searchName: 'Studies',
            searchConfig: {
                parameters: {},
            },
        }, {});
    }));
    if (studies == null)
        return _jsx("div", { children: "Loading..." }, void 0);
    return (_jsxs("div", { children: [_jsx("div", { children: "Choose a study:" }, void 0),
            _jsx("ul", { children: studies.records.map((r) => (_jsx("li", { children: _jsx(Link, Object.assign({ to: `${path}/${r.id.map((p) => p.value).join('/')}` }, { children: safeHtml(r.displayName) }), void 0) }, void 0))) }, void 0)] }, void 0));
}
//# sourceMappingURL=StudyList.js.map