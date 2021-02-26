import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Loading } from '@veupathdb/wdk-client/lib/Components';
import { useWdkService } from '@veupathdb/wdk-client/lib/Hooks/WdkServiceHook';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { SubsettingClient } from '../core';
import { usePromise } from '../core/hooks/promise';
export function StudyList(props) {
    const subsettingClient = SubsettingClient.getClient(props.edaServiceUrl);
    const datasets = useWdkService((wdkService) => wdkService.getAnswerJson({
        searchName: 'Studies',
        searchConfig: {
            parameters: {},
        },
    }, {
        attributes: ['dataset_id'],
    }), []);
    const studies = usePromise(() => subsettingClient.getStudies(), [
        subsettingClient,
    ]);
    if (studies.error)
        return _jsx("div", { children: String(studies.error) }, void 0);
    if (studies.value == null || datasets == null)
        return _jsx(Loading, {}, void 0);
    return (_jsxs("div", { children: [_jsx("h1", { children: "EDA Workspace" }, void 0),
            _jsx("h2", { children: "Choose a study" }, void 0),
            _jsx("ul", { children: studies.value.map((study) => {
                    const dataset = datasets.records.find((r) => r.attributes.dataset_id === study.datasetId);
                    return dataset ? (_jsx("li", { children: _jsx(Link, Object.assign({ to: `/eda-session/${dataset.attributes.dataset_id}` }, { children: safeHtml(dataset.displayName) }), void 0) }, void 0)) : null;
                }) }, void 0)] }, void 0));
}
//# sourceMappingURL=StudyList.js.map