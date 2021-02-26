import { jsx as _jsx } from "react/jsx-runtime";
import { Tooltip } from '@veupathdb/wdk-client/lib/Components';
import { renderAttributeValue } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { cx } from './Utils';
export function StudySummary(props) {
    const { studyRecord, studyRecordClass } = props;
    return (_jsx("div", Object.assign({ className: cx('-Summary') }, { children: Object.entries(studyRecord.attributes).map(([name, value]) => value != null && (_jsx(Tooltip, Object.assign({ content: getTooltipContent(studyRecordClass.attributesMap[name]), showEvent: "focus mouseenter", hideEvent: "blur mouseleave" }, { children: renderAttributeValue(value, { tabIndex: 0 }) }), name))) }), void 0));
}
function getTooltipContent(attributeField) {
    const { displayName, help } = attributeField;
    if (help == null)
        return displayName;
    return `${displayName}: ${help}`;
}
//# sourceMappingURL=StudySummary.js.map