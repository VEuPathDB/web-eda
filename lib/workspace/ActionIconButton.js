import { jsx as _jsx } from "react/jsx-runtime";
import { IconAlt } from '@veupathdb/wdk-client/lib/Components';
import { cx } from './Utils';
export function ActionIconButton(props) {
    const { action, hoverText, iconClassName } = props;
    return (_jsx("div", Object.assign({ className: cx('-ActionIconButton') }, { children: _jsx("button", Object.assign({ type: "button", title: hoverText, className: "link", onClick: action }, { children: _jsx(IconAlt, { fa: iconClassName }, void 0) }), void 0) }), void 0));
}
//# sourceMappingURL=ActionIconButton.js.map