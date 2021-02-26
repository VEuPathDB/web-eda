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
import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import { useHistory } from 'react-router';
import { ActionIconButton } from './ActionIconButton';
import { cx } from './Utils';
export function SessionSummary(props) {
    const { session, setSessionName, copySession, saveSession, deleteSession, } = props;
    const history = useHistory();
    const handleCopy = () => __awaiter(this, void 0, void 0, function* () {
        const res = yield copySession();
        history.push(res.id);
    });
    return (_jsxs("div", Object.assign({ className: cx('-SessionSummary') }, { children: [_jsx(SaveableTextEditor, { className: cx('-SessionNameEditBox'), value: session.name, onSave: setSessionName }, void 0),
            _jsx(ActionIconButton, { iconClassName: "clone", hoverText: "Copy session", action: handleCopy }, void 0),
            _jsx(ActionIconButton, { iconClassName: "floppy-o", hoverText: "Save session", action: saveSession }, void 0),
            _jsx(ActionIconButton, { iconClassName: "trash", hoverText: "Delete session", action: deleteSession }, void 0)] }), void 0));
}
//# sourceMappingURL=SessionSummary.js.map